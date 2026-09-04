import asyncio

from airvo.api.routes import call_model


def test_call_model_accepts_model_id_string(monkeypatch):
    messages = [{"role": "user", "content": "hello, tell me your name briefly"}]

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

    monkeypatch.setattr("airvo.api.routes.litellm.acompletion", fake_acompletion)

    result = asyncio.run(call_model("groq/llama-3.1-8b-instant", messages, FakeRequest()))

    assert result["model"] == "groq/llama-3.1-8b-instant"
    assert result["content"] == "Hello from the test stub."
    assert result["error"] is None
