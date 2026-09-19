from typing import List
from app.schemas.domain import ClusterSchema, ConflictSchema, CriticFinding, SeverityLevel

class CriticAgent:
    def evaluate(self, clusters: List[ClusterSchema], conflicts: List[ConflictSchema]) -> List[CriticFinding]:
        findings: List[CriticFinding] = []
        
        # Check conflicts severity
        for c in conflicts:
            findings.append(CriticFinding(
                status="conflict",
                severity=c.severity,
                explanation=c.explanation,
                recommendation=f"Cross-verify contradictory statements between {', '.join(c.models_a)} and {', '.join(c.models_b)}."
            ))
            
        # Inspect single-source or low-consensus clusters
        for cl in clusters:
            if cl.status.value == "Single Source":
                findings.append(CriticFinding(
                    status="unsupported_claim",
                    severity=SeverityLevel.LOW,
                    explanation=f"Claim '{cl.canonical_claim[:60]}...' is supported solely by {cl.supporting_models[0]}.",
                    recommendation="Treat single-source claims as prospective hypotheses until multi-model validation is available."
                ))
            elif cl.status.value == "Conflicting":
                findings.append(CriticFinding(
                    status="divergent_cluster",
                    severity=SeverityLevel.HIGH,
                    explanation=f"Cluster '{cl.canonical_claim[:60]}...' has conflicting model consensus ratings.",
                    recommendation="Explicitly flag high-divergence claims in synthesis report output."
                ))

        if not findings:
            findings.append(CriticFinding(
                status="verified",
                severity=SeverityLevel.LOW,
                explanation="High inter-model consensus established across extracted claims without major contradictions.",
                recommendation="Proceed to final answer synthesis with high confidence."
            ))
            
        return findings

critic_agent = CriticAgent()
