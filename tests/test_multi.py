import asyncio
import litellm
from airvo.config.settings import settings
from airvo.api.routes import call_model


async def test():
    messages = [{"role": "user", "content": "hello, tell me your name briefly"}]

    class FakeRequest:
        max_tokens = 100
        temperature = 0.7

    print("Testing 2 models in parallel...")
    print("=" * 40)

    results = await asyncio.gather(
        call_model("groq/llama-3.1-8b-instant", messages, FakeRequest()),
        call_model("groq/llama-3.3-70b-versatile", messages, FakeRequest())
    )

    for r in results:
        model_name = r["model"].split("/")[-1]
        print(f"Model: {model_name}")
        if r["content"]:
            print(f"Response: {r['content'][:150]}")
        else:
            print(f"Error: {r['error']}")
        print("-" * 40)


asyncio.run(test())
