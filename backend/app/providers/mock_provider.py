import asyncio
import random
import time
from app.providers.base import BaseLLMProvider
from app.schemas.domain import ModelRunResult

class MockProvider(BaseLLMProvider):
    def __init__(self, provider_id: str, display_name: str, model_name: str):
        super().__init__(name=display_name, default_model=model_name)
        self.provider_id = provider_id.lower()

    async def generate_response(
        self,
        query: str,
        model: str = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
        timeout: int = 30
    ) -> ModelRunResult:
        start_time = time.time()
        
        latency_sim = {
            "gemini": random.uniform(1.4, 2.2),
            "groq": random.uniform(0.6, 1.2)
        }.get(self.provider_id, 1.5)
        
        await asyncio.sleep(latency_sim)
        
        response_text = self._build_simulated_response(query)
        latency = round(time.time() - start_time, 2)
        token_count = len(response_text.split()) * 2

        return ModelRunResult(
            model_name=f"{self.name} ({model or self.default_model}) [DEMO]",
            status="COMPLETED",
            response_text=response_text,
            latency_seconds=latency,
            token_count=token_count,
            confidence_score=round(random.uniform(0.88, 0.96), 2)
        )

    def _build_simulated_response(self, query: str) -> str:
        q_lower = query.lower()
        
        if "rag" in q_lower or "retrieval" in q_lower or "fine-tuning" in q_lower:
            if self.provider_id == "gemini":
                return (
                    "RAG (Retrieval-Augmented Generation) connects large language models to non-parametric external memory sources.\n"
                    "1. RAG provides external dynamic knowledge to LLMs, reducing static knowledge cutoffs.\n"
                    "2. Fine-tuning adapts model tone and domain alignment, but fine-tuning does not completely eliminate hallucinations on factual updates.\n"
                    "3. RAG architectures offer complete source attribution and verifiable citations for factual auditability.\n"
                    "4. Fine-tuning always guarantees lower latency compared to RAG query vector index search lookups."
                )
            else: # groq
                return (
                    "RAG integrates vector search databases directly into the prompt context window of generative architectures.\n"
                    "1. RAG enables dynamic factual context injection into LLM prompts from enterprise knowledge graphs.\n"
                    "2. Fine-tuning adjusts internal neural network parameters for task specialization.\n"
                    "3. RAG significantly decreases factual hallucinations compared to pure parametric generation.\n"
                    "4. Fine-tuning increases operational throughput by eliminating long prompt context overheads."
                )

        elif "quantum" in q_lower or "computing" in q_lower or "cryptography" in q_lower:
            if self.provider_id == "gemini":
                return (
                    "Quantum systems manipulate qubits across superposition states to solve specialized complex problems.\n"
                    "1. Quantum key distribution (QKD) provides physical-layer security guaranteed by quantum mechanics.\n"
                    "2. Shor's algorithm breaks classical asymmetric encryption schemes like RSA and ECC.\n"
                    "3. Lattice-based cryptography is the primary candidate for Post-Quantum Cryptography standardization.\n"
                    "4. Fault-tolerant quantum computation is expected to be achieved within the next 5 to 7 years."
                )
            else: # groq
                return (
                    "Quantum computational units (qubits) enable massive parallel state evaluations using quantum entanglement.\n"
                    "1. Shor's algorithm renders public-key infrastructure vulnerable by solving discrete logarithms efficiently.\n"
                    "2. Post-Quantum Cryptography algorithms can be deployed on existing classical computing hardware.\n"
                    "3. NISQ devices currently lack error mitigation capabilities needed for large-scale cryptanalysis.\n"
                    "4. Quantum Key Distribution requires specialized optical fiber hardware infrastructure."
                )
        
        if self.provider_id == "gemini":
            return (
                f"Scientific breakdown of '{query}':\n"
                f"1. The underlying principles of {query} stem from interconnected algorithmic layers.\n"
                f"2. Empirical validation confirms high reliability when operating under standardized thresholds.\n"
                f"3. System modularity allows for seamless horizontal scaling and component integration.\n"
                f"4. Potential failure modes are primarily driven by external boundary state anomalies."
            )
        else: # groq
            return (
                f"High-throughput analysis of '{query}':\n"
                f"1. {query.capitalize()} involves optimized algorithmic pipelines and parallelized state processing.\n"
                f"2. Quantitative benchmarks show a 40% performance gain when leveraging distributed orchestration.\n"
                f"3. Security and integrity guarantees are enforced through deterministic validation rules.\n"
                f"4. Edge cases require fault-tolerant failover routing mechanisms."
            )
