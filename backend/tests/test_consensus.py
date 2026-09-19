import pytest
import pytest_asyncio
from app.providers.mock_provider import MockProvider
from app.consensus.engine import consensus_engine
from app.agents.critic_agent import critic_agent
from app.agents.synthesis_agent import synthesis_agent
from app.schemas.domain import ModelRunResult

@pytest.mark.asyncio
async def test_mock_provider_generation():
    provider = MockProvider("gemini", "Google Gemini", "gemini-2.5-flash")
    res = await provider.generate_response("What is RAG in AI?")
    assert res.status == "COMPLETED"
    assert len(res.response_text) > 20
    assert res.confidence_score > 0.8

def test_claim_extraction_and_clustering():
    run1 = ModelRunResult(
        model_name="Gemini (gemini-2.5-flash)",
        status="COMPLETED",
        response_text="RAG provides dynamic knowledge to LLMs. Fine-tuning modifies internal weights.",
        latency_seconds=1.2,
        token_count=100,
        confidence_score=0.9
    )
    run2 = ModelRunResult(
        model_name="Groq (openai/gpt-oss-120b)",
        status="COMPLETED",
        response_text="RAG provides external dynamic knowledge to LLMs. Fine-tuning adjusts model weights.",
        latency_seconds=1.1,
        token_count=105,
        confidence_score=0.92
    )

    claims = consensus_engine.extract_claims([run1, run2])
    assert len(claims) >= 2

    clusters, embeddings = consensus_engine.cluster_claims(claims, similarity_threshold=0.75)
    assert len(clusters) >= 1
    assert any(cl.consensus_percentage >= 50 for cl in clusters)

def test_critic_and_synthesis():
    run = ModelRunResult(
        model_name="Gemini",
        status="COMPLETED",
        response_text="Quantum computing solves non-polynomial problems efficiently.",
        latency_seconds=1.0,
        token_count=50,
        confidence_score=0.9
    )
    claims = consensus_engine.extract_claims([run])
    clusters, embeddings = consensus_engine.cluster_claims(claims)
    conflicts = consensus_engine.detect_conflicts(claims, embeddings)
    findings = critic_agent.evaluate(clusters, conflicts)
    assert len(findings) >= 1

    synth = synthesis_agent.synthesize("Quantum query", [run], clusters, conflicts, findings)
    assert synth.confidence_score > 0.0
    assert "CLAIM VERIFICATION" in synth.final_answer

def test_extraordinary_alien_claim_is_low_likelihood():
    from app.consensus.claim_analyzer import claim_analyzer
    from app.agents.verdict_engine import verdict_engine
    from app.schemas.domain import EvidenceItem, EvidenceRelationship, SourceQuality, VerdictType

    analysis = claim_analyzer.analyze("Aliens visited earth on 2026")
    assert analysis.is_extraordinary_claim is True

    evidence = [
        EvidenceItem(
            evidence_id="ev1",
            text="There is no scientific evidence that extraterrestrials have visited Earth.",
            source_title="Unidentified flying object",
            source_url="https://en.wikipedia.org/wiki/Unidentified_flying_object",
            source_type="Encyclopedia",
            relationship=EvidenceRelationship.CONTRADICTS,
            quality=SourceQuality.HIGH,
            timestamp="2026-01-01",
            research_agent="Web Retrieval"
        ),
        EvidenceItem(
            evidence_id="ev2",
            text="SETI has found no confirmed evidence of alien visitation.",
            source_title="Search for extraterrestrial intelligence",
            source_url="https://en.wikipedia.org/wiki/Search_for_extraterrestrial_intelligence",
            source_type="Encyclopedia",
            relationship=EvidenceRelationship.CONTRADICTS,
            quality=SourceQuality.HIGH,
            timestamp="2026-01-01",
            research_agent="Web Retrieval"
        ),
    ]
    verdict, label, confidence, why = verdict_engine.evaluate(analysis, evidence, [], [], [])
    assert verdict in (VerdictType.CONTRADICTED, VerdictType.LIKELY_CONTRADICTED)
    assert confidence < 25
    assert why["is_extraordinary_claim"] is True

def test_homepage_urls_are_rejected():
    from app.evidence.web_search import is_usable_source_url
    assert is_usable_source_url("https://www.reuters.com") is False
    assert is_usable_source_url("https://www.nature.com/") is False
    assert is_usable_source_url("https://en.wikipedia.org/wiki/Unidentified_flying_object") is True
    assert is_usable_source_url("https://www.reuters.com/world/example-article") is True
