from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("")
async def health_check():
    """System health status endpoint."""
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "providers_ready": {
            "gemini": bool(settings.GEMINI_API_KEY),
            "groq": bool(settings.GROQ_API_KEY),
            "demo_fallback": True
        }
    }
