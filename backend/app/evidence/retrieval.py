import re
import uuid
from typing import List, Dict
from urllib.parse import urlparse
from app.schemas.domain import (
    EvidenceItem, EvidenceRelationship, SourceQuality, ModelRunResult
)
from app.evidence.web_search import (
    gather_web_sources, extract_urls_from_text, is_usable_source_url,
    normalize_url, source_quality, filter_live_urls
)

EXTRAORDINARY_PATTERNS = [
    r"\balien", r"\bufos?\b", r"extraterrestrial", r"visited earth",
    r"\bbigfoot\b", r"\bflat earth\b", r"\bchemtrail", r"\billuminati\b",
    r"\breptilian", r"\bghost(s)?\b", r"\btime travel\b", r"\bhollow earth\b",
    r"lizard people", r"\bnibiru\b", r"ancient astronaut",
]

REFUTE_CUES = [
    "no evidence", "no scientific evidence", "no credible evidence", "no confirmed",
    "no verified", "unconfirmed", "unverified", "debunked", "hoax", "conspiracy",
    "not been proven", "has never", "never been proven", "no proof", "lacks evidence",
    "pseudoscience", "did not happen", "did not occur", "false claim", "myth",
    "there is no", "scientific consensus", "no official", "not established",
    "insufficient evidence", "no documented", "fiction", "fictional",
]

SUPPORT_CUES = [
    "confirmed that", "officially confirmed", "verified that", "was documented",
    "peer-reviewed evidence", "scientists confirmed", "official record",
    "took place in", "occurred in", "occurred on", "historical record shows",
]

class EvidenceRetrievalEngine:
    def is_extraordinary_claim(self, query: str) -> bool:
        text = (query or "").lower()
        return any(re.search(p, text) for p in EXTRAORDINARY_PATTERNS)

    def _classify(self, query: str, title: str, snippet: str) -> EvidenceRelationship:
        blob = f"{title} {snippet}".lower()
        claim = (query or "").lower()
        refute_hits = sum(1 for cue in REFUTE_CUES if cue in blob)
        support_hits = sum(1 for cue in SUPPORT_CUES if cue in blob)
        extraordinary = self.is_extraordinary_claim(query)

        claim_tokens = [w for w in re.findall(r"[a-z0-9]{4,}", claim) if w not in {
            "that", "this", "with", "from", "have", "been", "were", "will", "visited"
        }]
        overlap = sum(1 for t in claim_tokens if t in blob)

        if extraordinary:
            if support_hits >= 2 and refute_hits == 0:
                return EvidenceRelationship.SUPPORTS
            if refute_hits > 0 or overlap >= 1:
                return EvidenceRelationship.CONTRADICTS
            return EvidenceRelationship.CONTRADICTS

        if refute_hits > support_hits:
            return EvidenceRelationship.CONTRADICTS
        if support_hits > 0 and refute_hits == 0:
            return EvidenceRelationship.SUPPORTS
        if overlap >= max(2, len(claim_tokens) // 2) and refute_hits == 0:
            return EvidenceRelationship.SUPPORTS
        return EvidenceRelationship.NEUTRAL

    def _quality(self, url: str) -> SourceQuality:
        rank = source_quality(url)
        return SourceQuality.HIGH if rank == "HIGH" else SourceQuality.LOW if rank == "LOW" else SourceQuality.MEDIUM

    def _item_from_hit(self, query: str, hit: Dict[str, str], agent: str) -> EvidenceItem:
        title = hit.get("title") or urlparse(hit["url"]).path.replace("/wiki/", "").replace("_", " ")
        snippet = (hit.get("snippet") or "").strip() or title
        rel = self._classify(query, title, snippet)
        return EvidenceItem(
            evidence_id=f"ev_{uuid.uuid4().hex[:8]}",
            text=snippet[:400] if snippet else title,
            source_title=title[:180],
            source_url=hit["url"],
            source_type=hit.get("source_type") or "Web Source",
            relationship=rel,
            quality=self._quality(hit["url"]),
            timestamp=(hit.get("timestamp") or "")[:10],
            research_agent=agent
        )

    async def extract_evidence(self, query: str, model_runs: List[ModelRunResult]) -> List[EvidenceItem]:
        items: List[EvidenceItem] = []
        seen_urls = set()

        def add_hit(hit: Dict[str, str], agent: str):
            url = normalize_url(hit.get("url") or "")
            if not is_usable_source_url(url) or url in seen_urls:
                return
            seen_urls.add(url)
            hit = {**hit, "url": url}
            items.append(self._item_from_hit(query, hit, agent))

        for run in model_runs:
            agent = run.model_name or "Research Agent"
            for src in run.grounding_sources or []:
                add_hit({
                    "title": src.title,
                    "url": src.url,
                    "snippet": src.snippet,
                    "timestamp": "",
                    "source_type": "Model Grounding",
                }, agent)
            for url in extract_urls_from_text(run.response_text or ""):
                add_hit({
                    "title": urlparse(url).path.rsplit("/", 1)[-1].replace("_", " ") or url,
                    "url": url,
                    "snippet": "",
                    "timestamp": "",
                    "source_type": "Cited URL",
                }, agent)

        web_hits = []
        search_queries = [query]
        if self.is_extraordinary_claim(query):
            search_queries.append("scientific evidence extraterrestrial visitation Earth")
            search_queries.append("unidentified flying object scientific consensus SETI")
        try:
            for q in search_queries:
                web_hits.extend(await gather_web_sources(q))
        except Exception as exc:
            print(f"[Evidence] Web search failed: {exc}")

        for hit in web_hits:
            add_hit(hit, "Web Retrieval")

        if items:
            live_hits = await filter_live_urls([{"url": e.source_url, "title": e.source_title, "snippet": e.text, "timestamp": e.timestamp, "source_type": e.source_type} for e in items if e.source_url])
            live_urls = {h["url"] for h in live_hits}
            items = [e for e in items if not e.source_url or e.source_url in live_urls]
            items = items[:10]

        if not items:
            rel = EvidenceRelationship.CONTRADICTS if self.is_extraordinary_claim(query) else EvidenceRelationship.NEUTRAL
            items.append(EvidenceItem(
                evidence_id=f"ev_{uuid.uuid4().hex[:8]}",
                text=(
                    "No indexed public article confirmed this claim. Extraordinary or specific events "
                    "require documented sources; none were retrieved."
                ),
                source_title="No grounded public source found",
                source_url="",
                source_type="Ungrounded",
                relationship=rel,
                quality=SourceQuality.LOW,
                timestamp="",
                research_agent="ClaimNexus Retrieval"
            ))

        return items

evidence_engine = EvidenceRetrievalEngine()
