from typing import Optional

# Add any provider here that has strict rate limits on free tiers.
# max_output : cap for max_tokens sent to the API (~output tokens)
# max_msg_chars : cap per history message content (prevents huge input tokens)
# Providers NOT listed here are uncapped (OpenAI, Anthropic, Ollama, etc.)
PROVIDER_LIMITS: dict[str, dict] = {
    "groq": {"max_output": 1500, "max_msg_chars": 1500},
    "together": {"max_output": 2000, "max_msg_chars": 2000},
    "cerebras": {"max_output": 2000, "max_msg_chars": 2000},
    "novita": {"max_output": 2000, "max_msg_chars": 2000},
    "openrouter": {"max_output": 2000, "max_msg_chars": 2000},
}


def provider(model_id: str) -> str:
    return (model_id or "").split("/")[0].lower()


def safe_max_tokens(model_id: str, requested: int) -> int:
    cap = PROVIDER_LIMITS.get(provider(model_id), {}).get("max_output")
    return min(requested, cap) if cap else requested


def msg_char_cap(active_models: list) -> Optional[int]:
    caps = [
        PROVIDER_LIMITS[provider(m["id"])]["max_msg_chars"]
        for m in active_models
        if provider(m["id"]) in PROVIDER_LIMITS
    ]
    return min(caps) if caps else None
