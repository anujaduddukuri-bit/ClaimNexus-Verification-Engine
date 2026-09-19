from typing import List, Dict, Any
from app.schemas.domain import (
    ClusterSchema, ConflictSchema, CriticFinding, SynthesisSchema,
    ModelRunResult, ClusterStatus, VerdictType, ClaimAnalysis, EvidenceItem,
    EvidenceRelationship
)

class SynthesisAgent:
    def synthesize(
        self,
        query: str,
        model_runs: List[ModelRunResult],
        clusters: List[ClusterSchema],
        conflicts: List[ConflictSchema],
        critic_findings: List[CriticFinding],
        verdict: VerdictType = VerdictType.PARTIALLY_SUPPORTED,
        verdict_label: str = "Partially Supported",
        confidence_score: float = 78.0,
        why_this_result: Dict[str, Any] = None,
        claim_analysis: ClaimAnalysis = None,
        evidence_items: List[EvidenceItem] = None
    ) -> SynthesisSchema:
        
        evidence_items = evidence_items or []
        why_this_result = why_this_result or {}
        
        supporting_ev = [e for e in evidence_items if e.relationship == EvidenceRelationship.SUPPORTS and e.source_url]
        contradicting_ev = [e for e in evidence_items if e.relationship == EvidenceRelationship.CONTRADICTS]
        limitation_ev = [e for e in evidence_items if e.relationship == EvidenceRelationship.NEUTRAL]

        completed_runs = [r for r in model_runs if r.status == "COMPLETED"]
        model_agreements: Dict[str, float] = {}
        for r in completed_runs:
            name = r.model_name.split()[0]
            text = (r.response_text or "").lower()
            if "verdict: contradicted" in text or "no evidence" in text:
                model_agreements[name] = 22.0 if verdict in (VerdictType.CONTRADICTED, VerdictType.LIKELY_CONTRADICTED) else 38.0
            elif "verdict: supported" in text:
                model_agreements[name] = 74.0 if verdict in (VerdictType.SUPPORTED, VerdictType.LIKELY_SUPPORTED) else 45.0
            else:
                model_agreements[name] = 48.0

        report_parts = []
        report_parts.append("CLAIM VERIFICATION SYNTHESIS REPORT")
        report_parts.append(f"Target Claim: \"{query}\"")
        report_parts.append(f"Official Verdict: {verdict_label.upper()}")
        report_parts.append(f"Claim Likelihood: {confidence_score}% (estimated chance the claim is true)")
        report_parts.append("")
        
        report_parts.append("1. SUPPORTING EVIDENCE (PROOFS & SOURCES)")
        if supporting_ev:
            for idx, ev in enumerate(supporting_ev[:5], 1):
                report_parts.append(f"   [{idx}] {ev.text}")
                report_parts.append(f"       Source: {ev.source_title}")
                report_parts.append(f"       Link: {ev.source_url}")
        else:
            report_parts.append("   - No grounded public article was found that confirms this claim.")

        report_parts.append("")
        report_parts.append("2. CONTRADICTORY EVIDENCE & COUNTER-CLAIMS")
        if contradicting_ev:
            for idx, ev in enumerate(contradicting_ev[:5], 1):
                report_parts.append(f"   [{idx}] {ev.text}")
                if ev.source_url:
                    report_parts.append(f"       Source: {ev.source_title}")
                    report_parts.append(f"       Link: {ev.source_url}")
                else:
                    report_parts.append(f"       Source: {ev.source_title}")
        else:
            report_parts.append("   - No explicit counter-source was retrieved.")

        report_parts.append("")
        report_parts.append("3. LIMITATIONS & SCOPE CONSTRAINTS")
        if limitation_ev:
            for idx, ev in enumerate(limitation_ev[:3], 1):
                report_parts.append(f"   [{idx}] {ev.text}")
                if ev.source_url:
                    report_parts.append(f"       Link: {ev.source_url}")
        if claim_analysis and claim_analysis.is_extraordinary_claim:
            report_parts.append("   - Extraordinary claim: public, documented evidence is required. Anecdotes and topic mentions are not proof.")
        if claim_analysis and claim_analysis.is_absolute_claim:
            report_parts.append(f"   - Absolute qualifier detected ({', '.join(claim_analysis.qualifiers)}).")
        report_parts.append("   - Only exact article URLs are treated as sources. Website homepages are rejected.")

        report_parts.append("")
        report_parts.append("AI RESEARCH AGENT SUMMARY")
        for r in completed_runs:
            report_parts.append(f"   - {r.model_name}: completed in {r.latency_seconds}s using {r.token_count} tokens.")

        report_parts.append("")
        report_parts.append("ANALYTICAL INSIGHTS")
        if verdict in (VerdictType.CONTRADICTED, VerdictType.LIKELY_CONTRADICTED, VerdictType.INSUFFICIENT_EVIDENCE):
            report_parts.append("   - Treat this claim as unverified or false until a specific documented source appears.")
        else:
            report_parts.append("   - Supporting sources were retrieved; still check the exact linked pages.")

        final_text = "\n".join(report_parts)

        consensus_summary_str = (
            f"Evaluated claim across {len(completed_runs)} research agents and {len(evidence_items)} evidence items. "
            f"Verdict: {verdict_label}. Claim likelihood: {confidence_score}%."
        )

        conflicts_breakdown_list = [c.explanation for c in conflicts] + [e.text for e in contradicting_ev[:2]]

        uncertainty = None
        if claim_analysis and claim_analysis.is_extraordinary_claim:
            uncertainty = "Extraordinary claim: low likelihood unless high-quality public documentation exists."
        elif contradicting_ev:
            uncertainty = f"{len(contradicting_ev)} contradicting source(s) were retrieved."

        return SynthesisSchema(
            final_answer=final_text,
            consensus_summary=consensus_summary_str,
            verdict=verdict,
            verdict_label=verdict_label,
            why_this_result=why_this_result,
            conflicts_breakdown=conflicts_breakdown_list,
            confidence_score=confidence_score,
            model_agreements=model_agreements,
            uncertainty_notes=uncertainty
        )

synthesis_agent = SynthesisAgent()
