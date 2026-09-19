import time
import httpx
from app.providers.base import BaseLLMProvider
from app.schemas.domain import ModelRunResult

class XAIProvider(BaseLLMProvider):
    def __init__(self, api_key: str = None, model: str = "grok-2-latest"):
        super().__init__(name="xAI", default_model=model, api_key=api_key)
        self.api_url = "https://api.x.ai/v1/chat/completions"

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
                model_name=f"xAI ({target_model})",
                status="FAILED",
                response_text="",
                latency_seconds=round(time.time() - start_time, 2),
                token_count=0,
                error_message="xAI API key not configured."
            )

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": target_model,
            "messages": [
                {"role": "system", "content": "You are xAI Grok, an analytical, precise AI research agent. Provide direct, objective factual findings."},
                {"role": "user", "content": query}
            ],
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        try:
            async with httpx.AsyncClient(timeout=timeout) as client:
                response = await client.post(self.api_url, headers=headers, json=payload)
                if response.status_code != 200:
                    err_json = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
                    err_msg = err_json.get("error", err_json.get("message", response.text[:200]))
                    return ModelRunResult(
                        model_name=f"xAI ({target_model})",
                        status="FAILED",
                        response_text="",
                        latency_seconds=round(time.time() - start_time, 2),
                        token_count=0,
                        error_message=f"xAI API Error ({response.status_code}): {err_msg}"
                    )
                
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                token_usage = data.get("usage", {}).get("total_tokens", len(content.split()) * 2)
                latency = round(time.time() - start_time, 2)
                
                return ModelRunResult(
                    model_name=f"xAI ({target_model})",
                    status="COMPLETED",
                    response_text=content,
                    latency_seconds=latency,
                    token_count=token_usage,
                    confidence_score=0.92
                )
        except httpx.TimeoutException:
            return ModelRunResult(
                model_name=f"xAI ({target_model})",
                status="TIMEOUT",
                response_text="",
                latency_seconds=round(time.time() - start_time, 2),
                token_count=0,
                error_message=f"xAI request timed out after {timeout} seconds."
            )
        except Exception as e:
            return ModelRunResult(
                model_name=f"xAI ({target_model})",
                status="FAILED",
                response_text="",
                latency_seconds=round(time.time() - start_time, 2),
                token_count=0,
                error_message=str(e)
            )
