from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.entities import ExecutionDB, ModelRunDB, ConflictDB, SynthesisDB, EvidenceDB, ClaimDB
from app.schemas.domain import AnalyticsSummary

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("", response_model=AnalyticsSummary)
def get_analytics_summary(db: Session = Depends(get_db)):
    """Fetch aggregate platform claim verification and consensus analytics in real-time."""
    total_executions = db.query(ExecutionDB).count()
    
    if total_executions > 0:
        avg_latency_val = db.query(func.avg(ExecutionDB.total_latency)).scalar() or 0.0
        avg_latency = round(float(avg_latency_val), 2)
    else:
        avg_latency = 0.0

    synthesis_records = db.query(SynthesisDB).all()
    if synthesis_records:
        avg_conf_val = sum(s.confidence_score for s in synthesis_records) / len(synthesis_records)
        avg_confidence_score = round(float(avg_conf_val), 1)
    else:
        avg_confidence_score = 0.0

    # Verdict distribution
    verdict_counts = {
        "Supported": 0,
        "Likely Supported": 0,
        "Partially Supported": 0,
        "Contradicted": 0,
        "Likely Contradicted": 0,
        "Inconclusive": 0,
        "Insufficient Evidence": 0
    }
    
    for s in synthesis_records:
        v_str = (s.verdict or "PARTIALLY_SUPPORTED").replace("_", " ").title()
        if v_str in verdict_counts:
            verdict_counts[v_str] += 1
        else:
            verdict_counts[v_str] = 1

    # Model performance stats from ModelRunDB
    model_runs = db.query(ModelRunDB).all()
    model_stats = {
        "Gemini": {"latency": 0.0, "success_rate": 100.0, "avg_claims": 0.0, "total_runs": 0},
        "Groq": {"latency": 0.0, "success_rate": 100.0, "avg_claims": 0.0, "total_runs": 0}
    }

    gemini_runs = [r for r in model_runs if "gemini" in r.model_name.lower()]
    groq_runs = [r for r in model_runs if "groq" in r.model_name.lower() or "llama" in r.model_name.lower()]

    if gemini_runs:
        tot_lat = sum(r.latency_seconds for r in gemini_runs)
        succ = sum(1 for r in gemini_runs if r.status == "COMPLETED")
        claims_tot = sum(r.claims_count for r in gemini_runs)
        model_stats["Gemini"] = {
            "latency": round(tot_lat / len(gemini_runs), 2),
            "success_rate": round((succ / len(gemini_runs)) * 100, 1),
            "avg_claims": round(claims_tot / len(gemini_runs), 1),
            "total_runs": len(gemini_runs)
        }

    if groq_runs:
        tot_lat = sum(r.latency_seconds for r in groq_runs)
        succ = sum(1 for r in groq_runs if r.status == "COMPLETED")
        claims_tot = sum(r.claims_count for r in groq_runs)
        model_stats["Groq"] = {
            "latency": round(tot_lat / len(groq_runs), 2),
            "success_rate": round((succ / len(groq_runs)) * 100, 1),
            "avg_claims": round(claims_tot / len(groq_runs), 1),
            "total_runs": len(groq_runs)
        }

    # Conflict Breakdown
    conflicts = db.query(ConflictDB).all()
    conflict_categories = [
        {"category": "Absolute Qualifier Conflict", "count": sum(1 for c in conflicts if c.severity in ["high", "critical"])},
        {"category": "Scope Overgeneralization", "count": sum(1 for c in conflicts if c.severity == "medium")},
        {"category": "Temporal / Outdated Evidence", "count": sum(1 for c in conflicts if c.severity == "low")}
    ]

    return AnalyticsSummary(
        total_executions=total_executions,
        avg_latency=avg_latency,
        avg_confidence_score=avg_confidence_score,
        verdict_distribution=verdict_counts,
        model_performance=model_stats,
        common_conflict_categories=conflict_categories
    )

