import math
import numpy as np
from typing import List
from app.core.config import settings

class EmbeddingEngine:
    def __init__(self, model_name: str = None):
        self.model_name = model_name or settings.EMBEDDING_MODEL_NAME
        self._st_model = None
        self._attempted_st_load = False

    def _get_model(self):
        if not self._attempted_st_load:
            self._attempted_st_load = True
            try:
                from sentence_transformers import SentenceTransformer
                self._st_model = SentenceTransformer(self.model_name)
            except Exception as e:
                print(f"[EmbeddingEngine] Note: sentence-transformers load deferred or using light vector fallback: {e}")
                self._st_model = None
        return self._st_model

    def encode_claims(self, claims: List[str]) -> List[List[float]]:
        if not claims:
            return []
            
        model = self._get_model()
        if model is not None:
            try:
                embeddings = model.encode(claims, convert_to_numpy=True)
                return [emb.tolist() for emb in embeddings]
            except Exception as e:
                print(f"[EmbeddingEngine] Encoding fallback triggered: {e}")
                
        # Lightweight vector encoding fallback (TF-IDF / char-gram similarity representation)
        return [self._fallback_encode(c) for c in claims]

    def calculate_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        if not vec_a or not vec_b:
            return 0.0
            
        a = np.array(vec_a, dtype=float)
        b = np.array(vec_b, dtype=float)
        
        # Adjust dimensions if lengths differ
        min_len = min(len(a), len(b))
        a, b = a[:min_len], b[:min_len]
        
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        if norm_a == 0.0 or norm_b == 0.0:
            return 0.0
            
        similarity = float(np.dot(a, b) / (norm_a * norm_b))
        return max(0.0, min(1.0, round(similarity, 4)))

    def _fallback_encode(self, text: str, dim: int = 64) -> List[float]:
        """Deterministic hashing-based n-gram embedding fallback."""
        words = text.lower().split()
        vector = [0.0] * dim
        for w in words:
            idx = abs(hash(w)) % dim
            vector[idx] += 1.0
        norm = math.sqrt(sum(v*v for v in vector))
        if norm > 0:
            vector = [v / norm for v in vector]
        return vector

embedding_engine = EmbeddingEngine()
