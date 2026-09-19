from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.core.config import settings

router = APIRouter(prefix="/settings", tags=["Settings"])

class AlgorithmSettingsUpdateSchema(BaseModel):
    default_similarity_threshold: Optional[float] = None
    default_temperature: Optional[float] = None
    default_max_tokens: Optional[int] = None

@router.get("")
async def get_settings():
    """Retrieve system settings (Server environment status and algorithm parameters).
    NOTE: API keys are NEVER exposed to the frontend browser."""
    return {
        "xai_configured": bool(settings.XAI_API_KEY),
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "groq_configured": bool(settings.GROQ_API_KEY),
        "embedding_model": settings.EMBEDDING_MODEL_NAME,
        "default_similarity_threshold": settings.DEFAULT_SIMILARITY_THRESHOLD,
        "default_temperature": settings.TEMPERATURE_DEFAULT,
        "default_max_tokens": settings.MAX_TOKENS_DEFAULT
    }

@router.put("")
async def update_algorithm_settings(payload: AlgorithmSettingsUpdateSchema):
    """Update runtime algorithm parameters (similarity threshold, temperature, max tokens)."""
    if payload.default_similarity_threshold is not None:
        settings.DEFAULT_SIMILARITY_THRESHOLD = payload.default_similarity_threshold
    if payload.default_temperature is not None:
        settings.TEMPERATURE_DEFAULT = payload.default_temperature
    if payload.default_max_tokens is not None:
        settings.MAX_TOKENS_DEFAULT = payload.default_max_tokens

    return {"status": "success", "message": "Algorithm parameters updated successfully."}
