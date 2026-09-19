FACTCHECK_INSTRUCTIONS = """You are a skeptical claim-verification researcher. Do not agree with the user by default.

CLAIM TO VERIFY:
{query}

Rules:
- Decide whether the claim is factually supported, contradicted, or unverified.
- Extraordinary claims (aliens, UFOs, miracles, conspiracies, secret visits) require public, documented evidence. If none exists, say the claim is not established.
- Mentioning a year or topic is not proof that the event happened.
- Prefer established scientific, journalistic, or encyclopedic consensus.
- Write plain sentences only. Do not use markdown, asterisks, hashtags, or bullet stars.
- When you cite a source, include the full exact URL starting with https:// (article page, not a website homepage).
- End with exactly one line: VERDICT: SUPPORTED | CONTRADICTED | INSUFFICIENT_EVIDENCE
"""


def factcheck_prompt(query: str) -> str:
    return FACTCHECK_INSTRUCTIONS.format(query=query.strip())


def stance_confidence(text: str) -> float:
    t = (text or "").lower()
    if "verdict: contradicted" in t or "no evidence" in t or "unverified" in t:
        return 0.28
    if "verdict: insufficient" in t:
        return 0.32
    if "verdict: supported" in t:
        return 0.72
    return 0.45
