import time
import asyncio
import httpx
from app.providers.base import BaseLLMProvider
from app.schemas.domain import ModelRunResult, GroundingSource
from app.providers.prompts import factcheck_prompt, stance_confidence
from app.evidence.web_search import extract_urls_from_text, is_usable_source_url

class GeminiProvider(BaseLLMProvider):
    def __init__(self, api_key: str = None, model: str = "gemini-3.6-flash"):
        super().__init__(name="Google Gemini", default_model=model or "gemini-3.6-flash", api_key=api_key)

    def _endpoint_candidates(self, target_model: str):
        """AI Studio auth keys (AQ.) need x-goog-api-key; Vertex express keys use aiplatform."""
        key = self.api_key
        json_headers = {"Content-Type": "application/json"}
        studio = f"https://generativelanguage.googleapis.com/v1beta/models/{target_model}:generateContent"
        vertex = f"https://aiplatform.googleapis.com/v1/publishers/google/models/{target_model}:generateContent"
        vertex_beta = f"https://aiplatform.googleapis.com/v1beta1/publishers/google/models/{target_model}:generateContent"

        candidates = [
            (studio, {**json_headers, "x-goog-api-key": key}),
            (f"{studio}?key={key}", json_headers),
        ]
        if key.startswith("AQ."):
            candidates.extend([
                (vertex, {**json_headers, "x-goog-api-key": key}),
                (f"{vertex}?key={key}", json_headers),
                (vertex_beta, {**json_headers, "x-goog-api-key": key}),
                (f"{vertex_beta}?key={key}", json_headers),
            ])
        return candidates

    def _parse_success(self, data: dict, target_model: str, start_time: float) -> ModelRunResult:
        candidates = data.get("candidates", [])
        if not candidates:
            prompt_feedback = data.get("promptFeedback", {})
            block_reason = prompt_feedback.get("blockReason", "No candidates returned")
            print(f"[GeminiProvider] Response blocked: {block_reason}")
            return ModelRunResult(
                model_name=f"Gemini ({target_model})",
                status="FAILED",
                response_text="",
                latency_seconds=round(time.time() - start_time, 2),
                token_count=0,
                error_message=f"Gemini response blocked: {block_reason}"
            )

        first_cand = candidates[0]
        finish_reason = first_cand.get("finishReason", "")
        parts = first_cand.get("content", {}).get("parts", [])
        if not parts:
            print(f"[GeminiProvider] Empty parts, finishReason: {finish_reason}")
            return ModelRunResult(
                model_name=f"Gemini ({target_model})",
                status="FAILED",
                response_text="",
                latency_seconds=round(time.time() - start_time, 2),
                token_count=0,
                error_message=f"Gemini returned empty response (finishReason: {finish_reason})"
            )

        content = "".join([p.get("text", "") for p in parts if "text" in p])
        usage = data.get("usageMetadata", {})
        token_count = usage.get("totalTokenCount", len(content.split()) * 2)
        grounding_sources = self._extract_grounding(first_cand, content)
        return ModelRunResult(
            model_name=f"Gemini ({target_model})",
            status="COMPLETED",
            response_text=content,
            latency_seconds=round(time.time() - start_time, 2),
            token_count=token_count,
            confidence_score=stance_confidence(content),
            grounding_sources=grounding_sources
        )

    def _extract_grounding(self, candidate: dict, content: str) -> list:
        sources = []
        seen = set()
        metadata = candidate.get("groundingMetadata") or {}
        for chunk in metadata.get("groundingChunks") or []:
            web = chunk.get("web") or {}
            url = web.get("uri") or web.get("url") or ""
            title = web.get("title") or ""
            if url and url not in seen and is_usable_source_url(url):
                seen.add(url)
                sources.append(GroundingSource(title=title, url=url, snippet=""))
        for url in extract_urls_from_text(content):
            if url not in seen:
                seen.add(url)
                sources.append(GroundingSource(title="", url=url, snippet=""))
        return sources

    async def generate_response(
        self,
        query: str,
        model: str = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        timeout: int = 30
    ) -> ModelRunResult:
        start_time = time.time()
        primary_model = model or self.default_model

        models_to_try = [primary_model]
        for fallback in ("gemini-3.6-flash", "gemini-flash-lite-latest", "gemini-2.0-flash"):
            if fallback not in models_to_try:
                models_to_try.append(fallback)

        if not self.api_key:
            return ModelRunResult(
                model_name=f"Google Gemini ({primary_model})",
                status="FAILED",
                response_text="",
                latency_seconds=round(time.time() - start_time, 2),
                token_count=0,
                error_message="Gemini API key not configured."
            )

        payload_base = {
            "contents": [{
                "parts": [{
                    "text": factcheck_prompt(query)
                }]
            }],
            "generationConfig": {
                "temperature": min(temperature, 0.35),
                "maxOutputTokens": max(max_tokens, 1024)
            }
        }

        last_error = ""
        async with httpx.AsyncClient(timeout=max(timeout, 40)) as client:
            for attempt, target_model in enumerate(models_to_try):
                auth_failed = False
                for use_search in (True, False):
                    payload = dict(payload_base)
                    if use_search:
                        payload["tools"] = [{"google_search": {}}]
                    for url, headers in self._endpoint_candidates(target_model):
                        try:
                            response = await client.post(url, headers=headers, json=payload)

                            if response.status_code == 200:
                                parsed = self._parse_success(response.json(), target_model, start_time)
                                if parsed.status == "COMPLETED":
                                    return parsed
                                last_error = parsed.error_message
                                continue

                            err_json = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
                            err_msg = err_json.get("error", {}).get("message", response.text[:200])
                            last_error = f"Gemini API Error ({response.status_code}): {err_msg}"
                            print(f"[GeminiProvider] {target_model} HTTP {response.status_code}: {err_msg}")

                            if response.status_code in (401, 403):
                                auth_failed = True
                                continue
                            if response.status_code in (404,):
                                break
                            if response.status_code == 400 and use_search:
                                break
                            if response.status_code in (429, 503):
                                await asyncio.sleep(1)
                                break
                        except httpx.TimeoutException:
                            last_error = f"Gemini request timed out after {timeout} seconds."
                            print(f"[GeminiProvider] Timed out for {target_model}")
                        except Exception as e:
                            last_error = str(e)
                            print(f"[GeminiProvider] Exception on {target_model}: {e}")

                if auth_failed:
                    continue

        status = "TIMEOUT" if "timed out" in (last_error or "").lower() else "FAILED"
        return ModelRunResult(
            model_name=f"Gemini ({primary_model})",
            status=status,
            response_text="",
            latency_seconds=round(time.time() - start_time, 2),
            token_count=0,
            error_message=last_error or "All Gemini models failed."
        )
