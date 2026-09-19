import uuid
import re
from typing import List, Tuple, Dict, Any
from app.schemas.domain import (
    ClaimSchema, ClaimCategory, ClusterSchema, ClusterStatus,
    ConflictSchema, SeverityLevel, ModelRunResult
)
from app.embeddings.engine import embedding_engine

class ConsensusEngine:
    def __init__(self, default_threshold: float = 0.82):
        self.default_threshold = default_threshold

    def extract_claims(self, model_runs: List[ModelRunResult]) -> List[ClaimSchema]:
        """Extract structured claims from each model response."""
        extracted_claims: List[ClaimSchema] = []
        
        for run in model_runs:
            if run.status != "COMPLETED" or not run.response_text:
                continue
                
            model_name = run.model_name.split()[0] # e.g. "xAI", "Gemini", "Groq"
            sentences = self._split_into_sentences(run.response_text)
            
            for idx, sentence in enumerate(sentences):
                clean_text = re.sub(r"[#*_`]+", "", sentence).strip()
                if len(clean_text) < 15:
                    continue
                    
                category = self._classify_category(clean_text)
                claim_id = f"claim_{model_name.lower()}_{uuid.uuid4().hex[:6]}"
                
                extracted_claims.append(ClaimSchema(
                    claim_id=claim_id,
                    text=clean_text,
                    source_model=model_name,
                    confidence=round(run.confidence_score - (idx * 0.01), 2),
                    category=category,
                    reasoning_summary=f"Extracted statement from {model_name} response output.",
                    supporting_context=f"Context from {model_name} execution run."
                ))
                
        return extracted_claims

    def cluster_claims(
        self,
        claims: List[ClaimSchema],
        similarity_threshold: float = None
    ) -> Tuple[List[ClusterSchema], Dict[str, List[float]]]:
        """Group claims into semantic consensus clusters."""
        threshold = similarity_threshold or self.default_threshold
        if not claims:
            return [], {}
            
        # Generate embeddings
        texts = [c.text for c in claims]
        embeddings_list = embedding_engine.encode_claims(texts)
        claim_embeddings = {c.claim_id: emb for c, emb in zip(claims, embeddings_list)}
        
        # Build pairwise similarity graph & clusters
        unvisited = set(range(len(claims)))
        clusters: List[ClusterSchema] = []
        cluster_idx = 1
        
        while unvisited:
            seed_idx = unvisited.pop()
            seed_claim = claims[seed_idx]
            seed_emb = claim_embeddings[seed_claim.claim_id]
            
            current_cluster_claims = [seed_claim]
            matched_indices = set()
            
            for idx in list(unvisited):
                target_claim = claims[idx]
                target_emb = claim_embeddings[target_claim.claim_id]
                
                sim = embedding_engine.calculate_similarity(seed_emb, target_emb)
                
                # Check for semantic match (or keyword overlap boosting)
                if sim >= threshold or self._has_strong_textual_overlap(seed_claim.text, target_claim.text):
                    current_cluster_claims.append(target_claim)
                    matched_indices.add(idx)
                    
            unvisited -= matched_indices
            
            # Calculate cluster metrics
            supporting_models = sorted(list(set(c.source_model for c in current_cluster_claims)))
            total_unique_models = len(set(c.source_model for c in claims))
            
            consensus_pct = round((len(supporting_models) / max(1, total_unique_models)) * 100, 1)
            avg_confidence = round(sum(c.confidence for c in current_cluster_claims) / len(current_cluster_claims), 2)
            
            # Status classification
            if len(supporting_models) >= 3 or consensus_pct >= 90:
                status = ClusterStatus.STRONG_CONSENSUS
            elif len(supporting_models) == 2 or consensus_pct >= 60:
                status = ClusterStatus.MODERATE_CONSENSUS
            elif len(supporting_models) == 1 and len(current_cluster_claims) > 1:
                status = ClusterStatus.WEAK_CONSENSUS
            else:
                status = ClusterStatus.SINGLE_SOURCE
                
            canonical_claim = min(current_cluster_claims, key=lambda c: len(c.text)).text
            
            clusters.append(ClusterSchema(
                cluster_id=f"cluster_{cluster_idx:02d}",
                canonical_claim=canonical_claim,
                claims=current_cluster_claims,
                supporting_models=supporting_models,
                consensus_percentage=consensus_pct,
                confidence_score=avg_confidence,
                status=status
            ))
            cluster_idx += 1
            
        return clusters, claim_embeddings

    def detect_conflicts(
        self,
        claims: List[ClaimSchema],
        claim_embeddings: Dict[str, List[float]],
        similarity_threshold: float = 0.82
    ) -> List[ConflictSchema]:
        """Detect contradictory claims across models."""
        conflicts: List[ConflictSchema] = []
        conflict_idx = 1
        
        # Compare claims from different models
        for i in range(len(claims)):
            for j in range(i + 1, len(claims)):
                c1, c2 = claims[i], claims[j]
                
                if c1.source_model == c2.source_model:
                    continue
                    
                emb1 = claim_embeddings.get(c1.claim_id)
                emb2 = claim_embeddings.get(c2.claim_id)
                
                if not emb1 or not emb2:
                    continue
                    
                sim = embedding_engine.calculate_similarity(emb1, emb2)
                
                # Check for antonym / negation opposition
                is_negated = self._is_negated_pair(c1.text, c2.text)
                
                if (sim >= 0.70 and is_negated) or (0.50 <= sim <= 0.80 and is_negated):
                    severity = SeverityLevel.HIGH if sim >= 0.75 else SeverityLevel.MEDIUM
                    explanation = (
                        f"{c1.source_model} states '{c1.text[:60]}...' whereas "
                        f"{c2.source_model} states '{c2.text[:60]}...' resulting in a contradiction."
                    )
                    
                    conflicts.append(ConflictSchema(
                        conflict_id=f"conflict_{conflict_idx:02d}",
                        claim_a=c1,
                        claim_b=c2,
                        models_a=[c1.source_model],
                        models_b=[c2.source_model],
                        semantic_similarity=round(sim, 3),
                        severity=severity,
                        explanation=explanation
                    ))
                    conflict_idx += 1
                    
        return conflicts

    def _split_into_sentences(self, text: str) -> List[str]:
        # Clean markdown headers and bullet points
        cleaned = re.sub(r'#+\s*', '', text)
        cleaned = re.sub(r'^\s*[\*\-\d\.]+\s*', '', cleaned, flags=re.MULTILINE)
        raw_sentences = re.split(r'(?<=[.!?])\s+', cleaned)
        return [s.strip() for saim in raw_sentences for s in saim.split('\n') if len(s.strip()) > 15]

    def _classify_category(self, text: str) -> ClaimCategory:
        t = text.lower()
        if any(w in t for w in ["always", "never", "reduces", "increases", "provides", "Grounds"]):
            return ClaimCategory.FACTUAL
        elif any(w in t for w in ["versus", "compared", "whereas", "differs"]):
            return ClaimCategory.COMPARATIVE
        elif any(w in t for w in ["predicts", "will achieve", "future", "expected"]):
            return ClaimCategory.PREDICTIVE
        elif any(w in t for w in ["architecture", "concept", "paradigm"]):
            return ClaimCategory.CONCEPTUAL
        return ClaimCategory.FACTUAL

    def _has_strong_textual_overlap(self, text1: str, text2: str) -> bool:
        words1 = set(w.lower() for w in re.findall(r'\w+', text1) if len(w) > 3)
        words2 = set(w.lower() for w in re.findall(r'\w+', text2) if len(w) > 3)
        if not words1 or not words2:
            return False
        overlap = words1.intersection(words2)
        jaccard = len(overlap) / float(len(words1.union(words2)))
        return jaccard >= 0.45

    def _is_negated_pair(self, t1: str, t2: str) -> bool:
        t1_l, t2_l = t1.lower(), t2.lower()
        negations = ["not", "never", "eliminates", "lacks", "fails", "without", "does not", "cannot"]
        has_neg1 = any(n in t1_l for n in negations)
        has_neg2 = any(n in t2_l for n in negations)
        return has_neg1 != has_neg2 # One has negation and the other does not

consensus_engine = ConsensusEngine()
