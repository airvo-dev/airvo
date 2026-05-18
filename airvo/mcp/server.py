"""
Airvo MCP Server
================
Exposes Airvo capabilities as MCP tools so any MCP-compatible client
(Claude Desktop, Cursor, VS Code, Windsurf, Zed…) can use them without
needing Continue.dev.

Tools exposed:
  • airvo_chat           — Send a prompt to one or all active models
  • airvo_compare        — Run the same prompt against all active models in parallel
  • airvo_list_models    — List configured models and their status
  • airvo_get_stats      — Monthly cost, token usage, savings vs GPT-4o
  • airvo_set_config     — Change temperature, mode, budget limit, etc.
  • airvo_run_benchmark  — Run a quick speed/quality benchmark
  • airvo_get_status     — Server health + active model count
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Any

# ── Fix Windows encoding ──────────────────────────────────────────────────
if sys.platform == "win32" and hasattr(sys.stdout, "buffer"):
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

try:
    from mcp.server.fastmcp import FastMCP
except ImportError as _e:
    raise ImportError(
        "MCP SDK not installed. Run: pip install airvo[mcp]"
    ) from _e

import httpx
from dotenv import load_dotenv

# ── Load .env ─────────────────────────────────────────────────────────────
_dotenv = Path.cwd() / ".env"
if not _dotenv.exists():
    _dotenv = Path(__file__).parent.parent.parent / ".env"
load_dotenv(_dotenv)

# ── Airvo server base URL (configurable via env) ──────────────────────────
_AIRVO_PORT = int(os.getenv("PORT", 8765))
_AIRVO_BASE = f"http://127.0.0.1:{_AIRVO_PORT}"

# ── MCP server instance ───────────────────────────────────────────────────
mcp = FastMCP(
    name="airvo",
    instructions=(
        "Airvo is your local AI copilot. Use these tools to chat with multiple AI models, "
        "compare their responses, check usage stats, manage model configuration, and run "
        "benchmarks — all without leaving your current client."
    ),
)

# ── Helper ────────────────────────────────────────────────────────────────

async def _get(path: str, **params) -> Any:
    async with httpx.AsyncClient(timeout=60.0) as client:
        r = await client.get(f"{_AIRVO_BASE}{path}", params=params)
        r.raise_for_status()
        return r.json()

async def _post(path: str, body: dict) -> Any:
    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(f"{_AIRVO_BASE}{path}", json=body)
        r.raise_for_status()
        return r.json()


# ═══════════════════════════════════════════════════════════════════════════
# TOOLS
# ═══════════════════════════════════════════════════════════════════════════

@mcp.tool()
async def airvo_chat(
    prompt: str,
    model_id: str = "",
    temperature: float = 0.7,
    system: str = "",
) -> str:
    """
    Send a prompt to Airvo and get a response from the active model(s).

    Args:
        prompt:      The user message / question.
        model_id:    Optional specific model ID (e.g. 'groq/llama-3.3-70b-versatile').
                     Leave empty to use Airvo's auto-routing.
        temperature: Sampling temperature 0.0–1.0 (default 0.7).
        system:      Optional system prompt to prepend.
    """
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    body: dict = {
        "model": model_id or "airvo-auto",
        "messages": messages,
        "temperature": temperature,
        "stream": False,
    }

    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            r = await client.post(f"{_AIRVO_BASE}/v1/chat/completions", json=body)
            r.raise_for_status()
            data = r.json()
        content = data["choices"][0]["message"]["content"]
        model_used = data.get("model", "unknown")
        return f"**Model:** `{model_used}`\n\n{content}"
    except httpx.HTTPStatusError as e:
        return f"Error {e.response.status_code}: {e.response.text}"
    except Exception as e:
        return f"Error connecting to Airvo server at {_AIRVO_BASE}: {e}\nMake sure Airvo is running with `airvo start`."


@mcp.tool()
async def airvo_compare(
    prompt: str,
    temperature: float = 0.7,
) -> str:
    """
    Run the same prompt against ALL active Airvo models simultaneously and return
    a side-by-side comparison of their responses.

    Args:
        prompt:      The prompt to send to all models.
        temperature: Sampling temperature 0.0–1.0 (default 0.7).
    """
    try:
        body = {"prompt": prompt, "temperature": temperature}
        data = await _post("/api/compare/run", body)
        results = data.get("results", [])
        if not results:
            return "No results — make sure you have 2+ active models in Airvo."

        lines = [f"## Airvo Compare — `{prompt[:80]}{'…' if len(prompt)>80 else ''}`\n"]
        for r in results:
            model = r.get("model", "unknown")
            text = r.get("text", r.get("error", "no response"))
            elapsed = r.get("elapsed", 0)
            tokens = r.get("tokens", "?")
            lines.append(f"### {model}")
            lines.append(f"*{elapsed:.1f}s · {tokens} tokens*\n")
            lines.append(text)
            lines.append("\n---\n")
        return "\n".join(lines)
    except Exception as e:
        return f"Compare error: {e}"


@mcp.tool()
async def airvo_list_models() -> str:
    """
    List all models configured in Airvo with their status, provider,
    and whether they have an API key configured.
    """
    try:
        data = await _get("/api/models")
        models = data if isinstance(data, list) else data.get("models", [])
        if not models:
            return "No models configured. Open the Airvo dashboard to add models."

        lines = ["## Airvo Models\n", "| Model | Provider | Status | Free | API Key |",
                 "|-------|----------|--------|------|---------|"]
        for m in models:
            status = "✅ active" if m.get("active") else "⏸ inactive"
            free = "✦ free" if m.get("free") else "💰 paid"
            has_key = "✓" if m.get("api_key") else "—"
            lines.append(
                f"| {m.get('name','?')} | {m.get('provider','?')} | {status} | {free} | {has_key} |"
            )
        active_count = sum(1 for m in models if m.get("active"))
        lines.append(f"\n**{active_count} active** / {len(models)} total")
        return "\n".join(lines)
    except Exception as e:
        return f"Error fetching models: {e}"


@mcp.tool()
async def airvo_get_stats() -> str:
    """
    Get Airvo usage statistics: token count per model, estimated API cost
    this month, savings vs GPT-4o, and cache hit rate.
    """
    try:
        data = await _get("/api/stats")
        monthly   = data.get("monthly_cost", 0.0)
        total_tok = data.get("total_tokens", 0)
        savings   = data.get("savings_vs_gpt4o", 0.0)
        cache_hits  = data.get("cache_hits", 0)
        cache_total = data.get("cache_total", 0)
        by_model  = data.get("by_model", {})

        lines = [
            "## Airvo Usage Stats\n",
            f"- **Total tokens:** {total_tok:,}",
            f"- **Estimated cost this month:** ${monthly:.4f}",
            f"- **Savings vs GPT-4o:** ${savings:.4f}",
        ]
        if cache_total:
            hit_rate = cache_hits / cache_total * 100
            lines.append(f"- **Cache hit rate:** {hit_rate:.0f}% ({cache_hits}/{cache_total})")

        if by_model:
            lines.append("\n### Tokens by Model\n")
            lines.append("| Model | Tokens | Cost |")
            lines.append("|-------|--------|------|")
            for model_id, info in sorted(by_model.items(), key=lambda x: -x[1].get("tokens", 0)):
                tok = info.get("tokens", 0)
                cost = info.get("cost", 0.0)
                cost_str = f"${cost:.4f}" if cost > 0 else "✦ free"
                lines.append(f"| {model_id} | {tok:,} | {cost_str} |")
        return "\n".join(lines)
    except Exception as e:
        return f"Error fetching stats: {e}"


@mcp.tool()
async def airvo_set_config(
    temperature: float = -1.0,
    mode: str = "",
    budget_limit: float = -1.0,
    privacy_mode: bool | None = None,
    cache_enabled: bool | None = None,
    max_tokens: int = -1,
) -> str:
    """
    Update Airvo configuration settings.

    Args:
        temperature:   Global temperature 0.0–1.0. Pass -1 to leave unchanged.
        mode:          Multi-model mode: 'parallel', 'race', 'vote', or 'review'.
                       Pass empty string to leave unchanged.
        budget_limit:  Monthly USD spending limit (0 = unlimited). Pass -1 to leave unchanged.
        privacy_mode:  Enable/disable privacy mode (blocks cloud models when secrets detected).
        cache_enabled: Enable/disable prompt cache.
        max_tokens:    Maximum tokens per response. Pass -1 to leave unchanged.
    """
    try:
        current = await _get("/api/prefs")
        updated = dict(current)

        changes = []
        if temperature >= 0:
            updated["temperature"] = temperature
            changes.append(f"temperature → {temperature}")
        if mode in ("parallel", "race", "vote", "review"):
            updated["mode"] = mode
            changes.append(f"mode → {mode}")
        if budget_limit >= 0:
            updated["budget_limit"] = budget_limit
            changes.append(f"budget_limit → ${budget_limit:.2f}")
        if privacy_mode is not None:
            updated["privacy_mode"] = privacy_mode
            changes.append(f"privacy_mode → {privacy_mode}")
        if cache_enabled is not None:
            updated["cache_enabled"] = cache_enabled
            changes.append(f"cache_enabled → {cache_enabled}")
        if max_tokens > 0:
            updated["max_tokens"] = max_tokens
            changes.append(f"max_tokens → {max_tokens}")

        if not changes:
            return "No changes specified. Provide at least one parameter to update."

        await _post("/api/prefs", updated)
        return "✅ Config updated:\n" + "\n".join(f"  • {c}" for c in changes)
    except Exception as e:
        return f"Error updating config: {e}"


@mcp.tool()
async def airvo_run_benchmark(
    suite: str = "speed",
    models: str = "",
) -> str:
    """
    Run a benchmark suite against active Airvo models and return the leaderboard.

    Args:
        suite:  Benchmark suite to run: 'speed', 'coding', 'reasoning', or 'creative'.
                Default is 'speed'.
        models: Comma-separated list of model IDs to benchmark. Leave empty to use all active models.
    """
    try:
        body: dict = {"suite": suite}
        if models:
            body["models"] = [m.strip() for m in models.split(",")]

        data = await _post("/api/bench/run", body)
        results = data.get("results", [])
        if not results:
            return "No benchmark results. Make sure you have active models in Airvo."

        lines = [f"## Airvo Benchmark — Suite: `{suite}`\n",
                 "| Rank | Model | Score | Speed (tok/s) | Accuracy |",
                 "|------|-------|-------|---------------|----------|"]
        for i, r in enumerate(sorted(results, key=lambda x: -x.get("score", 0)), 1):
            medal = ["🥇", "🥈", "🥉"][i-1] if i <= 3 else f"#{i}"
            model = r.get("model", "?")
            score = r.get("score", 0)
            speed = r.get("tok_s", 0)
            acc   = r.get("accuracy", None)
            acc_str = f"{acc:.0%}" if acc is not None else "—"
            lines.append(f"| {medal} | {model} | {score:.1f} | {speed:.1f} | {acc_str} |")
        return "\n".join(lines)
    except Exception as e:
        return f"Benchmark error: {e}"


@mcp.tool()
async def airvo_get_status() -> str:
    """
    Check if the Airvo server is running and get a summary of its current state:
    version, active models, mode, and server uptime.
    """
    try:
        data = await _get("/api/status")
        version  = data.get("version", "?")
        active   = data.get("active_models", [])
        mode     = data.get("mode", "?")
        endpoint = data.get("endpoint", f"{_AIRVO_BASE}/v1")

        lines = [
            "## Airvo Status — ✅ Online\n",
            f"- **Version:** {version}",
            f"- **Mode:** {mode}",
            f"- **Endpoint:** `{endpoint}`",
            f"- **Active models ({len(active)}):**",
        ]
        for m in active:
            lines.append(f"  - `{m}`")
        if not active:
            lines.append("  *(none — add models in the dashboard)*")
        return "\n".join(lines)
    except httpx.ConnectError:
        return (
            f"## Airvo Status — ❌ Offline\n\n"
            f"Cannot connect to Airvo at `{_AIRVO_BASE}`.\n\n"
            f"Start it with:\n```\nairvo start\n```"
        )
    except Exception as e:
        return f"Status check error: {e}"


# ── Entry point ───────────────────────────────────────────────────────────

def run():
    """Run the Airvo MCP server (stdio transport for MCP clients)."""
    mcp.run(transport="stdio")


if __name__ == "__main__":
    run()
