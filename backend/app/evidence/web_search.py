import re
from typing import Dict, List
from urllib.parse import unquote, urlparse, quote
import httpx

USER_AGENT = "ClaimNexus/1.0 (claim-verification; educational research)"
URL_RE = re.compile(r"https?://[^\s\)\]\>\"'<>]+", re.IGNORECASE)

HOMEPAGE_ONLY = {"", "/", "/news", "/en", "/wiki", "/wiki/"}

HIGH_QUALITY_HOSTS = {
    "en.wikipedia.org", "www.wikipedia.org", "wikipedia.org",
    "www.nature.com", "nature.com", "www.science.org", "science.org",
    "www.reuters.com", "reuters.com", "apnews.com", "www.apnews.com",
    "www.bbc.com", "bbc.com", "www.bbc.co.uk",
    "www.nasa.gov", "nasa.gov", "www.seti.org", "seti.org",
    "www.esa.int", "esa.int", "www.nih.gov", "nih.gov", "www.cdc.gov", "cdc.gov",
    "www.who.int", "who.int", "arxiv.org", "www.britannica.com",
    "www.nationalgeographic.com", "pubmed.ncbi.nlm.nih.gov",
}

LOW_QUALITY_HOSTS = {
    "www.reddit.com", "reddit.com", "www.quora.com", "quora.com",
    "www.pinterest.com", "pinterest.com", "twitter.com", "x.com",
    "www.facebook.com", "facebook.com", "www.tiktok.com",
}


def normalize_url(raw: str) -> str:
    if not raw:
        return ""
    url = raw.strip().rstrip(").,;\"'")
    url = unquote(url)
    if url.startswith("//"):
        url = "https:" + url
    parsed = urlparse(url)
    if parsed.netloc.endswith("duckduckgo.com") and "uddg=" in (parsed.query or ""):
        for part in parsed.query.split("&"):
            if part.startswith("uddg="):
                return normalize_url(unquote(part[5:]))
    if not parsed.scheme.startswith("http"):
        return ""
    return url


def is_usable_source_url(url: str) -> bool:
    url = normalize_url(url)
    if not url:
        return False
    parsed = urlparse(url)
    host = parsed.netloc.lower().replace("www.", "")
    if host in {"example.com", "localhost"}:
        return False
    if "duckduckgo.com" in host:
        return False
    path = parsed.path or "/"
    # Require a real article/page path, not a bare homepage.
    if path in HOMEPAGE_ONLY:
        return False
    return True


def source_quality(url: str) -> str:
    host = urlparse(url).netloc.lower()
    if host in HIGH_QUALITY_HOSTS or host.replace("www.", "") in {h.replace("www.", "") for h in HIGH_QUALITY_HOSTS}:
        return "HIGH"
    if host in LOW_QUALITY_HOSTS:
        return "LOW"
    return "MEDIUM"


def extract_urls_from_text(text: str) -> List[str]:
    found = []
    for match in URL_RE.findall(text or ""):
        url = normalize_url(match)
        if is_usable_source_url(url) and url not in found:
            found.append(url)
    return found


async def search_wikipedia(query: str, limit: int = 5) -> List[Dict[str, str]]:
    results: List[Dict[str, str]] = []
    params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "srlimit": limit,
        "srprop": "snippet|timestamp",
        "format": "json",
        "utf8": 1,
    }
    headers = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=12.0, headers=headers, follow_redirects=True) as client:
            resp = await client.get("https://en.wikipedia.org/w/api.php", params=params)
            resp.raise_for_status()
            hits = resp.json().get("query", {}).get("search", [])
            for hit in hits:
                title = (hit.get("title") or "").strip()
                if not title:
                    continue
                encoded = quote(title.replace(" ", "_"), safe="()_,-")
                url = f"https://en.wikipedia.org/wiki/{encoded}"
                snippet = re.sub(r"<[^>]+>", "", hit.get("snippet") or "")
                snippet = re.sub(r"\s+", " ", snippet).strip()
                results.append({
                    "title": title,
                    "url": url,
                    "snippet": snippet,
                    "timestamp": (hit.get("timestamp") or "")[:10],
                    "source_type": "Encyclopedia",
                })
    except Exception as exc:
        print(f"[WebSearch] Wikipedia search failed: {exc}")
    return results


async def search_duckduckgo(query: str, limit: int = 6) -> List[Dict[str, str]]:
    results: List[Dict[str, str]] = []
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/json, text/html",
    }
    try:
        async with httpx.AsyncClient(timeout=12.0, headers=headers, follow_redirects=True) as client:
            ia = await client.get(
                "https://api.duckduckgo.com/",
                params={"q": query, "format": "json", "no_html": 1, "no_redirect": 1, "skip_disambig": 1},
            )
            if ia.status_code == 200:
                data = ia.json()
                abstract_url = normalize_url(data.get("AbstractURL") or "")
                abstract_text = (data.get("AbstractText") or "").strip()
                heading = (data.get("Heading") or data.get("AbstractSource") or "").strip()
                if is_usable_source_url(abstract_url):
                    results.append({
                        "title": heading or abstract_url,
                        "url": abstract_url,
                        "snippet": abstract_text,
                        "timestamp": "",
                        "source_type": data.get("AbstractSource") or "Web",
                    })
                for topic in data.get("RelatedTopics") or []:
                    entries = topic.get("Topics") if isinstance(topic, dict) and "Topics" in topic else [topic]
                    for entry in entries:
                        if not isinstance(entry, dict):
                            continue
                        url = normalize_url(entry.get("FirstURL") or "")
                        if not is_usable_source_url(url):
                            continue
                        text = re.sub(r"\s+", " ", entry.get("Text") or "").strip()
                        results.append({
                            "title": (text.split(" - ")[0] if text else url)[:120],
                            "url": url,
                            "snippet": text,
                            "timestamp": "",
                            "source_type": "Web",
                        })
                        if len(results) >= limit:
                            break

            html_resp = await client.post(
                "https://html.duckduckgo.com/html/",
                data={"q": query, "kl": "us-en"},
                headers={**headers, "Content-Type": "application/x-www-form-urlencoded"},
            )
            if html_resp.status_code == 200:
                for match in re.finditer(
                    r'uddg=([^&"]+).*?class="result__a"[^>]*>(.*?)</a>.*?class="result__snippet"[^>]*>(.*?)</(?:a|td|div)',
                    html_resp.text,
                    re.IGNORECASE | re.DOTALL,
                ):
                    url = normalize_url(unquote(match.group(1)))
                    title = re.sub(r"<[^>]+>", "", match.group(2)).strip()
                    snippet = re.sub(r"<[^>]+>", "", match.group(3)).strip()
                    if not is_usable_source_url(url):
                        continue
                    results.append({
                        "title": title[:160] or url,
                        "url": url,
                        "snippet": re.sub(r"\s+", " ", snippet)[:400],
                        "timestamp": "",
                        "source_type": "Web Search",
                    })
                if "uddg=" not in html_resp.text:
                    for href in re.finditer(r'href="(https?://(?!duckduckgo\.com)[^"]+)"', html_resp.text):
                        url = normalize_url(href.group(1))
                        if is_usable_source_url(url):
                            results.append({
                                "title": urlparse(url).path.rsplit("/", 1)[-1].replace("_", " ") or url,
                                "url": url,
                                "snippet": "",
                                "timestamp": "",
                                "source_type": "Web Search",
                            })
    except Exception as exc:
        print(f"[WebSearch] DuckDuckGo search failed: {exc}")

    deduped: List[Dict[str, str]] = []
    seen = set()
    for item in results:
        url = item.get("url") or ""
        if url in seen:
            continue
        seen.add(url)
        deduped.append(item)
        if len(deduped) >= limit:
            break
    return deduped


async def validate_source_url(client: httpx.AsyncClient, url: str) -> bool:
    if not is_usable_source_url(url):
        return False
    host = urlparse(url).netloc.lower()
    if "wikipedia.org" in host:
        return True
    try:
        resp = await client.head(url, follow_redirects=True, timeout=5.0)
        if resp.status_code < 400:
            return True
        if resp.status_code in (401, 403, 405):
            resp = await client.get(url, follow_redirects=True, timeout=5.0)
            return resp.status_code < 400
        return False
    except Exception:
        return False


async def filter_live_urls(hits: List[Dict[str, str]]) -> List[Dict[str, str]]:
    import asyncio
    if not hits:
        return []
    headers = {"User-Agent": USER_AGENT, "Accept": "text/html"}
    live: List[Dict[str, str]] = []
    async with httpx.AsyncClient(timeout=6.0, headers=headers, follow_redirects=True) as client:
        checks = [validate_source_url(client, hit.get("url") or "") for hit in hits]
        results = await asyncio.gather(*checks, return_exceptions=True)
        for hit, ok in zip(hits, results):
            if ok is True:
                live.append(hit)
    return live


async def gather_web_sources(query: str) -> List[Dict[str, str]]:
    wiki, ddg = await _gather(query)
    combined = wiki + ddg
    deduped: List[Dict[str, str]] = []
    seen = set()
    for item in combined:
        url = normalize_url(item.get("url") or "")
        if not is_usable_source_url(url) or url in seen:
            continue
        seen.add(url)
        item["url"] = url
        deduped.append(item)
    return deduped[:10]


async def _gather(query: str):
    import asyncio
    return await asyncio.gather(
        search_wikipedia(query),
        search_duckduckgo(query),
        return_exceptions=False,
    )
