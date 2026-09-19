from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

class ExecutionMode(str, Enum):
    FAST = "FAST"
    BALANCED = "BALANCED"
    DEEP = "DEEP"

class ClaimCategory(str, Enum):
    FACTUAL = "factual"
    CONCEPTUAL = "conceptual"
    METHODOLOGICAL = "methodological"
    COMPARATIVE = "comparative"
    PREDICTIVE = "predictive"
    OPINION = "opinion"

class ClusterStatus(str, Enum):
    STRONG_CONSENSUS = "Strong Consensus"
    MODERATE_CONSENSUS = "Moderate Consensus"
    WEAK_CONSENSUS = "Weak Consensus"
    CONFLICTING = "Conflicting"
    SINGLE_SOURCE = "Single Source"
    UNVERIFIED = "Unverified"

class SeverityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class VerdictType(str, Enum):
    SUPPORTED = "SUPPORTED"
    LIKELY_SUPPORTED = "LIKELY_SUPPORTED"
    PARTIALLY_SUPPORTED = "PARTIALLY_SUPPORTED"
    INCONCLUSIVE = "INCONCLUSIVE"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    LIKELY_CONTRADICTED = "LIKELY_CONTRADICTED"
    CONTRADICTED = "CONTRADICTED"

class EvidenceRelationship(str, Enum):
    SUPPORTS = "SUPPORTS"
    CONTRADICTS = "CONTRADICTS"
    NEUTRAL = "NEUTRAL"
    INSUFFICIENT = "INSUFFICIENT"

class SourceQuality(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=3, description="Claim to verify and investigate")
    models: List[str] = Field(default_factory=lambda: ["gemini", "groq"])
    mode: ExecutionMode = ExecutionMode.BALANCED
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(1024, ge=128, le=4096)
    similarity_threshold: float = Field(0.82, ge=0.5, le=0.99)
    demo_mode: bool = False

class ClaimAnalysis(BaseModel):
    subject: str = ""
    comparison: Optional[str] = None
    metric: Optional[str] = None
    qualifiers: List[str] = []
    claim_type: str = "Factual"
    is_absolute_claim: bool = False
    is_extraordinary_claim: bool = False

class EvidenceItem(BaseModel):
    evidence_id: str
    text: str
    source_title: str
    source_url: str
    source_type: str = "Academic / Research"
    relationship: EvidenceRelationship
    quality: SourceQuality
    timestamp: str = ""
    research_agent: str = "Evidence Retrieval"

class GroundingSource(BaseModel):
    title: str = ""
    url: str = ""
    snippet: str = ""

class ModelRunResult(BaseModel):
    model_name: str
    status: str # COMPLETED, TIMEOUT, FAILED
    response_text: str
    latency_seconds: float
    token_count: int
    claims_count: int = 0
    confidence_score: float = 0.0
    error_message: Optional[str] = None
    grounding_sources: List[GroundingSource] = Field(default_factory=list)

class ClaimSchema(BaseModel):
    claim_id: str
    text: str
    source_model: str
    confidence: float
    category: ClaimCategory = ClaimCategory.FACTUAL
    reasoning_summary: str
    supporting_context: Optional[str] = None

class ClusterSchema(BaseModel):
    cluster_id: str
    canonical_claim: str
    claims: List[ClaimSchema]
    supporting_models: List[str]
    consensus_percentage: float
    confidence_score: float
    status: ClusterStatus

class ConflictSchema(BaseModel):
    conflict_id: str
    claim_a: ClaimSchema
    claim_b: ClaimSchema
    models_a: List[str]
    models_b: List[str]
    semantic_similarity: float
    severity: SeverityLevel
    explanation: str

class CriticFinding(BaseModel):
    status: str
    severity: SeverityLevel
    explanation: str
    recommendation: str

class SynthesisSchema(BaseModel):
    final_answer: str
    consensus_summary: str
    verdict: VerdictType = VerdictType.PARTIALLY_SUPPORTED
    verdict_label: str = "Partially Supported"
    why_this_result: Dict[str, Any] = Field(default_factory=dict)
    conflicts_breakdown: List[str] = Field(default_factory=list)
    confidence_score: float = 0.0
    model_agreements: Dict[str, float] = Field(default_factory=dict)
    uncertainty_notes: Optional[str] = None

class ExecutionEvent(BaseModel):
    execution_id: str
    step: str
    status: str # PENDING, IN_PROGRESS, COMPLETED, FAILED
    timestamp: str
    details: Optional[Dict[str, Any]] = None

class ExecutionDetailResponse(BaseModel):
    execution_id: str
    query: str
    mode: ExecutionMode
    demo_mode: bool = False
    status: str
    created_at: str
    total_latency: float
    models_used: List[str]
    claim_analysis: Optional[ClaimAnalysis] = None
    evidence_items: List[EvidenceItem] = []
    model_runs: List[ModelRunResult]
    claims: List[ClaimSchema]
    clusters: List[ClusterSchema]
    conflicts: List[ConflictSchema]
    critic_findings: List[CriticFinding]
    synthesis: Optional[SynthesisSchema] = None
    events: List[ExecutionEvent] = []

class AnalyticsSummary(BaseModel):
    total_executions: int
    avg_latency: float
    avg_confidence_score: float
    verdict_distribution: Dict[str, int] = Field(default_factory=dict)
    model_performance: Dict[str, Dict[str, Any]]
    common_conflict_categories: List[Dict[str, Any]]
