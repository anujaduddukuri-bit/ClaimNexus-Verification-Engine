from app.core.config import settings, reload_env
from app.providers.base import BaseLLMProvider
from app.providers.gemini_provider import GeminiProvider
from app.providers.groq_provider import GroqProvider
from app.providers.mock_provider import MockProvider

class ProviderFactory:
    @staticmethod
    def get_provider(provider_id: str, demo_mode: bool = False) -> BaseLLMProvider:
        reload_env()
        pid = provider_id.lower()
        
        if demo_mode:
            display_names = {
                "gemini": "Google Gemini",
                "groq": "Groq LLaMA-3"
            }
            model_names = {
                "gemini": settings.GEMINI_MODEL,
                "groq": settings.GROQ_MODEL
            }
            return MockProvider(
                provider_id=pid,
                display_name=display_names.get(pid, pid.upper()),
                model_name=model_names.get(pid, "default-model")
            )
            
        if pid == "gemini":
            return GeminiProvider(api_key=settings.GEMINI_API_KEY, model=settings.GEMINI_MODEL)
        elif pid == "groq":
            return GroqProvider(api_key=settings.GROQ_API_KEY, model=settings.GROQ_MODEL)
        else:
            return MockProvider(provider_id=pid, display_name=pid.capitalize(), model_name="unknown-model")
