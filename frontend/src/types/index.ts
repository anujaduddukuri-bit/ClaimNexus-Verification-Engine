export type ExecutionMode = 'FAST' | 'BALANCED' | 'DEEP';

export type ClaimCategory = 'factual' | 'conceptual' | 'methodological' | 'comparative' | 'predictive' | 'opinion';

export type ClusterStatus = 'Strong Consensus' | 'Moderate Consensus' | 'Weak Consensus' | 'Conflicting' | 'Single Source' | 'Unverified';

export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';

export type VerdictType = 'SUPPORTED' | 'LIKELY_SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'INCONCLUSIVE' | 'INSUFFICIENT_EVIDENCE' | 'LIKELY_CONTRADICTED' | 'CONTRADICTED';

export type EvidenceRelationship = 'SUPPORTS' | 'CONTRADICTS' | 'NEUTRAL' | 'INSUFFICIENT';

export type SourceQuality = 'HIGH' | 'MEDIUM' | 'LOW';

export interface QueryRequest {
  query: string;
  models: string[];
  mode: ExecutionMode;
  temperature: number;
  max_tokens: number;
  similarity_threshold: number;
  demo_mode?: boolean;
}

export interface ClaimAnalysis {
  subject: string;
  comparison?: string;
  metric?: string;
  qualifiers: string[];
  claim_type: string;
  is_absolute_claim: boolean;
  is_extraordinary_claim?: boolean;
}

export interface EvidenceItem {
  evidence_id: string;
  text: string;
  source_title: string;
  source_url: string;
  source_type: string;
  relationship: EvidenceRelationship;
  quality: SourceQuality;
  timestamp: string;
  research_agent: string;
}

export interface ModelRunResult {
  model_name: string;
  status: 'COMPLETED' | 'TIMEOUT' | 'FAILED';
  response_text: string;
  latency_seconds: number;
  token_count: number;
  claims_count: number;
  confidence_score: number;
  error_message?: string;
}

export interface Claim {
  claim_id: string;
  text: string;
  source_model: string;
  confidence: number;
  category: ClaimCategory;
  reasoning_summary: string;
  supporting_context?: string;
}

export interface Cluster {
  cluster_id: string;
  canonical_claim: string;
  claims: Claim[];
  supporting_models: string[];
  consensus_percentage: number;
  confidence_score: number;
  status: ClusterStatus;
}

export interface Conflict {
  conflict_id: string;
  claim_a: Claim;
  claim_b: Claim;
  models_a: string[];
  models_b: string[];
  semantic_similarity: number;
  severity: SeverityLevel;
  explanation: string;
}

export interface CriticFinding {
  status: string;
  severity: SeverityLevel;
  explanation: string;
  recommendation: string;
}

export interface Synthesis {
  final_answer: string;
  consensus_summary: string;
  verdict: VerdictType;
  verdict_label: string;
  why_this_result: Record<string, any>;
  conflicts_breakdown: string[];
  confidence_score: number;
  model_agreements: Record<string, number>;
  uncertainty_notes?: string;
}

export interface ExecutionEvent {
  execution_id: string;
  step: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  timestamp: string;
  details?: Record<string, any>;
}

export interface ExecutionDetail {
  execution_id: string;
  query: string;
  mode: ExecutionMode;
  demo_mode?: boolean;
  status: string;
  created_at: string;
  total_latency: number;
  models_used: string[];
  claim_analysis?: ClaimAnalysis;
  evidence_items: EvidenceItem[];
  model_runs: ModelRunResult[];
  claims: Claim[];
  clusters: Cluster[];
  conflicts: Conflict[];
  critic_findings: CriticFinding[];
  synthesis?: Synthesis;
  events: ExecutionEvent[];
}

export interface AnalyticsSummary {
  total_executions: number;
  avg_latency: number;
  avg_confidence_score: number;
  verdict_distribution: Record<string, number>;
  model_performance: Record<string, any>;
  common_conflict_categories: Array<{ category: string; count: number }>;
}

export interface ProviderStatus {
  id: string;
  name: string;
  model: string;
  configured: boolean;
  status: string;
}
