from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, selectinload
from typing import List

from app.database.session import get_db
from app.models.entities import ExecutionDB
from app.schemas.domain import (
    ExecutionDetailResponse, ModelRunResult, ClaimSchema, ClusterSchema,
    ConflictSchema, CriticFinding, SynthesisSchema, ExecutionEvent, EvidenceItem,
    EvidenceRelationship, SourceQuality, VerdictType, ClusterStatus, ClaimCategory,
    SeverityLevel, ExecutionMode
)

router = APIRouter(prefix="/executions", tags=["Execution History"])

@router.get("", response_model=List[ExecutionDetailResponse])
def list_executions(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """List recent executions with full relational data."""
    executions_db = (
        db.query(ExecutionDB)
        .options(
            selectinload(ExecutionDB.models),
            selectinload(ExecutionDB.evidence),
            selectinload(ExecutionDB.claims),
            selectinload(ExecutionDB.clusters),
            selectinload(ExecutionDB.conflicts),
            selectinload(ExecutionDB.synthesis),
            selectinload(ExecutionDB.events),
        )
        .order_by(ExecutionDB.created_at.desc())
        .limit(limit)
        .all()
    )
    results = []
    for e in executions_db:
        try:
            results.append(format_execution_response(e))
        except Exception as exc:
            print(f"[executions] Skipping corrupt record {getattr(e, 'id', '?')}: {exc}")
    return results

@router.get("/{execution_id}", response_model=ExecutionDetailResponse)
def get_execution_detail(
    execution_id: str,
    db: Session = Depends(get_db)
):
    """Get single execution details by ID."""
    execution_db = db.query(ExecutionDB).filter(ExecutionDB.id == execution_id).first()
    if not execution_db:
        raise HTTPException(status_code=404, detail="Execution record not found.")
    return format_execution_response(execution_db)

@router.delete("/{execution_id}", status_code=status.HTTP_200_OK)
def delete_single_execution(
    execution_id: str,
    db: Session = Depends(get_db)
):
    """Delete a single execution record and all cascading associated entities."""
    execution_db = db.query(ExecutionDB).filter(ExecutionDB.id == execution_id).first()
    if not execution_db:
        raise HTTPException(status_code=404, detail="Execution record not found.")
    
    db.delete(execution_db)
    db.commit()
    return {"status": "success", "message": f"Execution '{execution_id}' and all associated data permanently removed."}

@router.delete("", status_code=status.HTTP_200_OK)
def clear_all_executions(
    db: Session = Depends(get_db)
):
    """Clear all execution records and perform cascading cleanup across all relational tables."""
    count = db.query(ExecutionDB).delete(synchronize_session='fetch')
    db.commit()
    return {"status": "success", "message": f"Cleared all {count} execution records and associated data."}

@router.get("/{execution_id}/claims", response_model=List[ClaimSchema])
def get_execution_claims(execution_id: str, db: Session = Depends(get_db)):
    exec_res = get_execution_detail(execution_id, db)
    return exec_res.claims

@router.get("/{execution_id}/consensus", response_model=List[ClusterSchema])
def get_execution_consensus(execution_id: str, db: Session = Depends(get_db)):
    exec_res = get_execution_detail(execution_id, db)
    return exec_res.clusters

@router.get("/{execution_id}/models", response_model=List[ModelRunResult])
def get_execution_models(execution_id: str, db: Session = Depends(get_db)):
    exec_res = get_execution_detail(execution_id, db)
    return exec_res.model_runs

def _safe_enum(enum_cls, value, default):
    try:
        return enum_cls(value)
    except Exception:
        return default

def format_execution_response(e: ExecutionDB) -> ExecutionDetailResponse:
    model_runs = [
        ModelRunResult(
            model_name=m.model_name,
            status=m.status or "FAILED",
            response_text=m.response_text or "",
            latency_seconds=m.latency_seconds or 0.0,
            token_count=m.token_count or 0,
            claims_count=m.claims_count or 0,
            confidence_score=m.confidence_score or 0.0,
            error_message=m.error_message
        ) for m in (e.models or [])
    ]
    
    evidence_items = [
        EvidenceItem(
            evidence_id=ev.evidence_id,
            text=ev.text or "",
            source_title=ev.source_title or "",
            source_url=ev.source_url or "",
            source_type=ev.source_type or "Research",
            relationship=EvidenceRelationship(ev.relationship_type) if ev.relationship_type in EvidenceRelationship.__members__ else EvidenceRelationship.SUPPORTS,
            quality=SourceQuality(ev.quality) if ev.quality in SourceQuality.__members__ else SourceQuality.HIGH,
            timestamp=ev.timestamp or "",
            research_agent=ev.research_agent or "Evidence Retrieval"
        ) for ev in (getattr(e, "evidence", []) or [])
    ]

    claims = []
    for c in (e.claims or []):
        try:
            claims.append(ClaimSchema(
                claim_id=c.claim_id,
                text=c.text or "",
                source_model=c.source_model or "",
                confidence=c.confidence or 0.0,
                category=_safe_enum(ClaimCategory, c.category, ClaimCategory.FACTUAL),
                reasoning_summary=c.reasoning_summary or "",
                supporting_context=c.supporting_context
            ))
        except Exception as exc:
            print(f"[executions] Skipping claim: {exc}")

    clusters = []
    for cl in (e.clusters or []):
        try:
            parsed_claims = []
            for c_dict in (cl.claims_data or []):
                try:
                    parsed_claims.append(ClaimSchema(**c_dict))
                except Exception:
                    continue
            clusters.append(ClusterSchema(
                cluster_id=cl.cluster_id,
                canonical_claim=cl.canonical_claim or "",
                claims=parsed_claims,
                supporting_models=cl.supporting_models or [],
                consensus_percentage=cl.consensus_percentage or 0.0,
                confidence_score=cl.confidence_score or 0.0,
                status=_safe_enum(ClusterStatus, cl.status, ClusterStatus.UNVERIFIED)
            ))
        except Exception as exc:
            print(f"[executions] Skipping cluster: {exc}")
    
    conflicts = []
    for co in (e.conflicts or []):
        try:
            conflicts.append(ConflictSchema(
                conflict_id=co.conflict_id,
                claim_a=ClaimSchema(**co.claim_a),
                claim_b=ClaimSchema(**co.claim_b),
                models_a=co.models_a or [],
                models_b=co.models_b or [],
                semantic_similarity=co.semantic_similarity or 0.0,
                severity=_safe_enum(SeverityLevel, co.severity, SeverityLevel.MEDIUM),
                explanation=co.explanation or ""
            ))
        except Exception as exc:
            print(f"[executions] Skipping conflict: {exc}")
    
    synthesis = None
    critic_findings = []
    if e.synthesis:
        verdict_val = getattr(e.synthesis, "verdict", "PARTIALLY_SUPPORTED") or "PARTIALLY_SUPPORTED"
        v_type = VerdictType.PARTIALLY_SUPPORTED
        if verdict_val in VerdictType.__members__:
            v_type = VerdictType(verdict_val)

        synthesis = SynthesisSchema(
            final_answer=e.synthesis.final_answer,
            consensus_summary=e.synthesis.consensus_summary,
            verdict=v_type,
            verdict_label=verdict_val.replace("_", " ").title(),
            why_this_result=getattr(e.synthesis, "why_this_result", {}) or {},
            conflicts_breakdown=e.synthesis.conflicts_breakdown or [],
            confidence_score=e.synthesis.confidence_score,
            model_agreements=e.synthesis.model_agreements or {},
            uncertainty_notes=e.synthesis.uncertainty_notes
        )
        if e.synthesis.critic_findings:
            critic_findings = [CriticFinding(**f) for f in e.synthesis.critic_findings]
            
    events = [
        ExecutionEvent(
            execution_id=ev.execution_id,
            step=ev.step,
            status=ev.status,
            timestamp=ev.timestamp,
            details=ev.details
        ) for ev in e.events
    ]

    return ExecutionDetailResponse(
        execution_id=e.id,
        query=e.query,
        mode=_safe_enum(ExecutionMode, e.mode, ExecutionMode.BALANCED),
        demo_mode=False,
        status=e.status,
        created_at=e.created_at.isoformat() if hasattr(e.created_at, "isoformat") else str(e.created_at or ""),
        total_latency=e.total_latency,
        models_used=list(set(m.model_name.split()[0] for m in e.models)),
        evidence_items=evidence_items,
        model_runs=model_runs,
        claims=claims,
        clusters=clusters,
        conflicts=conflicts,
        critic_findings=critic_findings,
        synthesis=synthesis,
        events=events
    )
