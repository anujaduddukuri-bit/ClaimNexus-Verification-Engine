import re
from typing import List, Optional
from app.schemas.domain import ClaimAnalysis

class ClaimAnalyzer:
    ABSOLUTE_QUALIFIERS = ["always", "never", "all", "none", "best", "worst", "only", "every", "impossible", "100%"]
    EXTRAORDINARY_PATTERNS = [
        r"\balien", r"\bufos?\b", r"extraterrestrial", r"visited earth",
        r"\bbigfoot\b", r"\bflat earth\b", r"\bchemtrail", r"\billuminati\b",
        r"\breptilian", r"\bghost(s)?\b", r"\btime travel\b", r"\bhollow earth\b",
        r"lizard people", r"\bnibiru\b", r"ancient astronaut",
    ]

    def analyze(self, claim_text: str) -> ClaimAnalysis:
        text_lower = claim_text.lower()
        
        qualifiers_found = [q for q in self.ABSOLUTE_QUALIFIERS if re.search(r'\b' + re.escape(q) + r'\b', text_lower)]
        is_absolute = len(qualifiers_found) > 0
        is_extraordinary = any(re.search(p, text_lower) for p in self.EXTRAORDINARY_PATTERNS)

        claim_type = "Factual"
        comparison = None
        metric = None

        if any(term in text_lower for term in [" cheaper than", " faster than", " better than", " higher than", " vs ", " versus ", " compared to"]):
            claim_type = "Comparative"
            parts = re.split(r'\b(than|vs|versus|compared to)\b', claim_text, flags=re.IGNORECASE)
            if len(parts) >= 3:
                comparison = parts[-1].strip().rstrip(".?")
        elif is_extraordinary:
            claim_type = "Extraordinary"
        elif is_absolute:
            claim_type = "Absolute"
        elif any(term in text_lower for term in ["will ", "shall ", "going to ", "future ", "by 2030", "by 2050"]):
            claim_type = "Predictive"
        elif any(term in text_lower for term in [" causes ", " leads to ", " results in ", " causes of "]):
            claim_type = "Causal"

        metric_keywords = {
            "cost": ["cheaper", "expensive", "cost", "price", "spending"],
            "speed": ["faster", "slower", "speed", "latency"],
            "population": ["population", "people", "inhabitants"],
            "health": ["cure", "disease", "health", "mortality"],
            "climate": ["emissions", "carbon", "warming", "temperature"]
        }
        for m_cat, m_words in metric_keywords.items():
            if any(w in text_lower for w in m_words):
                metric = m_cat.capitalize()
                break

        words = [w.strip(",.!?") for w in claim_text.split() if len(w) > 2]
        subject = " ".join(words[:4]) if words else claim_text

        return ClaimAnalysis(
            subject=subject,
            comparison=comparison,
            metric=metric,
            qualifiers=qualifiers_found,
            claim_type=claim_type,
            is_absolute_claim=is_absolute,
            is_extraordinary_claim=is_extraordinary
        )

claim_analyzer = ClaimAnalyzer()
