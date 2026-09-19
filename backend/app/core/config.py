import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent.parent
root_dir = backend_dir.parent
ENV_FILE = root_dir / ".env"

def _clean_secret(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    cleaned = str(value).strip().strip('"').strip("'")
    return cleaned or None

def load_project_env() -> None:
    """Project .env must win over stale Windows/user environment keys."""
    if ENV_FILE.exists():
        load_dotenv(ENV_FILE, override=True)
    backend_env = backend_dir / ".env"
    if backend_env.exists():
        load_dotenv(backend_env, override=True)

load_project_env()

class Settings(BaseSettings):
    PROJECT_NAME: str = "ClaimNexus — Multi-Agent Claim Verification & Evidence Engine"
    API_V1_STR: str = "/api/v1"
    
    # Provider Keys
    GEMINI_API_KEY: Optional[str] = None
    GROQ_API_KEY: Optional[str] = None
    XAI_API_KEY: Optional[str] = None
    
    # Active Models Configuration
    GEMINI_MODEL: str = "gemini-3.6-flash"
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    
    # Database & Cache
    DATABASE_URL: str = f"sqlite:///{(backend_dir / 'claimnexus.db').as_posix()}"
    REDIS_URL: Optional[str] = "redis://localhost:6379/0"
    
    # Embedding Configuration
    EMBEDDING_MODEL_NAME: str = "all-MiniLM-L6-v2"
    DEFAULT_SIMILARITY_THRESHOLD: float = 0.82
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "https://claimnexus.vercel.app",
        "*"
    ]
    
    # Execution Defaults
    DEFAULT_TIMEOUT: int = 30
    MAX_TOKENS_DEFAULT: int = 1024
    TEMPERATURE_DEFAULT: float = 0.7
    
    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE) if ENV_FILE.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("GEMINI_API_KEY", "GROQ_API_KEY", "XAI_API_KEY", mode="before")
    @classmethod
    def strip_api_keys(cls, value: Optional[str]) -> Optional[str]:
        return _clean_secret(value)

    @model_validator(mode="after")
    def fallback_google_api_key(self):
        if not self.GEMINI_API_KEY:
            self.GEMINI_API_KEY = _clean_secret(os.getenv("GOOGLE_API_KEY"))
        return self

def reload_env() -> None:
    """Re-read .env on each provider call so new keys apply without a full restart."""
    load_project_env()
    settings.GEMINI_API_KEY = _clean_secret(os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"))
    settings.GROQ_API_KEY = _clean_secret(os.getenv("GROQ_API_KEY"))
    settings.XAI_API_KEY = _clean_secret(os.getenv("XAI_API_KEY"))

settings = Settings()
reload_env()
