"""
Context Window Optimizer — smart history truncation based on actual model limits.

Instead of a fixed "keep last N messages" rule, this module:
  1. Looks up the real context window size for the active model via LiteLLM
  2. Estimates token count of the current messages (4 chars ≈ 1 token)
  3. Trims oldest non-system messages until the conversation fits in 70% of the
     context window, leaving 30% headroom for the response

This replaces the hardcoded max_history_messages=10 for models where we know
the context window. The manual setting still acts as a hard upper bound.

100% local — no network calls.
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

# ── Known context windows (tokens) ───────────────────────────────────────
# LiteLLM also has this data in model_cost — we try that first, fall back here.
_CONTEXT_WINDOWS: dict[str, int] = {
    # Groq
    "groq/llama-3.1-8b-instant":       131_072,
    "groq/llama-3.3-70b-versatile":    128_000,
    "groq/llama3-8b-8192":               8_192,
    "groq/llama3-70b-8192":              8_192,
    "groq/mixtral-8x7b-32768":          32_768,
    "groq/gemma2-9b-it":                 8_192,
    # OpenAI
    "openai/gpt-4o":                   128_000,
    "openai/gpt-4o-mini":              128_000,
    "openai/gpt-4-turbo":              128_000,
    "openai/gpt-4":                      8_192,
    "openai/gpt-3.5-turbo":             16_385,
    "openai/o1":                       200_000,
    "openai/o1-mini":                  128_000,
    "openai/o3":                       200_000,
    "openai/o3-mini":                  200_000,
    # Anthropic
    "anthropic/claude-opus-4":         200_000,
    "anthropic/claude-sonnet-4-5":     200_000,
    "anthropic/claude-sonnet-4":       200_000,
    "anthropic/claude-haiku-3-5":      200_000,
    "anthropic/claude-3-5-sonnet-20241022": 200_000,
    "anthropic/claude-3-opus":         200_000,
    # Google
    "google/gemini-2.0-flash":       1_048_576,
    "google/gemini-2.5-pro":         1_048_576,
    "google/gemini-1.5-pro":         2_097_152,
    "google/gemini-1.5-flash":       1_048_576,
    # Mistral
    "mistral/mistral-large-latest":    131_072,
    "mistral/mistral-medium":           32_768,
    "mistral/mistral-small":            32_768,
    # Local (conservative default — user sets their own model)
    "ollama/":                           8_192,
    "lmstudio/":                         8_192,
}

_DEFAULT_CONTEXT = 8_192
_HEADROOM_RATIO  = 0.70   # use at most 70% of context window for history
_CHARS_PER_TOKEN = 4      # rough estimate: 1 token ≈ 4 chars


def get_context_window(model_id: str) -> int:
    """Return context window size in tokens for a given model."""
    # 1. Try LiteLLM's model_cost map first (most accurate)
    try:
        import litellm
        entry = litellm.model_cost.get(model_id.lower())
        if entry is None and "/" in model_id:
            entry = litellm.model_cost.get(model_id.split("/", 1)[1].lower())
        if entry and entry.get("max_input_tokens"):
            return int(entry["max_input_tokens"])
    except Exception:
        pass

    # 2. Exact match in local table
    key = model_id.lower()
    if key in _CONTEXT_WINDOWS:
        return _CONTEXT_WINDOWS[key]

    # 3. Prefix match (e.g. "ollama/llama3" → "ollama/")
    best_len = 0
    best_val = _DEFAULT_CONTEXT
    for prefix, window in _CONTEXT_WINDOWS.items():
        if prefix.endswith("/") and key.startswith(prefix) and len(prefix) > best_len:
            best_len = len(prefix)
            best_val = window
    return best_val


def estimate_tokens(messages: list) -> int:
    """Estimate token count for a list of messages (4 chars ≈ 1 token)."""
    total_chars = sum(len(m.get("content") or "") for m in messages)
    return total_chars // _CHARS_PER_TOKEN


def optimize(
    messages:        list,
    model_id:        str,
    max_history_cap: int = 50,   # hard upper bound from user prefs
) -> tuple[list, dict]:
    """
    Trim messages to fit within the model's context window.

    Returns:
        (trimmed_messages, info_dict)
        info_dict has: original_count, final_count, context_window,
                       estimated_tokens, was_trimmed
    """
    system_msgs = [m for m in messages if m.get("role") == "system"]
    other_msgs  = [m for m in messages if m.get("role") != "system"]

    context_window   = get_context_window(model_id)
    token_budget     = int(context_window * _HEADROOM_RATIO)
    system_tokens    = estimate_tokens(system_msgs)
    available_tokens = token_budget - system_tokens

    original_count = len(other_msgs)

    # Apply hard cap from user prefs first
    if len(other_msgs) > max_history_cap:
        other_msgs = other_msgs[-max_history_cap:]

    # Then trim by token budget — always keep the latest message (the current prompt)
    while len(other_msgs) > 1:
        estimated = estimate_tokens(other_msgs)
        if estimated <= available_tokens:
            break
        other_msgs = other_msgs[1:]   # drop oldest non-system message

    final_count      = len(other_msgs)
    estimated_tokens = estimate_tokens(system_msgs + other_msgs)
    was_trimmed      = final_count < original_count

    if was_trimmed:
        logger.info(
            "[CWO] model=%s context=%d budget=%d msgs %d→%d (~%d tokens)",
            model_id, context_window, token_budget,
            original_count, final_count, estimated_tokens
        )

    return system_msgs + other_msgs, {
        "original_count":  original_count,
        "final_count":     final_count,
        "context_window":  context_window,
        "token_budget":    token_budget,
        "estimated_tokens": estimated_tokens,
        "was_trimmed":     was_trimmed,
    }
