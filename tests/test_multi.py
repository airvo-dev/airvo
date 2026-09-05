import asyncio

from airvo.api.services.modes import _reset_resilience_state, call_model


def test_call_model_accepts_model_id_string(monkeypatch):
    messages = [{"role": "user", "content": "hello, tell me your name briefly"}]
    model_config = {"id": "groq/llama-3.1-8b-instant", "name": "Groq Test"}

    class FakeRequest:
        max_tokens = 100
        temperature = 0.7

    class FakeResponse:
        class Usage:
            total_tokens = 42

        usage = Usage()

        class Choice:
            class Message:
                content = "Hello from the test stub."

            message = Message()

        choices = [Choice()]

    async def fake_acompletion(**kwargs):
        assert kwargs["model"] == "groq/llama-3.1-8b-instant"
        return FakeResponse()

    monkeypatch.setattr("airvo.api.services.modes.litellm.acompletion", fake_acompletion)

    result = asyncio.run(call_model(model_config, messages, FakeRequest()))

    assert result["model"] == "groq/llama-3.1-8b-instant"
    assert result["content"] == "Hello from the test stub."
    assert result["error"] is None


def test_call_model_retries_and_succeeds(monkeypatch):
    _reset_resilience_state()
    messages = [{"role": "user", "content": "retry test"}]
    model_config = {"id": "groq/llama-3.1-8b-instant", "name": "Groq Test"}
    calls = {"n": 0}

    class FakeRequest:
        max_tokens = 100
        temperature = 0.7

    class FakeResponse:
        class Usage:
            total_tokens = 10

        usage = Usage()

        class Choice:
            class Message:
                content = "Recovered after retry."

            message = Message()

        choices = [Choice()]

    async def fake_acompletion(**kwargs):
        calls["n"] += 1
        if calls["n"] == 1:
            raise RuntimeError("timeout")
        return FakeResponse()

    monkeypatch.setattr("airvo.api.services.modes.litellm.acompletion", fake_acompletion)

    result = asyncio.run(call_model(model_config, messages, FakeRequest()))

    assert result["error"] is None
    assert result["content"] == "Recovered after retry."
    assert result.get("attempts") == 2
    assert calls["n"] == 2


def test_call_model_circuit_breaker_opens_after_failures(monkeypatch):
    _reset_resilience_state()
    messages = [{"role": "user", "content": "breaker test"}]
    model_config = {"id": "groq/llama-3.1-8b-instant", "name": "Groq Test"}

    class FakeRequest:
        max_tokens = 100
        temperature = 0.7

    async def always_fail(**kwargs):
        raise RuntimeError("service unavailable")

    class _SettingsStub:
        max_tokens = 1024
        temperature = 0.7

        @staticmethod
        def get_prefs():
            return {
                "resilience_enabled": True,
                "retry_max_attempts": 1,
                "breaker_failure_threshold": 2,
                "breaker_cooldown_seconds": 60,
                "retry_base_delay_ms": 1,
                "retry_max_delay_ms": 5,
            }

        @staticmethod
        def record_usage(model_id, tokens, elapsed_s=None):
            return None

    monkeypatch.setattr("airvo.api.services.modes.litellm.acompletion", always_fail)
    monkeypatch.setattr("airvo.api.services.modes.settings", _SettingsStub())

    first = asyncio.run(call_model(model_config, messages, FakeRequest()))
    second = asyncio.run(call_model(model_config, messages, FakeRequest()))
    third = asyncio.run(call_model(model_config, messages, FakeRequest()))

    assert "service unavailable" in (first["error"] or "")
    assert "service unavailable" in (second["error"] or "")
    assert "Circuit open for model" in (third["error"] or "")
