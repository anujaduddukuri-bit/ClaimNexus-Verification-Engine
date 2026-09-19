import time
import httpx
from app.providers.base import BaseLLMProvider
from app.schemas.domain import ModelRunResult, GroundingSource
from app.providers.prompts import factcheck_prompt, stance_confidence
from app.evidence.web_search import extract_urls_from_text

class GroqProvider(BaseLLMProvider):
    def __init__(self, api_key: str = None, model: str = "llama-3.3-70b-versatile"):
        super().__init__(name="Groq", default_model=model, api_key=api_key)
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"

    async def generate_response(
        self,
        query: str,
        model: str = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        timeout: int = 30
    ) -> ModelRunResult:
        start_time = time.time()
        target_model = model or self.default_model

        if not self.api_key:
            return ModelRunResult(
                model_name=f"Groq ({target_model})",
                status="FAILED",
                response_text="",
                latency_seconds=round(time.time() - start_time, 2),
                token_count=0,
                error_message="Groq API key not configured."
            )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": target_model,
            "messages": [
                {"role": "system", "content": "You verify claims skeptically using public knowledge. Never treat an extraordinary claim as true without documented evidence. Use plain text, no markdown asterisks."},
                {"role": "user", "content": factcheck_prompt(query)}
            ],
            "temperature": min(temperature, 0.35),
            "max_tokens": max_tokens
        }

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(self.api_url, headers=headers, json=payload)
                if response.status_code != 200:
                    err_json = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
                    err_msg = err_json.get("error", {}).get("message", response.text[:200])
                    return ModelRunResult(
                        model_name=f"Groq ({target_model})",
                        status="FAILED",
                        response_text="",
                        latency_seconds=round(time.time() - start_time, 2),
                        token_count=0,
                        error_message=f"Groq API Error ({response.status_code}): {err_msg}"
                    )

                data = response.json()
                content = data["choices"][0]["message"]["content"]
                usage = data.get("usage", {})
                token_count = usage.get("total_tokens", len(content.split()) * 2)
                latency = round(time.time() - start_time, 2)
                grounding_sources = [
                    GroundingSource(title="", url=url, snippet="")
                    for url in extract_urls_from_text(content)
                ]

                return ModelRunResult(
                    model_name=f"Groq ({target_model})",
                    status="COMPLETED",
                    response_text=content,
                    latency_seconds=latency,
                    token_count=token_count,
                    confidence_score=stance_confidence(content),
                    grounding_sources=grounding_sources
                )
        except httpx.TimeoutException:
            return ModelRunResult(
                model_name=f"Groq ({target_model})",
                status="TIMEOUT",
                response_text="",
                latency_seconds=round(time.time() - start_time, 2),
                token_count=0,
                error_message=f"Groq request timed out after {timeout} seconds."
            )
        except Exception as e:
            return ModelRunResult(
                model_name=f"Groq ({target_model})",
                status="FAILED",
                response_text="",
                latency_seconds=round(time.time() - start_time, 2),
                token_count=0,
                error_message=str(e)
            )
