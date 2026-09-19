from typing import List, Dict, Any, Tuple
from app.schemas.domain import (
    VerdictType, ClaimAnalysis, EvidenceItem, EvidenceRelationship,
    SourceQuality, CriticFinding, ClusterSchema, ConflictSchema
)

class VerdictEngine:
    def evaluate(
        self,
        claim_analysis: ClaimAnalysis,
        evidence_items: List[EvidenceItem],
        clusters: List[ClusterSchema],
        conflicts: List[ConflictSchema],
        critic_findings: List[CriticFinding]
    ) -> Tuple[VerdictType, str, float, Dict[str, Any]]:
        """Confidence is the estimated likelihood that the CLAIM is true (0-100)."""

        supporting_ev = [e for e in evidence_items if e.relationship == EvidenceRelationship.SUPPORTS]
        contradicting_ev = [e for e in evidence_items if e.relationship == EvidenceRelationship.CONTRADICTS]
        high_quality_support = [e for e in supporting_ev if e.quality == SourceQuality.HIGH]
        high_quality_contra = [e for e in contradicting_ev if e.quality == SourceQuality.HIGH]
        usable_urls = [e for e in evidence_items if e.source_url]

        num_sup = len(supporting_ev)
        num_con = len(contradicting_ev)
        num_conflicts = len(conflicts)
        extraordinary = bool(claim_analysis and claim_analysis.is_extraordinary_claim)
        absolute = bool(claim_analysis and claim_analysis.is_absolute_claim)

        if not evidence_items or not usable_urls:
            if extraordinary:
                verdict = VerdictType.CONTRADICTED
                label = "Contradicted / Unverified"
                confidence = 8.0
            else:
                verdict = VerdictType.INSUFFICIENT_EVIDENCE
                label = "Insufficient Evidence"
                confidence = 22.0
        elif extraordinary and len(high_quality_support) == 0:
            if num_con > 0 or num_sup == 0:
                verdict = VerdictType.CONTRADICTED
                label = "Contradicted / Unverified"
                confidence = max(4.0, min(18.0, 12.0 - len(high_quality_contra) * 1.5))
            else:
                verdict = VerdictType.INSUFFICIENT_EVIDENCE
                label = "Insufficient Evidence"
                confidence = 16.0
        elif num_con > 0 and num_sup == 0:
            verdict = VerdictType.CONTRADICTED
            label = "Contradicted / False"
            confidence = max(5.0, 24.0 - len(high_quality_contra) * 3.0 - num_con * 1.5)
        elif num_con >= max(2, num_sup * 2):
            verdict = VerdictType.CONTRADICTED
            label = "Contradicted / False"
            confidence = max(8.0, 28.0 - len(high_quality_contra) * 2.5)
        elif num_con > num_sup:
            verdict = VerdictType.LIKELY_CONTRADICTED
            label = "Likely Contradicted"
            confidence = max(12.0, 36.0 - (num_con - num_sup) * 3.0)
        elif num_sup > 0 and num_con == 0:
            if absolute or extraordinary:
                verdict = VerdictType.LIKELY_SUPPORTED
                label = "Likely Supported"
                confidence = min(78.0, 58.0 + len(high_quality_support) * 5.0)
            else:
                verdict = VerdictType.SUPPORTED
                label = "Supported"
                confidence = min(88.0, 62.0 + len(high_quality_support) * 6.0 + min(num_sup, 4) * 3.0)
        elif num_sup >= max(2, num_con * 2):
            verdict = VerdictType.LIKELY_SUPPORTED
            label = "Likely Supported"
            confidence = min(80.0, 55.0 + len(high_quality_support) * 4.0)
        elif num_sup > 0 and num_con > 0:
            verdict = VerdictType.PARTIALLY_SUPPORTED
            label = "Partially Supported"
            ratio = num_sup / max(1, num_sup + num_con)
            confidence = round(28.0 + ratio * 34.0, 1)
        else:
            verdict = VerdictType.INCONCLUSIVE
            label = "Inconclusive"
            confidence = 40.0

        confidence = round(max(3.0, min(92.0, confidence)), 1)

        why_this_result = {
            "supporting_evidence_count": num_sup,
            "contradicting_evidence_count": num_con,
            "high_quality_sources": len(high_quality_support) + len(high_quality_contra),
            "grounded_source_urls": len(usable_urls),
            "conflicts_identified": num_conflicts,
            "is_absolute_qualifier_detected": absolute,
            "is_extraordinary_claim": extraordinary,
            "summary_bullet": (
                f"{num_sup} supporting vs {num_con} contradicting grounded sources. "
                + ("Extraordinary claim: high confidence requires documented public proof. " if extraordinary else "")
                + (f"Absolute qualifier ('{', '.join(claim_analysis.qualifiers)}') requires strict proof." if absolute else "Confidence is the estimated likelihood the claim is true.")
            )
        }

        return verdict, label, confidence, why_this_result

verdict_engine = VerdictEngine()
