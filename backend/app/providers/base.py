from abc import ABC, abstractmethod
from typing import Dict, Any
from app.schemas.domain import ModelRunResult

class BaseLLMProvider(ABC):
    def __init__(self, name: str, default_model: str, api_key: str = None):
        self.name = name
        self.default_model = default_model
        key = (api_key or "").strip().strip('"').strip("'")
        self.api_key = key or None

    @abstractmethod
    async def generate_response(
        self,
        query: str,
        model: str = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        timeout: int = 30
    ) -> ModelRunResult:
        """Execute query asynchronously against the provider and return standardized ModelRunResult."""
        pass
