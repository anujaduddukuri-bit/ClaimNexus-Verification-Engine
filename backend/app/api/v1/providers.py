from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/providers", tags=["Providers"])

@router.get("")
async def get_providers_status():
    """Check configured LLM provider status and capabilities for ClaimNexus."""
    return {
        "providers": [
            {
                "id": "gemini",
                "name": "Google Gemini",
                "model": settings.GEMINI_MODEL,
                "configured": bool(settings.GEMINI_API_KEY),
                "status": "ONLINE" if settings.GEMINI_API_KEY else "API Configuration Required"
            },
            {
                "id": "groq",
                "name": "Groq LLaMA-3",
                "model": settings.GROQ_MODEL,
                "configured": bool(settings.GROQ_API_KEY),
                "status": "ONLINE" if settings.GROQ_API_KEY else "API Configuration Required"
            }
        ]
    }
