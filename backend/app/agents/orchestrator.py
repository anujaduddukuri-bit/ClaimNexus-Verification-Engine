import asyncio
import time
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.schemas.domain import (
    QueryRequest, ModelRunResult, ClaimSchema, ClusterSchema,
    ConflictSchema, CriticFinding, SynthesisSchema, ExecutionDetailResponse, ExecutionEvent,
    EvidenceItem
)
from app.providers.factory import ProviderFactory
from app.consensus.claim_analyzer import claim_analyzer
from app.evidence.retrieval import evidence_engine
from app.consensus.engine import consensus_engine
from app.agents.critic_agent import critic_agent
from app.agents.verdict_engine import verdict_engine
from app.agents.synthesis_agent import synthesis_agent
from app.websocket.manager import ws_manager
from app.models.entities import (
    ExecutionDB, ModelRunDB, ClaimDB, EvidenceDB, ClusterDB, ConflictDB, SynthesisDB, ExecutionEventDB
)

class Orchestrator:
    async def run_pipeline(
        self,
        execution_id: str,
        request: QueryRequest,
        db_session: Session
    ) -> ExecutionDetailResponse:
        start_time = time.time()
        events_list: List[ExecutionEvent] = []

        async def emit(step: str, status: str, details: Dict[str, Any] = None):
            event = ExecutionEvent(
                execution_id=execution_id,
                step=step,
                status=status,
                timestamp=datetime.utcnow().isoformat(),
                details=details
            )
            events_list.append(event)
            await ws_manager.broadcast_event(execution_id, event.model_dump())

        # 1. CLAIM RECEIVED
        await emit("CLAIM_RECEIVED", "COMPLETED", {"query": request.query, "mode": request.mode})

        # 2. CLAIM ANALYZED
        await emit("CLAIM_ANALYZED", "IN_PROGRESS")
        analysis_res = claim_analyzer.analyze(request.query)
        await emit("CLAIM_ANALYZED", "COMPLETED", {
            "subject": analysis_res.subject,
            "claim_type": analysis_res.claim_type,
            "is_absolute": analysis_res.is_absolute_claim,
            "qualifiers": analysis_res.qualifiers
        })

        # 3 & 4. INDEPENDENT AI RESEARCH (Gemini & Groq concurrent calls)
        selected_models = request.models or ["gemini", "groq"]
        model_tasks = []
        timeout_val = settings_timeout(request.mode)

        for model_id in selected_models:
            provider = ProviderFactory.get_provider(model_id, demo_mode=False)
            stage_name = "GEMINI_RESEARCH" if "gemini" in model_id.lower() else "GROQ_RESEARCH"
            await emit(stage_name, "IN_PROGRESS")
            task = asyncio.create_task(
                provider.generate_response(
                    query=request.query,
                    temperature=request.temperature,
                    max_tokens=request.max_tokens,
                    timeout=timeout_val
                )
            )
            model_tasks.append((model_id, stage_name, task))

        model_runs: List[ModelRunResult] = []
        for model_id, stage_name, task in model_tasks:
            try:
                run_res: ModelRunResult = await asyncio.wait_for(task, timeout=timeout_val + 2)
                model_runs.append(run_res)
                status_str = "COMPLETED" if run_res.status == "COMPLETED" else "FAILED"
                await emit(stage_name, status_str, {
                    "latency": run_res.latency_seconds,
                    "tokens": run_res.token_count,
                    "status": run_res.status
                })
            except Exception as e:
                err_run = ModelRunResult(
                    model_name=model_id.upper(),
                    status="FAILED",
                    response_text="",
                    latency_seconds=round(time.time() - start_time, 2),
                    token_count=0,
                    error_message=f"Provider error or timeout: {str(e)}"
                )
                model_runs.append(err_run)
                await emit(stage_name, "FAILED", {"error": str(e)})

        # 5. EVIDENCE RETRIEVAL & 6. EVIDENCE ANALYSIS
        await emit("EVIDENCE_RETRIEVAL", "IN_PROGRESS")
        await emit("EVIDENCE_ANALYSIS", "IN_PROGRESS")
        evidence_items: List[EvidenceItem] = await evidence_engine.extract_evidence(request.query, model_runs)
        await emit("EVIDENCE_RETRIEVAL", "COMPLETED", {"count": len(evidence_items)})
        await emit("EVIDENCE_ANALYSIS", "COMPLETED", {
            "supporting": len([e for e in evidence_items if e.relationship.value == "SUPPORTS"]),
            "contradicting": len([e for e in evidence_items if e.relationship.value == "CONTRADICTS"])
        })

        # 7. CLAIM CLUSTERING
        await emit("CLAIM_CLUSTERING", "IN_PROGRESS")
        claims: List[ClaimSchema] = consensus_engine.extract_claims(model_runs)
        clusters, claim_embeddings = consensus_engine.cluster_claims(
            claims, similarity_threshold=request.similarity_threshold
        )
        await emit("CLAIM_CLUSTERING", "COMPLETED", {"clusters_count": len(clusters)})

        # 8. CONFLICT DETECTION
        await emit("CONFLICT_DETECTION", "IN_PROGRESS")
        conflicts: List[ConflictSchema] = consensus_engine.detect_conflicts(
            claims, claim_embeddings, similarity_threshold=request.similarity_threshold
        )
        await emit("CONFLICT_DETECTION", "COMPLETED", {"conflict_count": len(conflicts)})

        # 9. CRITIC REVIEW
        await emit("CRITIC_REVIEW", "IN_PROGRESS")
        critic_findings: List[CriticFinding] = critic_agent.evaluate(clusters, conflicts)
        await emit("CRITIC_REVIEW", "COMPLETED")

        # 10. VERDICT GENERATION
        await emit("VERDICT_GENERATION", "IN_PROGRESS")
        v_type, v_label, v_confidence, why_result = verdict_engine.evaluate(
            analysis_res, evidence_items, clusters, conflicts, critic_findings
        )
        await emit("VERDICT_GENERATION", "COMPLETED", {"verdict": v_label, "confidence": v_confidence})

        # 11. FINAL SYNTHESIS
        await emit("FINAL_SYNTHESIS", "IN_PROGRESS")
        synthesis_res: SynthesisSchema = synthesis_agent.synthesize(
            query=request.query,
            model_runs=model_runs,
            clusters=clusters,
            conflicts=conflicts,
            critic_findings=critic_findings,
            verdict=v_type,
            verdict_label=v_label,
            confidence_score=v_confidence,
            why_this_result=why_result,
            claim_analysis=analysis_res,
            evidence_items=evidence_items
        )
        await emit("FINAL_SYNTHESIS", "COMPLETED")

        total_latency = round(time.time() - start_time, 2)
        await emit("EXECUTION_COMPLETED", "COMPLETED", {"total_latency": total_latency})

        # Persist DB
        try:
            exec_db = ExecutionDB(
                id=execution_id,
                query=request.query,
                mode=request.mode.value,
                demo_mode=False,
                status="COMPLETED",
                total_latency=total_latency,
                created_at=datetime.utcnow()
            )
            db_session.add(exec_db)

            for r in model_runs:
                db_session.add(ModelRunDB(
                    execution_id=execution_id,
                    model_name=r.model_name,
                    status=r.status,
                    response_text=r.response_text,
                    latency_seconds=r.latency_seconds,
                    token_count=r.token_count,
                    claims_count=r.claims_count,
                    confidence_score=r.confidence_score,
                    error_message=r.error_message
                ))

            for ev_item in evidence_items:
                db_session.add(EvidenceDB(
                    execution_id=execution_id,
                    evidence_id=ev_item.evidence_id,
                    text=ev_item.text,
                    source_title=ev_item.source_title,
                    source_url=ev_item.source_url,
                    source_type=ev_item.source_type,
                    relationship_type=ev_item.relationship.value,
                    quality=ev_item.quality.value,
                    timestamp=ev_item.timestamp,
                    research_agent=ev_item.research_agent
                ))

            for c in claims:
                db_session.add(ClaimDB(
                    execution_id=execution_id,
                    claim_id=c.claim_id,
                    text=c.text,
                    source_model=c.source_model,
                    confidence=c.confidence,
                    category=c.category.value,
                    reasoning_summary=c.reasoning_summary,
                    supporting_context=c.supporting_context,
                    embedding=claim_embeddings.get(c.claim_id)
                ))

            for cl in clusters:
                db_session.add(ClusterDB(
                    execution_id=execution_id,
                    cluster_id=cl.cluster_id,
                    canonical_claim=cl.canonical_claim,
                    supporting_models=cl.supporting_models,
                    consensus_percentage=cl.consensus_percentage,
                    confidence_score=cl.confidence_score,
                    status=cl.status.value,
                    claims_data=[c.model_dump() for c in cl.claims]
                ))

            for conf in conflicts:
                db_session.add(ConflictDB(
                    execution_id=execution_id,
                    conflict_id=conf.conflict_id,
                    claim_a=conf.claim_a.model_dump(),
                    claim_b=conf.claim_b.model_dump(),
                    models_a=conf.models_a,
                    models_b=conf.models_b,
                    semantic_similarity=conf.semantic_similarity,
                    severity=conf.severity.value,
                    explanation=conf.explanation
                ))

            db_session.add(SynthesisDB(
                execution_id=execution_id,
                final_answer=synthesis_res.final_answer,
                consensus_summary=synthesis_res.consensus_summary,
                conflicts_breakdown=synthesis_res.conflicts_breakdown,
                confidence_score=synthesis_res.confidence_score,
                model_agreements=synthesis_res.model_agreements,
                uncertainty_notes=synthesis_res.uncertainty_notes,
                critic_findings=[f.model_dump() for f in critic_findings],
                verdict=v_label,
                why_this_result=why_result
            ))

            for ev in events_list:
                db_session.add(ExecutionEventDB(
                    execution_id=execution_id,
                    step=ev.step,
                    status=ev.status,
                    timestamp=ev.timestamp,
                    details=ev.details
                ))

            db_session.commit()
        except Exception as e:
            print(f"[Orchestrator] Error persisting execution: {e}")
            db_session.rollback()

        return ExecutionDetailResponse(
            execution_id=execution_id,
            query=request.query,
            mode=request.mode,
            demo_mode=False,
            status="COMPLETED",
            created_at=datetime.utcnow().isoformat(),
            total_latency=total_latency,
            models_used=selected_models,
            claim_analysis=analysis_res,
            evidence_items=evidence_items,
            model_runs=model_runs,
            claims=claims,
            clusters=clusters,
            conflicts=conflicts,
            critic_findings=critic_findings,
            synthesis=synthesis_res,
            events=events_list
        )

def settings_timeout(mode) -> int:
    if mode.value == "FAST":
        return 25
    elif mode.value == "DEEP":
        return 50
    return 40

orchestrator = Orchestrator()
