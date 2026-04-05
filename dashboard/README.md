<picture>
  <source media="(prefers-color-scheme: dark)"  srcset="airvo/docs/assets/airvo-logo-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="airvo/docs/assets/airvo-logo-light.svg">
  <img src="airvo/docs/assets/airvo-logo-light.svg" alt="Airvo" height="80"/>
</picture>

<br/>

[![PyPI version](https://img.shields.io/badge/pypi-v0.2.0-7c6dfa?style=flat-square&logo=pypi&logoColor=white)](https://pypi.org/project/airvo)
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
- [Roadmap](#roadmap)
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
- ✅ Up to 3 models responding in parallel — see all, choose the best
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

**⚡ Multi-Model Parallel**
Run up to 3 models simultaneously. See all responses in VS Code and choose the best one.

**🔒 100% Local Option**
Use Ollama or LM Studio with no API key, no internet, no cost. Your code never leaves your machine.

**🎛️ Visual Dashboard**
Manage models, configure API keys, toggle models on/off — all from a clean dark UI at `localhost:5000`.

**🧠 Project Context**
Write your stack, preferences and constraints once. Airvo injects it into every request so the model always knows your project — without you repeating yourself.

**🌡️ Tunable Behavior**
Adjust temperature (0.0 → 1.0) and max tokens per request directly from the dashboard. Precise and deterministic for code, creative for brainstorming.

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

**Models page** — activate/deactivate models, save API keys, see requests and tokens per model.

![Airvo Dashboard - Models](airvo/docs/assets/screenshot-models.png)

**Configuration page** — set multi-model mode, adjust temperature and max tokens, enable project context, view usage stats.

**Add Model page** — add any model with contextual tooltips on every field.

![Airvo Dashboard - Add Model](airvo/docs/assets/screenshot-add-model.png)

**Help page** — full reference guide, field-by-field documentation, FAQ.

![Airvo Dashboard - Help](airvo/docs/assets/screenshot-help.png)

---

## Multi-Model Modes

Airvo supports running multiple models at once. Configure the mode in the Configuration page.

**Parallel** *(available now)* — All active models respond to every message. See all answers side by side. Best for comparing outputs.

**Race** *(coming soon)* — All models receive the message simultaneously. The first to finish wins. Best for speed.

**Vote** *(coming soon)* — Models generate responses and the consensus answer is shown. Best for accuracy.

**Review** *(coming soon)* — One model generates a response, another critiques it. Best for quality.

---

## VS Code Integration

Airvo works through [continue.dev](https://continue.dev) — a VS Code extension for AI-assisted coding.

![Continue.dev with Airvo](airvo/docs/assets/screenshot-vscode.png)

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
→ if you have multiple models active, all analyze in parallel
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

---

## Roadmap

**v0.2.0 — Available now**
- ✅ Local FastAPI server with OpenAI-compatible API
- ✅ LiteLLM integration — any provider, any model
- ✅ Multi-model parallel mode
- ✅ Continue.dev integration for VS Code
- ✅ Visual dashboard with 7 languages
- ✅ CLI — `pip install airvo && airvo start`
- ✅ Temperature and max tokens — configurable from dashboard
- ✅ Project Context — inject your stack into every request
- ✅ Usage stats — requests and tokens per model, stored locally

**What's next**

We're working on the next phase of Airvo. If you want to be the first to know:

→ ⭐ Star this repo to follow updates
→ 💬 Open an issue and tell us what you'd like to see

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

**How do I add a model?**
Open the dashboard → Add Model → fill in the Model ID, Provider, and API Key → Save. Any model supported by [LiteLLM](https://docs.litellm.ai/docs/providers) works. Check the Supported Models table for examples.

**How do I run multiple models in parallel?**
Add models in the dashboard and activate them. Airvo will call them simultaneously on every request. You can have up to 3 active models at once.

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
