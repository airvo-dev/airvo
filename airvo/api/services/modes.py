import asyncio
import logging
import threading
import time

import litellm

from airvo.config.settings import settings
from airvo.cost.pricing import (
    estimate_cost_from_response,
    format_cost,
    get_savings_vs_gpt4o,
)
from airvo.api.services.limits import safe_max_tokens

logger = logging.getLogger(__name__)

_breaker_lock = threading.RLock()
_breaker_state: dict[str, dict] = {}


def _resilience_config(prefs: dict) -> dict:
    return {
        "enabled": bool(prefs.get("resilience_enabled", True)),
        "max_attempts": max(1, int(prefs.get("retry_max_attempts", 2))),
        "base_delay_ms": max(0, int(prefs.get("retry_base_delay_ms", 250))),
        "max_delay_ms": max(50, int(prefs.get("retry_max_delay_ms", 2000))),
        "breaker_threshold": max(1, int(prefs.get("breaker_failure_threshold", 3))),
        "breaker_cooldown_s": max(1, int(prefs.get("breaker_cooldown_seconds", 30))),
    }


def _is_retryable_exception(exc: Exception) -> bool:
    status = getattr(exc, "status_code", None) or getattr(exc, "http_status", None)
    if isinstance(status, int) and status in {408, 409, 425, 429, 500, 502, 503, 504}:
        return True

    msg = str(exc).lower()
    retryable_markers = (
        "timeout",
        "timed out",
        "rate limit",
        "too many requests",
        "temporar",
        "service unavailable",
        "bad gateway",
        "gateway timeout",
        "connection reset",
        "connection aborted",
    )
    return any(marker in msg for marker in retryable_markers)


def _breaker_is_open(model_id: str) -> tuple[bool, float]:
    now = time.time()
    with _breaker_lock:
        state = _breaker_state.get(model_id)
        if not state:
            return False, 0.0
        opened_until = float(state.get("opened_until", 0.0))
        if opened_until > now:
            return True, opened_until - now
        return False, 0.0


def _breaker_record_success(model_id: str) -> None:
    with _breaker_lock:
        _breaker_state[model_id] = {"failures": 0, "opened_until": 0.0}


def _breaker_record_failure(model_id: str, threshold: int, cooldown_s: int) -> None:
    now = time.time()
    with _breaker_lock:
        current = _breaker_state.get(model_id, {"failures": 0, "opened_until": 0.0})
        failures = int(current.get("failures", 0)) + 1
        opened_until = float(current.get("opened_until", 0.0))
        if failures >= threshold:
            opened_until = now + cooldown_s
            failures = 0
        _breaker_state[model_id] = {"failures": failures, "opened_until": opened_until}


def _reset_resilience_state() -> None:
    with _breaker_lock:
        _breaker_state.clear()


async def _acompletion_with_resilience(kwargs: dict, model_id: str, cfg: dict):
    max_attempts = cfg["max_attempts"] if cfg["enabled"] else 1
    base_delay_ms = cfg["base_delay_ms"]
    max_delay_ms = cfg["max_delay_ms"]

    last_exc: Exception | None = None
    for attempt in range(1, max_attempts + 1):
        try:
            return await litellm.acompletion(**kwargs), attempt
        except Exception as exc:
            last_exc = exc
            can_retry = cfg["enabled"] and _is_retryable_exception(exc) and attempt < max_attempts
            if not can_retry:
                break

            delay_ms = min(max_delay_ms, base_delay_ms * (2 ** (attempt - 1)))
            logger.warning(
                "[Resilience] retry model=%s attempt=%d/%d delay_ms=%d error=%s",
                model_id,
                attempt,
                max_attempts,
                delay_ms,
                str(exc),
            )
            await asyncio.sleep(delay_ms / 1000)

    assert last_exc is not None
    raise last_exc


async def call_model(model_config: dict, messages: list, request):
    model_id = model_config["id"]
    try:
        prefs = settings.get_prefs()
        resilience = _resilience_config(prefs)

        if resilience["enabled"]:
            is_open, retry_after_s = _breaker_is_open(model_id)
            if is_open:
                return {
                    "model": model_id,
                    "name": model_config.get("name", model_id),
                    "content": None,
                    "error": f"Circuit open for model '{model_id}'. Retry in ~{int(retry_after_s)}s",
                    "tokens": 0,
                    "elapsed_s": 0.0,
                    "cost_usd": 0.0,
                    "cost_fmt": "free",
                    "savings_usd": 0.0,
                }

        raw_max = request.max_tokens or prefs.get("max_tokens", settings.max_tokens)
        capped = safe_max_tokens(model_id, raw_max)
        kwargs = dict(
            model=model_id,
            messages=messages,
            max_tokens=capped,
            temperature=request.temperature or prefs.get("temperature", settings.temperature),
            stream=False,
            api_key=model_config.get("api_key"),
        )
        if model_config.get("base_url"):
            kwargs["api_base"] = model_config["base_url"]

        t0 = time.time()
        response, attempts_used = await _acompletion_with_resilience(kwargs, model_id, resilience)
        elapsed = round(time.time() - t0, 2)

        usage = response.usage
        tokens = usage.total_tokens if usage and usage.total_tokens else 0
        settings.record_usage(model_id, tokens, elapsed_s=elapsed)

        if resilience["enabled"]:
            _breaker_record_success(model_id)

        cost_usd = estimate_cost_from_response(model_id, response)
        return {
            "model": model_id,
            "name": model_config.get("name", model_id),
            "content": response.choices[0].message.content,
            "error": None,
            "tokens": tokens,
            "elapsed_s": elapsed,
            "cost_usd": cost_usd,
            "cost_fmt": format_cost(cost_usd),
            "savings_usd": get_savings_vs_gpt4o(model_id, tokens),
            "attempts": attempts_used,
        }
    except Exception as e:
        if settings.get_prefs().get("resilience_enabled", True):
            prefs = settings.get_prefs()
            _breaker_record_failure(
                model_id,
                threshold=max(1, int(prefs.get("breaker_failure_threshold", 3))),
                cooldown_s=max(1, int(prefs.get("breaker_cooldown_seconds", 30))),
            )
        return {
            "model": model_id,
            "name": model_config.get("name", model_id),
            "content": None,
            "error": str(e),
            "tokens": 0,
            "elapsed_s": None,
            "cost_usd": 0.0,
            "cost_fmt": "free",
            "savings_usd": 0.0,
        }


async def parallel_mode(models: list, messages: list, request) -> list:
    results = await asyncio.gather(*[call_model(m, messages, request) for m in models])
    return list(results)


async def race_mode(models: list, messages: list, request) -> list:
    tasks = [asyncio.create_task(call_model(m, messages, request)) for m in models]
    winner = None
    pending = set(tasks)

    while pending:
        done, pending = await asyncio.wait(pending, return_when=asyncio.FIRST_COMPLETED)
        for task in done:
            result = task.result()
            if not result["error"]:
                winner = result
                break
        if winner:
            for t in pending:
                t.cancel()
            break

    if not winner:
        winner = tasks[0].result() if tasks else {
            "model": "race", "name": "Race",
            "content": None, "error": "All models failed", "tokens": 0
        }

    winner["name"] = f"\ud83c\udfc6 {winner['name']} (Winner)"
    return [winner]


async def vote_mode(models: list, messages: list, request) -> list:
    results = await asyncio.gather(*[call_model(m, messages, request) for m in models])
    valid = [r for r in results if not r["error"]]

    if len(valid) <= 1:
        return list(results)

    responses_text = "\n\n".join([f"[{r['name']}]:\n{r['content']}" for r in valid])
    last_user = next((m["content"] for m in reversed(messages) if m["role"] == "user"), "")
    synthesis_messages = [
        {"role": "system",
         "content": "You are a synthesis assistant. Given multiple AI responses "
                    "to the same question, identify the consensus and return the "
                    "best unified answer. Be direct and concise."},
        {"role": "user",
         "content": f"Original question:\n{last_user}\n\n"
                    f"Responses received:\n{responses_text}\n\n"
                    f"Synthesise the consensus answer:"}
    ]
    consensus = await call_model(models[0], synthesis_messages, request)
    consensus["name"] = "\ud83d\udde3\ufe0f Consensus"
    return list(results) + [consensus]


async def review_mode(models: list, messages: list, request) -> list:
    if len(models) == 1:
        result = await call_model(models[0], messages, request)
        result["name"] = f"\u270d\ufe0f {result['name']}"
        return [result]

    results = []
    step_labels = ["\u270d\ufe0f", "\ud83d\udd0d", "\u2728"]

    current = await call_model(models[0], messages, request)
    current["name"] = f"{step_labels[0]} {current['name']}"
    results.append(current)

    if current["error"]:
        return results

    for i, model in enumerate(models[1:], start=1):
        label = step_labels[i] if i < len(step_labels) else "\ud83d\udd01"
        is_last = i == len(models) - 1

        refine_prompt = (
            "You are the final editor. Read the previous response and produce a "
            "polished, complete, production-ready final answer."
            if is_last and len(models) > 2
            else
            "Review the response above. Identify any errors, gaps or improvements, "
            "then provide an enhanced version."
        )

        refine_messages = list(messages) + [
            {"role": "assistant", "content": current["content"]},
            {"role": "user", "content": refine_prompt}
        ]

        current = await call_model(model, refine_messages, request)
        current["name"] = f"{label} {current['name']}"
        results.append(current)

        if current["error"]:
            break

    return results
