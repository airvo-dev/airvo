<picture>
  <source media="(prefers-color-scheme: dark)"  srcset="https://raw.githubusercontent.com/airvo-dev/airvo/main/airvo/docs/assets/airvo-logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/airvo-dev/airvo/main/airvo/docs/assets/airvo-logo-light.svg">
  <img src="https://raw.githubusercontent.com/airvo-dev/airvo/main/airvo/docs/assets/airvo-logo-light.svg" alt="Airvo" height="80"/>
</picture>

<br/>

[![PyPI version](https://img.shields.io/badge/pypi-v0.5.6-7c6dfa?style=flat-square&logo=pypi&logoColor=white)](https://pypi.org/project/airvo)
[![Python](https://img.shields.io/badge/python-3.11+-7c6dfa?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![License](https://img.shields.io/badge/license-MIT-fa6d8f?style=flat-square)](LICENSE)
[![LiteLLM](https://img.shields.io/badge/powered%20by-LiteLLM-4ade80?style=flat-square)](https://litellm.ai)
[![Continue.dev](https://img.shields.io/badge/works%20with-continue.dev-4ade80?style=flat-square)](https://continue.dev)

**Your local AI coding assistant — any model, any provider. Your AI. Your Rules.**

Airvo runs on your machine, connects to any AI model simultaneously, and integrates directly into VS Code via continue.dev. No cloud lock-in. No subscriptions. Your API keys stay local.

---

## Table of Contents

- [What is Airvo?](#what-is-airvo)
- [Quick Start](#quick-start)
- [Features](#features)
- [Supported Models](#supported-models)
- [Dashboard](#dashboard)
- [Multi-Model Modes](#multi-model-modes)
- [VS Code Integration](#vs-code-integration)
- [Configuration](#configuration)
- [Use Cases](#use-cases)
- [Security](#security)
- [FAQ](#faq)
- [Community](#community)
- [License](#license)

---

## What is Airvo?

Airvo is a local server that sits between your editor and any AI model. Install it once, configure your API keys in the dashboard, and start coding with AI — without changing your workflow.

```
Your Editor (VS Code)
       │
       │  OpenAI-compatible API
       ▼
  Airvo Server  ←─── runs on localhost:5000
       │
       ├── Groq (Llama 3.1, Llama 3.3)
       ├── OpenAI (GPT-4o, GPT-4o mini)
       ├── Anthropic (Claude Sonnet, Haiku)
       ├── Ollama (100% local, no API key)
       ├── LM Studio (100% local)
       └── Any LiteLLM-compatible provider
```

**Why Airvo?**

- ✅ Any model, any provider — no lock-in
- ✅ Up to 3 models simultaneously — parallel, race, vote or review
- ✅ 4 multi-model modes — Parallel, Race, Vote, Review
- ✅ **Compare tab** — compare any prompt across all models in real-time with word-level diff
- ✅ **Benchmarks tab** — standardized suites, radar chart, score history, custom suites
- ✅ Smart Memory (RAG) — semantic search of your codebase, 100% local
- ✅ Memory Manager — real-time RAM/GPU usage, Ollama model rotation
- ✅ Model Discovery — browse and add Ollama + OpenRouter models in one click
- ✅ API key test — verify any key with one click directly from the dashboard
- ✅ Your API keys stored locally — never shared
- ✅ 100% local option — zero internet, zero cost
- ✅ Works with free tiers — Groq, Ollama, LM Studio
- ✅ No subscription required
- ✅ Works natively inside VS Code

---

## Quick Start

**1. Install Airvo**

```bash
pip install airvo
```

**2. Start the server**

```bash
airvo start
```

That's it. Airvo will:
- Create your config at `~/.airvo/models.json`
- Auto-configure continue.dev at `~/.continue/config.yaml`
- Open the dashboard at `http://localhost:5000`

**3. Add your first model**

Open the dashboard → Add Model → fill in the model details → Save.

Not sure where to start? Add Groq — it's free and fast:
- **Model ID:** `groq/llama-3.3-70b-versatile`
- **Provider:** `groq`
- **API Key:** get one free at [console.groq.com](https://console.groq.com) — no credit card required

**4. Install continue.dev in VS Code**

Install the [Continue extension](https://marketplace.visualstudio.com/items?itemName=Continue.continue) from the VS Code marketplace. Airvo already configured it for you.

**5. Start coding**

Open VS Code → press `Ctrl+L` → ask anything.

---

## Features

**🤖 Any Model, Any Provider**
Add any model supported by LiteLLM — over 100 providers. Groq, OpenAI, Anthropic, Ollama, LM Studio, DeepSeek, Mistral, Gemini, and more.

**⚡ Multi-Model Modes**
Run up to 3 models simultaneously in 4 modes: **Parallel** (see all answers), **Race** (fastest wins), **Vote** (consensus), **Review** (one generates, others refine).

**🔒 100% Local Option**
Use Ollama or LM Studio with no API key, no internet, no cost. Your code never leaves your machine.

**🎛️ Visual Dashboard**
Manage models, configure API keys, toggle models on/off — all from a clean dark UI at `localhost:5000`.

**🧠 Project Context**
Write your stack, preferences and constraints once. Airvo injects it into every request so the model always knows your project — without you repeating yourself.

**🔍 Smart Memory (RAG)**
Airvo indexes your codebase locally using AI embeddings (`all-MiniLM-L6-v2`). Before each request, it automatically finds the most relevant files and injects them into the context — no copy-pasting. Runs 100% on your machine, nothing sent to the cloud. Enable it in Configuration → Smart Memory.

**🖥️ Memory Manager**
Real-time RAM and GPU usage visible right in the Status page. See which Ollama models are currently loaded, get intelligent suggestions when memory is under pressure, and unload models with a single click — no terminal needed.

**🔭 Model Discovery**
Browse a curated catalog of Ollama-compatible models filtered by what fits in your RAM. Explore OpenRouter's full model library (free models highlighted). Add any model to Airvo with one click.

**🌡️ Tunable Behavior**
Adjust temperature (0.0 → 1.0) and max tokens per request directly from the dashboard. Precise and deterministic for code, creative for brainstorming.

**🆚 Compare Tab**
Send any prompt to all active models at once and see responses stream in real-time side by side. Word-level diff highlights exactly where answers differ. Sort by response time or token count, filter by model, annotate runs, and export comparisons as Markdown.

**🏆 Benchmarks Tab**
Run standardized suites (Speed, Coding, Reasoning, Creativity) or your own custom named suites against all active models. Automatic accuracy scoring for code and logic tasks. Results shown in a leaderboard, radar chart (4 axes: Speed, Tok/s, Accuracy, Consistency), and score history over time. Annotate runs to track what changed between sessions.

**🔌 API Key Test**
Verify any model's API key with one click from the Models page. Airvo sends a minimal 5-token request and shows latency in ms or the exact error — without leaving the dashboard.

**✎ Model Notes**
Add personal notes to any model card — context limit, pricing tier, performance observations, best use cases. Saved locally to `~/.airvo/models.json`.

**📊 Usage Stats**
See requests and tokens used per model — all stored locally. Know exactly what you're using and reset anytime.

**🌍 7 Languages**
Dashboard available in English, Español, Français, Deutsch, 中文, 日本語, Português.

**🔌 VS Code Native**
Works through continue.dev — chat, edit, and apply code changes without leaving your editor.

---

## Supported Models

| Provider | Model ID | Free | Notes |
|----------|----------|------|-------|
| Groq | `groq/llama-3.1-8b-instant` | ✅ | Fast, free tier |
| Groq | `groq/llama-3.3-70b-versatile` | ✅ | Powerful, free tier |
| OpenAI | `openai/gpt-4o` | ❌ | Requires API key |
| OpenAI | `openai/gpt-4o-mini` | ❌ | Cheaper option |
| Anthropic | `anthropic/claude-sonnet-4-5` | ❌ | Requires API key |
| Anthropic | `anthropic/claude-haiku-4-5` | ❌ | Fastest Claude |
| Ollama | `ollama/llama3` | ✅ | 100% local |
| Ollama | `ollama/codellama` | ✅ | Code-optimized |
| LM Studio | `lmstudio/local` | ✅ | 100% local |
| DeepSeek | `deepseek/deepseek-chat` | ❌ | Very affordable |
| Mistral | `mistral/mistral-large-latest` | ❌ | Requires API key |
| Gemini | `gemini/gemini-1.5-pro` | ❌ | Requires API key |

Any model supported by [LiteLLM](https://docs.litellm.ai/docs/providers) works with Airvo.

---

## Dashboard

The Airvo dashboard runs at `http://localhost:5000` and lets you manage everything visually.

**Models page** — activate/deactivate models, save API keys, test keys with one click, add personal notes, see requests and tokens per model.

![Airvo Dashboard - Models](https://raw.githubusercontent.com/airvo-dev/airvo/main/airvo/docs/assets/screenshot-models.png)

**Compare tab** — send a prompt to all active models simultaneously, stream responses in real-time, inspect word-level diffs, sort by speed or token count, export as Markdown.

**Benchmarks tab** — run Speed, Coding, Reasoning, Creativity, or custom suites against all models. Leaderboard + radar chart + score history over time. Annotate each run.

**Stats page** — per-model usage, daily sparklines, total token breakdown.

**Configuration page** — set multi-model mode, adjust temperature and max tokens, enable project context, configure Smart Memory (RAG).

**Add Model page** — add any model with contextual tooltips on every field.

![Airvo Dashboard - Add Model](https://raw.githubusercontent.com/airvo-dev/airvo/main/airvo/docs/assets/screenshot-add-model.png)

**Help page** — full reference guide, field-by-field documentation, FAQ (7 languages).

![Airvo Dashboard - Help](https://raw.githubusercontent.com/airvo-dev/airvo/main/airvo/docs/assets/screenshot-help.png)

---

## Multi-Model Modes

Airvo supports running multiple models at once. Configure the mode in the Configuration page.

**Parallel** *(default)* — All active models respond to every message. See all answers side by side. Best for comparing outputs.

**Race** — All models receive the message simultaneously. The first to finish wins. Best for speed.

**Vote** — Models generate responses and the consensus answer is shown. Best for accuracy.

**Review** — One model generates a response, another critiques it. Best for quality.

---

## VS Code Integration

Airvo works through [continue.dev](https://continue.dev) — a VS Code extension for AI-assisted coding.

![Continue.dev with Airvo](https://raw.githubusercontent.com/airvo-dev/airvo/main/airvo/docs/assets/screenshot-vscode.png)

**What you can do:**

```
Chat     →  ask questions, get explanations, generate code
Edit     →  select code and ask Airvo to modify it
Apply    →  apply suggested changes directly in your file
```

**The continue.dev config** is created automatically by `airvo start`:

```yaml
models:
  - name: Airvo
    provider: openai
    model: airvo-auto
    apiBase: http://localhost:5000/v1
    apiKey: local
    roles:
      - chat
      - edit
      - apply
```

---

## Configuration

**CLI options**

```bash
airvo start                    # default: localhost:5000, opens browser
airvo start --port 9000        # custom port
airvo start --host 0.0.0.0     # accessible from local network
airvo start --no-browser       # don't open browser automatically
airvo start --reload           # hot reload (development)

airvo config --show            # show current config
airvo version                  # show version
```

**Models config** — stored at `~/.airvo/models.json`

```json
[
  {
    "id":       "groq/llama-3.3-70b-versatile",
    "name":     "Llama 3.3 70B (Groq)",
    "provider": "groq",
    "api_key":  "your-api-key",
    "base_url": null,
    "active":   true,
    "notes":    "More powerful, still free"
  }
]
```

**Adding a local model (Ollama)**

```bash
# 1. Install Ollama from ollama.com
# 2. Pull a model
ollama pull llama3

# 3. Add it in the Airvo dashboard
# Model ID:  ollama/llama3
# Provider:  ollama
# Base URL:  http://localhost:11434
# API Key:   (leave empty)
```

---

## Use Cases

**Generate a function**
```
"create a Python function that validates an email address with regex"
→ Airvo generates the function with tests
→ click Apply to add it directly to your file
```

**Explain legacy code**
```
"explain what this function does and why it might be slow"
→ if you have two models active, both analyze in parallel
→ you see both perspectives and choose the best explanation
```

**Refactor on the fly**
```
select code → "refactor this to use async/await"
→ Airvo rewrites it
→ Apply the change with one click
```

**100% offline workflow**
```
add ollama/llama3 → no API key, no internet, no cost
→ full AI coding experience with zero data leaving your machine
```

**Smart Memory — ask about your own code**
```
enable Smart Memory → index your project folder
→ "how does the authentication flow work in this project?"
→ Airvo finds the relevant files automatically and answers with context
→ no copy-pasting, no manual file selection
```

---

## Security

Airvo is designed with privacy and security in mind:

- **API keys stay local** — stored in `~/.airvo/models.json` on your machine, never sent to Airvo servers
- **Localhost only** — the server listens on `localhost:5000` by default, not accessible from the internet
- **Restricted CORS** — only the dashboard and VS Code extensions can make requests to the server
- **No telemetry** — Airvo collects no usage data, no analytics, no crash reports
- **Open source** — the full source code is on GitHub, you can audit everything

---

## FAQ

**What is Smart Memory (RAG)?**
Smart Memory indexes your codebase locally using AI embeddings. Before each request, Airvo finds the most semantically relevant code chunks and injects them into the prompt automatically. Enable it in Configuration → Smart Memory, point it to your project folder, and click Index Now. The embedding model (~90 MB) downloads once and runs entirely on your machine.

**Does Smart Memory send my code to the cloud?**
Never. The embedding model (`all-MiniLM-L6-v2`) runs 100% on your machine. The index is stored in `~/.airvo/rag/` and your code never leaves your computer.

**How do I add a model?**
Open the dashboard → Add Model → fill in the Model ID, Provider, and API Key → Save. Any model supported by [LiteLLM](https://docs.litellm.ai/docs/providers) works. Check the Supported Models table for examples.

**How do I run multiple models?**
Add models in the dashboard and activate them. Airvo supports up to **3 active models** simultaneously. Choose your mode in Configuration: Parallel, Race, Vote, or Review.

**What is the Model ID format?**
It follows LiteLLM's format: `provider/model-name`. For example: `groq/llama-3.3-70b-versatile`, `openai/gpt-4o`, `ollama/llama3`. Check the [LiteLLM docs](https://docs.litellm.ai/docs/providers) for the full list.

**Do I need to pay for anything?**
Airvo itself is free. You only pay for the AI models you use. Groq, Ollama, and LM Studio all have free options.

**Does my code get sent to the cloud?**
Only when you use cloud models (OpenAI, Anthropic, etc.) — and only the specific code you include in your message. When using local models (Ollama, LM Studio), nothing leaves your machine.

**Where are my API keys stored?**
Locally in `~/.airvo/models.json` on your machine. They are never sent anywhere except to the model provider when making requests.

**Can I use any model?**
Yes — any model supported by [LiteLLM](https://docs.litellm.ai/docs/providers) works with Airvo. Over 100 providers.

**How do I get a free Groq API key?**
Go to [console.groq.com](https://console.groq.com), sign up, and create an API key. No credit card required.

**How do I add a local model like Ollama?**
Install [Ollama](https://ollama.com), pull a model with `ollama pull llama3`, then add it in the dashboard with Model ID `ollama/llama3`, Provider `ollama`, Base URL `http://localhost:11434`, and leave the API Key empty.

**Can I run Airvo on a local network?**
Yes — run `airvo start --host 0.0.0.0` and it will be accessible from any device on your network.

**Airvo is not connecting to VS Code — what do I do?**
Make sure continue.dev is installed in VS Code and that `airvo start` has run at least once to create the config. You can verify the config exists at `~/.continue/config.yaml`.

---

## Changelog

**v0.5.6** — API key test, model notes, help docs update
- **API key test** — click 🔌 Test on any model card with a configured key; Airvo makes a minimal call and shows ✓ latency ms or ✗ error message.
- **Model notes** — click ✎ Edit notes on any card to save freeform reminders (context limit, pricing, use case). Persisted to `~/.airvo/models.json`.
- **Help section** — full documentation for Models tab features and Benchmarks tab (7 languages), FAQ extended to 10 entries.
- Version metadata fix: `importlib.metadata` now correctly reports `0.5.6` after `pip install -e .`.

**v0.5.5** — Benchmarks: score history, radar chart, run annotation
- **Score History** — line chart tracking each model's composite score across runs (requires 3+ runs on the same suite). Hover dots for model, date, score, and annotation.
- **Radar chart** — 4-axis chart (Speed, Tok/s, Accuracy, Consistency) shown after any run with 2+ models.
- **Run annotation** — add a note before each run (e.g. "after Ollama update"); note saved with run and shown in history tooltips.
- **Export** — export last run as `.md`, `.csv`, or copy raw JSON. History stores last 20 runs.

**v0.5.4** — Benchmarks: custom suites, leaderboard accuracy
- **Named custom suites** — create multiple named suites with your own prompts; switch via dropdown; each suite stores prompts independently in the browser.
- **Leaderboard scoring** — composite score weighted by Speed (tok/s), Output length, Accuracy (✓/✗ validators — highest weight), Consistency (low variance). Max 100 pts.
- **Per-prompt table** — individual results with ✓/✗ accuracy badges per model per prompt.
- **Built-in suite improvements** — Coding (FizzBuzz, palindrome, Fibonacci) and Reasoning (syllogism, math, sequence) now have automatic answer validators.

**v0.5.0** — Benchmarks tab (initial)
- New **Benchmarks** tab: run Speed, Coding, Reasoning, and Creativity suites against all active models.
- Ranked leaderboard with composite scoring. Results persist across sessions.

**v0.4.2** — Compare tab: ask-from-tab, sort controls, tok/s badge
- **Ask from Compare tab** — prompt box directly in the Compare tab, no need to go through Chat.
- **Sort controls** — sort responses by arrival time or token count.
- **Tok/s badge** — tokens-per-second displayed on each response card.
- **Word-level diff** — highlighted diff between any two model responses.

**v0.4.1** — Compare tab: SSE streaming + diff + persistence
- **Real-time SSE streaming** — model responses stream as they are generated.
- **Word-level diff** — compare any two responses with highlighted differences.
- **JSON persistence** — compare history saved to `~/.airvo/compare_history.json` (not site-packages).

**v0.4.0** — Compare tab (initial)
- New **Compare** tab: send a prompt to all active models simultaneously and see responses side by side.

**v0.3.7** — README changelog fix
- Updated changelog on PyPI to include all releases from v0.3.3 onwards. No functional changes.

**v0.3.6** \u2014 API docs, architecture rewrite
- **OpenAPI docs** — all 22 REST endpoints now have tags, summaries, and descriptions. Visit `http://127.0.0.1:8765/docs` for full interactive documentation.
- **ARCHITECTURE.md** — complete rewrite covering system design, data flow, RAG pipeline, Memory Manager, Model Discovery, multi-model modes, and design decisions with code examples.
- **FastAPI app description** — rich server description with feature list, quickstart, and links shown in `/docs`.

**v0.3.5** — Models page: Configured vs Suggestions split
- **Dashboard** — Models page now separates your configured models from discovered suggestions. No more confusion between what's active and what's browsable.
- **UI polish** — cleaner layout, better empty states, discovery panel always accessible without clutter.

**v0.3.4** — Groq rate-limit guard (TPM)
- **3-layer TPM defense** — early token cap at request entry, per-message character trimming, and dynamic `max_tokens` ceiling for Groq free tier (6k–12k TPM).
- Prevents `rate_limit_exceeded` errors when using Groq's free API tier with long conversations or RAG context.

**v0.3.3** — Groq rate-limit fix (initial)
- First-pass fix for Groq token-per-minute limits. Introduced `max_tokens` cap and message length trimming.

**v0.3.2** — Fix README image URLs for PyPI
- Fixed all image paths to absolute GitHub raw URLs so screenshots and logo display correctly on PyPI.

**v0.3.1** — Agent/Plan model selector, IPv6 fix, UI improvements
- **Agent/Plan Model selector** — choose which active model handles Agent/Plan (tool call) requests from continue.dev. Configured in the Configuration page.
- **Server IPv6 fix** — server now binds to `127.0.0.1` explicitly; `.env` PORT is correctly loaded on startup.
- **Dashboard** — relative API URLs (no hardcoded host), CORS accepts any localhost port.
- **UI** — Agent/Plan mode badge in header, Discovery info boxes, RAM badge tooltips, step-by-step workflow, Chat History Limit config, expanded Help page (7 languages).

**v0.3.0** — Smart Memory, Memory Manager, Model Discovery
- **Smart Memory (RAG)** — semantic codebase indexing with `sentence-transformers` + ChromaDB, 100% local. Enable in Configuration.
- **Memory Manager** — real-time RAM/GPU monitoring via `psutil`, Ollama model detection, intelligent unload suggestions and one-click model rotation in the Status page.
- **Model Discovery** — curated Ollama catalog with RAM fit detection + full OpenRouter model browser (60 models, free-first sorting). Quick-add any model to Airvo from the Models page.

**v0.2.0** — Multi-model modes, tool calling, continue.dev integration, 7-language dashboard

**v0.1.0** — Initial release: single-model proxy, FastAPI server, basic dashboard

---

## Community

Airvo is early. Your feedback shapes what comes next.

- 🐛 **Found a bug?** [Open an issue](https://github.com/airvo-dev/airvo/issues)
- 💡 **Have an idea?** [Start a discussion](https://github.com/airvo-dev/airvo/discussions)
- ⭐ **Liked Airvo?** Star the repo — it helps a lot

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built for developers who want AI that works for them — not the other way around.
  <br/><br/>
  <strong>Your AI. Your Rules.</strong>
</p>
