# Airvo — Complete User Guide

> **Version:** 0.7.0 · **Language:** English (reference version)
> This document is the master reference for the Airvo dashboard Help page. It covers everything you need to get the most out of Airvo.

---

## Table of Contents

1. [What is Airvo and why does it exist?](#1-what-is-airvo-and-why-does-it-exist)
2. [Quick Start — Up and running in 5 minutes](#2-quick-start--up-and-running-in-5-minutes)
3. [Adding Models — Field by Field](#3-adding-models--field-by-field)
4. [Provider Comparison](#4-provider-comparison)
5. [Multi-Model Modes](#5-multi-model-modes)
6. [Smart Memory (RAG)](#6-smart-memory-rag)
7. [Memory Manager](#7-memory-manager)
8. [Model Discovery](#8-model-discovery)
9. [Agent / Plan Mode](#9-agent--plan-mode)
10. [Project Context](#10-project-context)
11. [Chat History Limit](#11-chat-history-limit)
12. [Airvo Assistant](#12-airvo-assistant)
13. [Compare Tab — Side-by-side model comparison](#13-compare-tab--side-by-side-model-comparison)
14. [Benchmarks Tab — Measure and rank your models](#14-benchmarks-tab--measure-and-rank-your-models)
15. [v0.7 Features — Smart Router, Fallback Chains, Health Monitor](#15-v07-features--smart-router-fallback-chains-health-monitor)
16. [Troubleshooting — When things go wrong](#16-troubleshooting--when-things-go-wrong)
17. [FAQ — Frequently Asked Questions](#17-faq--frequently-asked-questions)
18. [Pro Tips & Best Practices](#18-pro-tips--best-practices)

---

## 1. What is Airvo and why does it exist?

### The problem it solves

Developers today use AI to code. The problem: every model has different strengths. GPT-4 excels at reasoning, Llama at local code generation, Claude at long context. Picking just one is always a compromise.

**Airvo solves that.** It's a local server that acts as a bridge between your editor (VS Code + continue.dev) and any AI model — simultaneously, using your own API keys, without going through any third-party servers.

### What it does exactly

```
Your editor (VS Code)
        │
        │  HTTP  (continue.dev protocol)
        ▼
┌──────────────────┐
│   Airvo Server   │  ← port 5000 (default), running on your machine
│   (FastAPI)      │
└────────┬─────────┘
         │
    ┌────┴─────┐
    │  LiteLLM │  ← speaks to ALL providers
    └────┬─────┘
         │
   ┌─────┼──────┐
   ▼     ▼      ▼
 Groq  OpenAI  Ollama  (any provider)
```

- Receives your message from the editor
- Sends it to one or several models simultaneously
- Returns responses to the editor
- Everything stays on your machine — your keys, your code, your conversations

### Why not just use continue.dev directly?

Continue.dev lets you add one model per provider at a time. Airvo gives you:
- **Multiple active models at the same time**, even from different providers
- **Collaboration modes between models** (parallel, race, vote, review)
- **Local RAG** — which continue.dev doesn't have
- **Visual dashboard** to manage everything without touching JSON configs
- **Project Context** automatically injected into every request

---

## 2. Quick Start — Up and running in 5 minutes

### Step 1 — Install Airvo

```bash
pip install airvo
```

### Step 2 — Start the server

```bash
airvo start
```

You'll see:
```
✓ Airvo server running at http://127.0.0.1:5000
  Dashboard: http://127.0.0.1:5000
```

### Step 3 — Open the dashboard

In your browser: **http://localhost:5000**

### Step 4 — Add your first model

1. Click **Models** → **+ Add Model**
2. Fill in the fields:
   - **Model ID:** `groq/llama-3.3-70b-versatile`
   - **Name:** `Groq Llama 70B`
   - **Provider:** `groq`
   - **API Key:** your key from [console.groq.com](https://console.groq.com) (free)
3. Click **Save** ✓

### Step 5 — Connect with VS Code

In your continue.dev `config.json`:

```json
{
  "models": [
    {
      "title": "Airvo",
      "provider": "openai",
      "model": "airvo",
      "apiBase": "http://localhost:5000",
      "apiKey": "airvo"
    }
  ]
}
```

**Done.** Type anything in continue.dev and Airvo handles it.

---

## 3. Adding Models — Field by Field

### Model ID

**What it is:** The unique identifier that tells LiteLLM which provider and model to use. The format is always `provider/model-name`.

**Why it matters:** If the ID doesn't exactly match what LiteLLM expects, the request fails. This is not a free-form label — it's a technical key.

**Examples:**
```
groq/llama-3.3-70b-versatile      ← Llama 70B on Groq (recommended to start, free)
groq/llama-3.1-8b-instant         ← Llama 8B on Groq (faster, less capable)
groq/gemma2-9b-it                 ← Gemma 2 on Groq
openai/gpt-4o                     ← GPT-4o (paid)
openai/gpt-4o-mini                ← GPT-4o Mini (cheaper)
anthropic/claude-sonnet-4-5       ← Claude Sonnet (paid)
ollama/llama3                     ← Llama 3 local via Ollama (free)
ollama/codellama                  ← CodeLlama local (great for code)
ollama/mistral                    ← Mistral local
lmstudio/local                    ← Any model running in LM Studio
deepseek/deepseek-chat            ← DeepSeek (very good, very cheap)
mistral/mistral-large-latest      ← Mistral Large (cloud API)
gemini/gemini-1.5-pro             ← Gemini Pro (Google)
cohere/command-r-plus             ← Command R+ (Cohere)
```

### Display Name

**What it is:** The label shown in the dashboard and in responses. You can use whatever you want.

**Tip:** Use descriptive names that tell you at a glance what you're looking at:
- ✅ `Groq Llama 70B (free)` — you know the provider, model, and plan
- ❌ `model1` — tells you nothing three weeks later

### Provider

**What it is:** The service hosting the model. Must match the prefix in the Model ID.

**Valid values:**
```
groq · openai · anthropic · ollama · lmstudio · deepseek
mistral · cohere · gemini · togetherai · fireworks · openrouter
```

### API Key

**What it is:** The secret token that authenticates your requests with the provider.

**Where to get it:**
| Provider | URL | Free tier |
|----------|-----|-----------|
| Groq | console.groq.com | ✅ Yes (6k–12k TPM) |
| OpenAI | platform.openai.com | ❌ Paid |
| Anthropic | console.anthropic.com | ❌ Paid |
| DeepSeek | platform.deepseek.com | ✅ Initial credits |
| Gemini | aistudio.google.com | ✅ Yes |
| Mistral | console.mistral.ai | ✅ Initial credits |
| Ollama | — | ✅ 100% local, no key needed |
| LM Studio | — | ✅ 100% local, no key needed |

**For local models (Ollama, LM Studio):** leave this field empty.

**Security:** API keys are stored in `~/.airvo/models.json` on your machine. They are never sent to any Airvo server or third party — they travel only directly from your machine to the provider, encrypted over HTTPS.

### Base URL

**What it is:** The server address that processes requests. Only needed for local models.

**Values:**
```
http://localhost:11434   → Ollama (default port)
http://localhost:1234    → LM Studio (default port)
```

For all cloud providers (Groq, OpenAI, Anthropic, etc.) leave this field **empty** — LiteLLM already knows the correct URL for each one.

### 🔌 API Key Test

**What it is:** A button on every model card that sends a minimal 5-token request to the provider and shows the result.

**How to use it:**
1. Go to **Models**
2. On any model card, click the **🔌 Test** button (only visible for models that have an API key configured)
3. You'll see one of two results:
   - `✓ 312ms` — the key is valid and the model is reachable
   - `✗ invalid_api_key` (or similar error) — something is wrong

**When to use it:**
- After entering a new API key to verify it before starting a session
- When a model is showing errors to diagnose whether the key is the problem
- After generating a new key in the provider's console

**Why it makes a real request (not just validation):** The only reliable test is an actual API call. A key that passes format validation can still fail because it's revoked, from the wrong project, or past its quota.

---

### ✎ Model Notes

**What it is:** A freeform text field per model card where you can write personal reminders.

**How to use it:**
1. On any model card, click the **✎ Edit notes** icon
2. Type your reminder: context limit, pricing tier, best use case, renewal date
3. Click Save — notes are persisted in `~/.airvo/models.json`

**Useful examples:**
```
Free tier: 6k TPM. Resets every minute. Best for fast code snippets.
```
```
Paid — $0.003/1k tokens. Only use for reasoning-heavy tasks.
```
```
Local 7B. Slow on CPU but 100% private. Use for confidential code.
```

Notes appear directly on the model card so you can read them at a glance without having to look anything up.

---

## 4. Provider Comparison

| Provider | Cost | Speed | Quality | Privacy | Best for |
|----------|------|-------|---------|---------|----------|
| **Groq** (free) | Free | ⚡⚡⚡ Very fast | ⭐⭐⭐ Good | ☁️ Cloud | Getting started, prototyping |
| **Ollama** | Free | ⚡⚡ Depends on your GPU | ⭐⭐–⭐⭐⭐ | 🔒 100% local | Full privacy, offline use |
| **LM Studio** | Free | ⚡⚡ Depends on your GPU | ⭐⭐–⭐⭐⭐ | 🔒 100% local | Friendly UI for local models |
| **OpenAI** | Paid | ⚡⚡ Fast | ⭐⭐⭐⭐⭐ | ☁️ Cloud | Top quality, production |
| **Anthropic** | Paid | ⚡⚡ Fast | ⭐⭐⭐⭐⭐ | ☁️ Cloud | Long context, reasoning |
| **DeepSeek** | Very cheap | ⚡⚡ Good | ⭐⭐⭐⭐ | ☁️ Cloud | Best cost/quality ratio |
| **Mistral** | Medium | ⚡⚡ Fast | ⭐⭐⭐⭐ | ☁️ Cloud | Code, EU-based |
| **Gemini** | Free/Paid | ⚡⚡ Fast | ⭐⭐⭐⭐ | ☁️ Cloud | Very long context (2M tokens) |

**Recommended starting combination:** Groq free (llama-3.3-70b-versatile) + Ollama local (codellama). You get cloud speed and local privacy, at zero cost.

---

## 5. Multi-Model Modes

Airvo can send your message to all active models at the same time, in different ways. You configure the mode in your editor (continue.dev).

### Parallel Mode

**How it works:** All active models receive your message simultaneously. You see all responses side by side.

**When to use it:**
- You want to compare the quality of different models
- You don't know which model performs best for your use case
- You're evaluating whether to add or remove a model

**Real-world example:**
> You ask "How do I implement a thread-safe singleton in Python?"
> You see 3 responses: Groq gives the fastest, Claude the most detailed, DeepSeek the most code-heavy.
> You pick the one you like best.

### Race Mode

**How it works:** All models receive the message at the same time. The first response to arrive "wins" — the others are cancelled.

**When to use it:**
- You want the fastest possible answer
- Quality is secondary to speed
- You're in a rapid debug loop

**Why it makes sense:** Groq might take 0.8s, OpenAI 2s, Ollama 5s. In Race mode you always win with the fastest available model.

### Vote Mode

**How it works:** Several models generate responses independently. The consensus answer is shown (the one most models agree on, or the semantic average).

**When to use it:**
- You want higher reliability in the answer
- The task has an "objectively correct" answer (math, logic, algorithms)
- You don't trust a single model not to hallucinate

**Real-world example:**
> You ask about the algorithmic complexity of a function.
> 3 models vote: 2 say O(n log n), 1 says O(n²).
> Vote shows O(n log n) with a confidence indicator.

### Review Mode

**How it works:** Model A generates a response. Model B critiques it, points out errors, and suggests improvements.

**When to use it:**
- Code going to production
- Technical explanations that need accuracy
- When you want an automatic second opinion

**Recommended setup:**
- **Generator:** fast model (Groq Llama)
- **Reviewer:** more careful model (Claude or GPT-4o)

---

## 6. Smart Memory (RAG)

### What problem it solves

When you ask an AI model something, it knows nothing about your project. You have to copy and paste code into every conversation. If the context is large, you run out of tokens.

**RAG fixes that.** Airvo indexes your project locally and before every request automatically injects the most relevant fragments. The model already "knows" about your code without you doing anything.

### How it works internally

```
Your project                    ~/.airvo/rag/
     │                               │
     │  1. Indexing                  │
     ▼                               ▼
[Files] ──chunking──► [Fragments] ──embedding──► [ChromaDB local]
                                                        │
Your message ──embedding──► search vector               │
                                │                       │
                                └──── semantic match ───┘
                                            │
                                      Top K fragments
                                            │
                                            ▼
                               [Final prompt to model]
                          "Relevant context: [code]
                           Your question: [your message]"
```

All of this happens on your machine. The embedding model (`all-MiniLM-L6-v2`, 90 MB) is downloaded once and runs locally.

### How to enable it — Step by Step

1. **Go to Configuration → Smart Memory (RAG)**
2. **Toggle on** "Enable Smart Memory"
   - First time: downloads the model (~90 MB, takes a few seconds)
3. **Enter your project path**
   - Example: `C:\Users\you\myproject` or `/home/you/myproject`
   - Recommended: the root of the repo you're working on
4. **Click "Index Now"**
   - You'll see a progress indicator. For a project with ~1000 files: 30–60 seconds
   - For large monorepos: may take several minutes on first run
5. **The 🧠 RAG badge appears in the header** — you're ready

### When to re-index

- After adding many new files
- After large refactors
- If search results seem "stale"

Re-indexing is incremental — it only processes changed files.

### Recommended parameters

| Parameter | Recommended value | When to change |
|-----------|-------------------|----------------|
| Top K | 2–3 | Lower to 1 if hitting token limits |
| Max context | 2000–3000 chars | Lower when using Groq free tier |
| File extensions | `.py,.ts,.js,.tsx,.go,.rs` | Add based on your stack |

### Privacy

- Embeddings are generated **100% on your machine**
- The index is saved to `~/.airvo/rag/` — never uploaded to any server
- The embedding model runs offline — no internet needed after initial download
- The code that gets injected into the prompt does travel to the provider (Groq, OpenAI, etc.) as part of the normal request — same as if you pasted it manually

---

## 7. Memory Manager

### What problem it solves

Ollama loads models into RAM (or VRAM) when you use them. If you have several large models loaded simultaneously, RAM fills up and Ollama becomes slow or stops responding. Previously you had to open a terminal and kill processes manually.

### How it works

On the **Status** page → **Memory Manager** section you see in real time:

- **Total and used RAM** — with a color bar:
  - 🟢 Green: < 75% — all good
  - 🟡 Yellow: 75–90% — watch out, may get slow
  - 🔴 Red: > 90% — critical, unload models
- **VRAM (GPU)** — if you have a compatible GPU
- **Loaded Ollama models** — which ones are in memory right now
- **"Unload" button** — removes the model from memory with one click

### When to use it

**Symptom:** Ollama isn't responding or responds very slowly.

**10-second diagnosis:**
1. Open Status → Memory Manager
2. RAM > 90%? → Large models are loaded
3. Click "Unload" on the model you're not currently using
4. Ollama starts responding again

**Tip:** If you have 16 GB of RAM, don't load an 8B and a 13B model simultaneously — together they consume most of your system RAM.

### General RAM guide for Ollama

| Model size | Minimum RAM (quantized) |
|------------|------------------------|
| 3B | 2–3 GB |
| 7B / 8B | 4–6 GB |
| 13B | 8–10 GB |
| 34B | 20–24 GB |
| 70B | 40+ GB |

---

## 8. Model Discovery

### What it is

The Discovery panel shows models you can add to Airvo, filtered by your hardware and preferences. It's the easiest way to find what model works best for you without having to look anything up.

### Local Tab — Ollama Catalog

Shows models you can run locally with Ollama, ordered and filtered by your available RAM:

- 🟢 **Green "Fits" badge** — the model fits in your RAM without issues
- 🔴 **Red "Needs more RAM" badge** — you need more memory for this model
- ✅ **"Installed"** — already downloaded in Ollama

**Flow for adding a local model:**
1. Copy the pull command shown on the card:
   ```bash
   ollama pull codellama:7b
   ```
2. Paste it in your terminal and wait for the download
3. Click **"+ Add to Airvo"** on the same model
4. The model is configured and ready to use

### Cloud Tab — OpenRouter

Shows cloud models available via OpenRouter. Useful for:
- Exploring models you're not familiar with
- Finding cheaper alternatives to what you already have
- Free-tier models are highlighted with a special badge

**To use OpenRouter models:**
- You need an account at [openrouter.ai](https://openrouter.ai) (free to start)
- Model ID format: `openrouter/provider/name`

---

## 9. Agent / Plan Mode

### What Agent/Plan is in continue.dev

Continue.dev has 3 interaction modes:

| Mode | Icon | What it does |
|------|------|--------------|
| **Chat** | 💬 | Conversation — text only, no actions |
| **Agent** | ⚡ | Reads and edits files, runs commands, handles complex tasks |
| **Plan** | 📋 | Plans before acting — more predictable than Agent |

### Why Agent/Plan uses only ONE model

In Chat mode, Airvo can send your question to 5 models at the same time — no problem.

In Agent/Plan mode, the conversation is **multi-turn and stateful**:

```
You: "Refactor this function"
         ↓
IDE → Model: [message + tool definitions]
         ↓
Model → IDE: "I need to read file X" (tool call)
         ↓
IDE → Model: [contents of file X]
         ↓
Model → IDE: "Now write this to Y" (tool call)
         ↓
IDE → Model: [confirmation]
         ↓
Model → IDE: "Done, I also fixed Z"
```

If you sent that to 3 models in parallel, all 3 would start editing the same file in different ways simultaneously. Result: chaos.

**That's why Agent/Plan always uses exactly one model.**

### How to choose the model for Agent/Plan

In **Configuration → Agent/Plan Model**:
- You see all your active models in a selector
- **Auto** = uses the first model in your list
- **Recommendation:** choose the most capable model you have (GPT-4o, Claude, or the largest Groq Llama)

### Recommended strategy

- **Chat mode:** enable all your models → compare responses
- **Agent/Plan mode:** pick the most intelligent one → it does the heavy lifting
- Switch the "Agent model" based on the task:
  - Complex Python bug → Claude or GPT-4o
  - Quick refactor → Groq Llama 70B (faster and free)
  - Sensitive code → Ollama local (never leaves your machine)

---

## 10. Project Context

### What it is

A static block of text that gets injected into **every** request, before your message. You explain to the models once who you are, what stack you use, and what your conventions are.

### Why it's useful

Without Project Context, every model response is generic. With it:

- The model knows you use TypeScript strict mode and won't give you `any`
- It knows you use pytest and won't generate tests with unittest
- It knows the project is on Python 3.11 and won't use 3.12 features
- It knows the team writes commits in English

### Example of a well-written context

```
Stack: Python 3.11, FastAPI, PostgreSQL (asyncpg), Redis, pytest
Conventions:
- Type hints on all functions
- Google-style docstrings
- Tests use pytest fixtures, not unittest mocks
- Commits in English, code in English, inline comments in English
- No print() in production — use logger
Project: REST API for a medical appointment booking system
Constraints: don't add heavy dependencies without discussion first
```

### Token cost

~650 tokens maximum (the field has a limit). It's fixed per request — it doesn't grow with the conversation. On Groq free (6k–12k TPM) it's manageable: roughly 11% of your token budget.

**You can disable it** at any time from Configuration if you need to save tokens.

---

## 11. Chat History Limit

### Why this limit exists

Models have a maximum context window. The full conversation in your editor might have 100 messages, but if you send all of them to the model:
- With free APIs: you exceed the tokens-per-minute limit and get a rate limit error
- With paid APIs: you spend more than necessary

### How it works

Airvo keeps the full history in your editor. It only sends the **last N messages** to the API. The rest stays in your editor so you can still read it.

### Recommended values by provider

| Provider | Plan | Recommendation |
|----------|------|----------------|
| Groq | Free | 4–6 messages |
| Groq | Paid | 10–20 messages |
| OpenAI / Anthropic | Paid | 20–50 messages |
| Ollama / LM Studio | Local | No real limit — depends on model context |

**With RAG enabled:** lower the history limit a bit more (RAG context also consumes tokens).

---

## 12. Airvo Assistant

The **Airvo Assistant** is a built-in AI chat interface in the dashboard, designed exclusively to answer questions about Airvo itself — how it works, how to configure it, how to troubleshoot it.

> It is **not** a generic ChatGPT replacement. It only answers Airvo-related questions. For coding tasks, use continue.dev in VS Code as usual.

---

### How to access it

Click the **🤖 Assistant** tab in the top navigation bar of the dashboard.

---

### What it can help with

| Topic | Example questions |
|---|---|
| **Adding models** | "How do I add an Ollama model?" · "Where do I get a Groq API key?" |
| **Feature explanations** | "What does the Compare tab do?" · "How does project memory work?" |
| **Troubleshooting** | "Why is my model showing an error?" · "Why does RAG not find my code?" |
| **Configuration** | "What is the Chat History Limit?" · "How do I enable Smart Memory?" |
| **Architecture** | "How does Vote mode work?" · "How does Airvo route requests?" |

The assistant has access to the full Airvo documentation (HELP.md + ARCHITECTURE.md) and to your **live configuration state** (which models are active, whether RAG is enabled, current preferences). This means it can give you answers specific to *your* setup, not just generic documentation.

---

### Features

**Conversation history**
- All conversations are saved locally at `~/.airvo/chat_history.json`
- Maximum 50 conversations stored
- You can rename, delete individual conversations, or clear all history
- History survives server restarts and browser refreshes

**Streaming responses**
- Responses stream in real-time, word by word, just like a regular chat
- A pulsing "thinking" animation appears while the model is preparing the first token

**Markdown rendering**
- Responses render full Markdown: **bold**, *italic*, `inline code`, headings, bullet lists, numbered lists, links, and horizontal rules
- Code blocks are syntax-highlighted with a copy button

**Token count**
- Each response shows the token count and response time (e.g. `247 tokens · 1.3s`)
- Useful for understanding how much context a question consumes

**Model display**
- The toolbar badge shows which model is currently responding
- Uses the first active model by default (the same model used for continue.dev requests)

**Voice input**
- Click the 🎤 microphone button to dictate your question (requires a browser that supports the Web Speech API — Chrome/Edge on desktop)

**Auto-resizing input**
- The text box grows automatically as you type multi-line questions

**7 languages**
- The Assistant tab is available in all 7 dashboard languages: English, Español, Français, Deutsch, 中文, 日本語, Português
- The assistant itself responds in whatever language you write in

---

### Context the assistant sees

Before every message, the assistant receives:

```
[Full HELP.md — up to 8000 chars]
[Full ARCHITECTURE.md — up to 8000 chars]

CURRENT USER STATE (live snapshot):
  Active models (2):
    - Llama 3.3 70B [groq/llama-3.3-70b-versatile] provider=groq
    - Llama 3.2 3B [ollama/llama3.2:3b] provider=ollama
  RAG enabled: True
  Memory enabled: False
  max_history_messages: 10
```

This means the assistant knows your exact configuration and can give precise, contextual answers — not generic advice.

---

### Assistant History Limit

The **Assistant History Limit** (configured in Configuration → Assistant History Limit) controls how many previous messages from the assistant conversation are sent to the model on each request.

| Range | Effect |
|---|---|
| 🟢 2–6 | Fast, minimal token usage |
| 🟡 8–14 | Balanced — follows multi-turn conversations well |
| 🔴 16+ | Deep context — more tokens per request |

**Default: 10.** Lower this if you are using a model with a small context window or a tight rate limit.

---

### What the assistant will NOT do

- Answer general programming questions unrelated to Airvo
- Help with tasks in your codebase (use continue.dev in VS Code for that)
- Access the internet or external resources
- Execute commands or modify your configuration

If you ask an off-topic question, the assistant will redirect you: *"I'm the Airvo Assistant — I can only help with Airvo-specific questions."*

---

## 13. Compare Tab — Side-by-side model comparison

### What it is

The **Compare** tab lets you send a single prompt to all your active models at once and see their responses stream in side by side. It's the fastest way to evaluate model quality, cost, and speed for a specific task.

> This is separate from continue.dev. It lives entirely in the Airvo dashboard and doesn't affect your editor workflow.

---

### How to use it

1. Click the **⇆ Compare** tab in the dashboard navigation
2. Type your prompt in the prompt box
3. Click **Run** (or press Enter)
4. All active models stream their responses in parallel, card by card
5. Use the controls to explore the results

---

### What you see

**Response cards**
Each active model gets its own card, showing:
- **Model name** and provider badge
- **Streaming response** — tokens appear as the model generates them
- **Response time** (total seconds to complete)
- **Token count** and **tok/s** — tokens per second, a measure of raw speed
- **Copy** button — copies the full response text

**Sorting**
- By default, cards reorder as responses arrive (fastest model first)
- Use the **Sort by** control to lock to **Arrival time** or **Token count**

---

### Word-level Diff

The most powerful feature of the Compare tab. Once two or more responses have arrived:

1. **Pin** one response (click the 📌 icon on a card)
2. All other cards immediately show a word-level diff against the pinned response:
   - 🟩 **Green highlight** — word present in the pinned response but different from this one
   - 🟥 **Red highlight** — word in this response but not in the pinned one
   - **No highlight** — identical to the pinned response

**Why it's useful:**
- You instantly see where models disagree — not just that they disagree, but exactly which words differ
- Great for factual questions: pinned = the model you trust most, red = deviations to investigate
- Great for code: spot where one model used a different function name, library, or pattern

**To remove the diff:** click the 📌 icon again to unpin.

---

### Exporting results

Click **Export** on any comparison run to save results as Markdown.

The exported file includes:
- The prompt
- All model responses in full
- Metadata: model name, tokens, time, tok/s per response
- Timestamp of the run

Useful for sharing with teammates, keeping notes on model evaluation, or feeding results into a report.

---

### History

The Compare tab keeps the **last 10 runs** in memory and persists them to `~/.airvo/compare_history.json`. 

- Use the **History** dropdown (if available) to re-load a past comparison
- History survives server restarts
- Click **Clear history** to wipe all stored comparisons

---

### Tips

- **For evaluating code quality:** use a tricky algorithm problem. Diff immediately shows which models deviate from the consensus approach.
- **For evaluating instruction-following:** ask a model to respond in a specific format (JSON, bullet points). Diff shows who follows and who improvises.
- **For debugging rate limits:** if one model's card shows an error instead of a response, that model hit its rate limit. The others still complete normally.
- **Tok/s badge:** lower tok/s means the model is thinking more (larger models) or the provider is slower. Use Race mode in continue.dev if you find one model is always fastest here.

---

## 14. Benchmarks Tab — Measure and rank your models

### What it is

The **Benchmarks** tab runs standardized test suites against all your active models and gives them objective scores: speed, accuracy, reasoning quality, and creativity. Think of it as a personal leaderboard for the exact models you're using.

> Results are specific to *your hardware and your API keys* — not generic internet benchmarks. A model's score here reflects actual performance in your setup.

---

### Built-in suites

| Suite | What it tests | Auto-validated? |
|---|---|---|
| **Speed** | Time to first token, tok/s, total latency | — (objective) |
| **Coding** | FizzBuzz, palindrome check, Fibonacci | ✅ Yes — output is checked for correctness |
| **Reasoning** | Syllogism, sequence completion, math word problem | ✅ Yes — answer compared to expected |
| **Creativity** | Open-ended creative prompts | 📊 Length + consistency score |

---

### How to run a benchmark

1. Click the **🏅 Benchmarks** tab
2. Select a suite from the **Suite** dropdown (Speed, Coding, Reasoning, Creativity, or a custom suite)
3. Optionally: add a **run annotation** — a short note about this run (e.g. `"after upgrading Ollama"`, `"with RAG disabled"`)
4. Click **Run Suite**
5. Watch each model run each prompt in the suite sequentially
6. See the **Leaderboard**, **Radar chart**, and **Per-prompt results** when the run completes

---

### Reading the results

**Leaderboard**

After a run, models are ranked by composite score (0–100):

| Component | Weight | What it measures |
|---|---|---|
| **Accuracy** | Highest | Whether the model got the right answer (validated prompts only) |
| **Speed (tok/s)** | High | How fast the model generates text |
| **Output quality** | Medium | Length, coherence |
| **Consistency** | Medium | Low variance across runs |

Models that fail on a prompt get 0 for that prompt's accuracy component.

**Per-prompt results table**

Below the leaderboard you'll find a table with each model × each prompt:
- ✅ = correct answer
- ❌ = wrong answer or error
- Time in seconds + token count per cell

**Radar chart**

When 2 or more models are compared, a radar chart shows the 4 axes (Speed, Tok/s, Accuracy, Consistency) for each model on the same plot. Great for seeing at a glance which model is balanced vs. which specializes.

**Score history**

Every time you run a suite, the composite score is added to the history chart. After 3+ runs on the same suite you can see a trend line per model:
- Did updating Ollama improve or hurt speed?
- Did switching from llama3 to llama3.1 improve accuracy?
- Is one model consistently better on Monday than Friday? (hint: Groq free tier congestion)

Hover over any dot to see the run date, score, and your annotation.

---

### Custom suites

You can create your own benchmark suites with your own prompts.

**Creating a custom suite:**
1. Go to **Benchmarks** → click **+ New Suite**
2. Give it a name (e.g. `"My SQL queries"`, `"TypeScript edge cases"`)
3. Add prompts — you can optionally add an **expected answer** for automatic validation
4. Click **Save Suite**

**Suites are saved server-side** at `~/.airvo/bench_suites.json`, so they survive browser cache clears, browser changes, and Airvo reinstalls.

**Multiple suites:** create as many as you want. Switch between them via the dropdown. Each suite stores its prompts independently.

**With expected answers:** if you provide an expected answer (or keyword), Airvo checks whether the model's response contains it. Models that match get ✅; others get ❌. This gives you a real accuracy score even for custom prompts.

---

### Exporting results

After a run, click **Export** to save:
- **Markdown (`.md`)** — human-readable leaderboard + per-prompt table
- **CSV (`.csv`)** — spreadsheet-friendly format
- **Raw JSON** — full result data for programmatic processing

---

### Tips

- **Run Speed suite first** when onboarding a new model — you'll immediately know if it's fast enough for your workflow
- **Run Coding suite after model updates** — new versions sometimes regress on specific patterns
- **Use annotations** even when you think you'll remember what changed — you won't
- **Don't mix Groq free-tier and paid models in the same run** — Groq's rate limits can artificially slow times mid-suite
- **Custom suite tip:** create a suite with 3–5 prompts from your actual daily work. The score will be more relevant than any generic benchmark.

---

## 15. v0.7 Features — Smart Router, Fallback Chains, Health Monitor

### 🧠 Smart Router

Every message you send is automatically classified into one of 6 categories before being sent to a model:

| Category | Icon | Detected when the prompt … |
|---|---|---|
| `code` | 💻 | mentions writing, implementing, a function, a class, a script … |
| `debug` | 🐞 | mentions fixing, an error, a bug, an exception, a traceback … |
| `math` | 📊 | mentions calculating, solving, equations, probability, derivatives … |
| `creative` | ✍️ | mentions stories, poems, essays, brainstorming, imagination … |
| `explain` | 📖 | mentions explaining, what is, how does, describing, summarizing … |
| `general` | 💬 | everything else |

Classification is done **entirely on your machine with 0ms latency** — no API call, no model, just regex patterns.

**How to use it:**
1. Go to **Configuration** tab
2. Scroll to **🧠 Smart Router**
3. For each category, select the model you want Airvo to prefer
4. Leave a category at “none” to use the default model

A **category badge** (e.g. `💻 Code`) appears in the chat toolbar after each response so you know what was detected.

**Example setup:**
- `code` → `groq/llama-3.1-8b-instant` (fast, great at code)
- `debug` → `groq/llama-3.3-70b-versatile` (more capable, better reasoning)
- `math` → `openai/gpt-4o` (strongest at math)
- `creative` → `anthropic/claude-3-haiku` (creative writing)

---

### ⚡ Fallback Chains

If the selected model fails — timeout, rate limit hit, server error — Airvo **automatically tries the next active model** without interrupting you.

**What you see:**
- A **orange toast** at the bottom of the chat: `⚡ Fallback: ModelA → ModelB`
- The response continues streaming from the fallback model
- The `done` event tells you which model actually responded

**Chain order:** the primary model is tried first (as selected by Smart Router or your default). Then all remaining active models are tried in order. If every model fails, you see a clear error message.

**Why is this useful?**
- Groq has free-tier rate limits — if you hit them, your Ollama local model takes over automatically
- No more "model unavailable" dead ends
- Works in both the chat and the regenerate flow

---

### 🏓 Model Health Monitor

Before starting a session, you can verify that all your configured models are actually reachable.

**How to use it:**
1. Go to the **Models** tab
2. Click **🏓 Ping All** (top right of the models grid)
3. Wait 2–5 seconds while Airvo pings all active models in parallel
4. Each model card shows:
   - `✅ 45ms` — model is reachable, latency in milliseconds
   - `❌ timeout` or `❌ error message` — model is unreachable

**Tips:**
- Click **Ping All** at the start of a work session
- If a model shows `❌`, check the API key or whether Ollama is running
- Latency gives you a hint of which model will respond fastest in Race mode

---

### ↺ Regenerate

Not happy with the last AI response? Click the **↺** button on any AI message bubble (visible when the assistant is not currently streaming). It removes the last response and resends your original prompt fresh — including Smart Router classification and Fallback Chain protection.

---

## 16. Troubleshooting — When things go wrong

### ❌ "Rate limit error" / "tokens too large" from Groq

**Why it happens:** Groq free has a 6k–12k tokens-per-minute limit. If the conversation is long + RAG is active + Project Context is on, you exceed that limit.

**Step-by-step fix:**
1. **Configuration → Chat History Limit** → set to **4 messages**
2. **Configuration → Smart Memory → Max context** → lower to **1000 characters**
3. If the error persists: temporarily disable Project Context
4. If it still persists: wait 60 seconds (the limit resets per minute)

**Permanent fix:** Use a paid model (DeepSeek is cheap) or Ollama locally.

---

### ❌ Can't connect / "Server offline"

**Why it happens:** The Airvo server isn't running, is on a different port, or there's a conflict.

**Diagnosis:**
```bash
# Is it running?
airvo start

# What port?
netstat -ano | findstr :5000   # Windows
lsof -i :5000                  # Mac/Linux

# Does it respond?
curl http://127.0.0.1:5000/api/health
```

**Fixes:**
1. Run `airvo start` in a terminal
2. Check that the port in `.env` (`PORT=5000`) matches the port in your continue.dev config
3. If there's a port conflict: change to 8766 in `.env` and in your continue.dev config
4. Restart: `Ctrl+C` → `airvo start`

---

### ❌ A model shows an error / red icon

**Why it happens:** Wrong API key, model unavailable, Ollama not running.

**For cloud models (Groq, OpenAI, etc.):**
1. Go to **Models** → click the model showing the error
2. Verify the API key is correct (no spaces, no line breaks)
3. Check in the provider's console that the key is active
4. Verify the Model ID is exactly what the provider accepts

**For Ollama models:**
1. Verify Ollama is running: `ollama serve` in terminal
2. Verify the model is downloaded: `ollama list`
3. If not: `ollama pull llama3`
4. Verify Base URL is `http://localhost:11434`

---

### ❌ Smart Memory isn't finding my code

**Why it happens:** Wrong path, stale index, or file extensions not included.

**Step-by-step fix:**
1. **Configuration → Smart Memory** → verify the path is the project root
2. Click **"Index Now"** to force a re-index
3. Wait for it to finish (progress bar reaches 100%)
4. Try a search with text that clearly exists in your code

**If the problem persists:**
- Check that your project's file types are included (`.py`, `.ts`, etc.)
- For monorepos: point to the specific subfolder, not the monorepo root
- Lower Top K to 1 — sometimes fewer results are more precise

---

### ❌ Model Discovery doesn't show Ollama models as installed

**Why it happens:** Ollama wasn't running when the catalog loaded.

**Fix:**
1. Open a terminal: `ollama serve`
2. Reload the Discovery panel in the dashboard
3. Models you have downloaded will appear with the "Installed" badge

The model catalog always loads (it comes from a local JSON). Only the "Installed" badge requires Ollama to respond on `localhost:11434`.

---

### ❌ Dashboard shows "Server offline" but the server is running

**Why it happens:** Usually an IPv4/IPv6 issue. The server is on `127.0.0.1` (IPv4) but the browser tries `localhost` which may resolve to `::1` (IPv6).

**Fix:**
- Use **`http://localhost:5000`** in the browser
- Or in continue.dev config: use `http://localhost:5000/v1` as `apiBase`

---

### ❌ Responses are slow / timeouts

**Possible causes:**
1. **Large local model with limited RAM** → Memory Manager → unload unused models
2. **Parallel mode with many models** → disable the slower models
3. **RAG indexing at the same time** → wait for indexing to finish
4. **Groq soft rate limit** → wait 60 seconds and retry

---

## 17. FAQ — Frequently Asked Questions

**Do I need to fill in all fields to add a model?**
No. Only Model ID, Name, and Provider are required. API Key is needed for cloud models. Base URL only for local models.

---

**Can I use models that aren't in the examples list?**
Yes — any model supported by LiteLLM works with Airvo. LiteLLM's list includes 100+ providers. If the provider has an OpenAI-compatible API, it works too.

---

**Are my API keys safe?**
Keys are stored in `~/.airvo/models.json` on your local machine. They are never sent to Airvo's servers. The Airvo server runs locally — keys travel only from your machine to the provider directly, encrypted over HTTPS.

---

**How do I use Ollama with Airvo?**
1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Download a model: `ollama pull llama3`
3. In Airvo: Model ID `ollama/llama3`, Provider `ollama`, Base URL `http://localhost:11434`, no API key
4. Make sure `ollama serve` is running

---

**Does it work with editors other than VS Code?**
Airvo speaks the OpenAI protocol, so any client that supports a custom `apiBase` can use it: Cursor, Zed, Neovim with compatible plugins. Official support is VS Code + continue.dev.

---

**Does RAG work with private or sensitive code?**
Yes, and that's one of its main advantages. Embeddings are generated locally (no code sent to the internet). The index stays in `~/.airvo/rag/` on your machine. Only when the model receives the code fragment as part of a prompt does that fragment travel to the provider — same as if you pasted it manually. For code that can't leave your network, use Ollama locally as your model.

---

**Why do I see multiple responses in Chat mode but only one in Agent?**
By design. Chat is conversational: each response is independent. Agent is operational: it edits files, runs commands, makes real changes. Two models making real changes simultaneously would cause conflicts. See section 9 for a detailed explanation.

---

**How many models can I have active at the same time?**
No hard technical limit. In practice:
- 2–4 active models is most useful in parallel mode
- More than 4 in parallel can be hard to read
- The real limit is your tokens-per-minute budget with providers

---

**What happens if Airvo crashes while I'm working?**
Your editor (continue.dev) will show a connection error. Your conversation is saved in the editor. When you restart with `airvo start`, everything works again — nothing is lost.

---

## 18. Pro Tips & Best Practices

### 🎯 The ideal starting combination

```
groq/llama-3.3-70b-versatile  →  fast responses, free
ollama/codellama               →  private code, no internet
```

With these two you get cloud speed and local privacy, at zero cost.

---

### 🔄 Optimized development workflow

1. **Chat mode (💬):** explore ideas, compare how models understand the problem
2. **Agent mode (⚡):** delegate the implementation to your most capable model
3. **RAG active:** the model already knows your project's context
4. **Project Context:** the model knows your stack and conventions

Result: you say "refactor the authentication service to use JWT" and the model knows where the files are, what stack you use, and how you write code.

---

### ↔️ Tips for Compare Tab

- **Pin the model you trust most** — red highlights on other cards immediately flag deviations worth investigating
- **Use Compare before starting a large Agent task** — send the problem description, see which model's approach you like best, then delegate to it
- **Tok/s badge shows actual speed on your connection** — more reliable than published benchmarks
- **Export comparisons** when evaluating models so you have notes across sessions
- **For factual questions:** pin the "ground truth" model; red words on other cards = discrepancies to investigate

---

### 🏆 Tips for Benchmarks

- **Run the Speed suite first** when onboarding any new model — you'll immediately know if it's fast enough for your workflow
- **Annotate every run** — even `"before Ollama update"` saves you from guessing later what changed
- **Create a custom suite** with 3–5 of your real daily prompts — the score will be more relevant than any generic benchmark
- **Don't run during heavy Groq free-tier usage** — rate limits artificially inflate times and make results misleading
- **Score history trend** is more useful than a single run — run the same suite weekly for 4 weeks to see real drift

---

### 💡 Tips for Project Context

- **Be specific about what you DON'T want** — "no print(), use logger" is more useful than "follow best practices"
- **Update it when the stack changes** — if you migrate from pytest to pytest-asyncio, reflect that
- **Include naming conventions** — prevents the model from inventing its own styles
- **Mention key dependencies with versions** — "we use SQLAlchemy 2.0 async, not 1.x sync"

---

### 🧠 Tips for RAG

- **Index only the current project** — don't index `node_modules`, `.venv`, etc. (Airvo ignores them by default, but verify)
- **Re-index after large PRs** — if you merged significant changes, re-indexing keeps context fresh
- **Top K = 1–2** for specific tasks (one endpoint, one function). Top K = 3–5 for tasks that span multiple files
- **Disable RAG** for general questions ("how does async/await work?") — no project context needed

---

### ⚡ Tips for speed

- **Groq is the fastest** for its model size — ideal for the development loop
- **Race mode** if you have Groq + something slower: Groq always wins
- **History = 4 messages** on Groq free — enough for most tasks
- **Disable models** you're not using — reduces noise and speeds up parallel mode
- **Smart Router + Health Monitor combo:** ping models at session start, then let Smart Router auto-route to the fastest alive model per task type

---

### 🔒 Tips for privacy

- **Ollama for sensitive code** — credentials, internal architecture, customer data
- **Disable RAG** if the project has sensitive data and you're using a cloud model
- **Project Context** — don't include internal URLs, IPs, or confidential information — that text goes in every single request

---

### 🛠️ Useful terminal commands

```bash
airvo start               # start server (port 5000)
airvo start --port 8766   # alternative port
airvo version             # show installed version
airvo --help              # show all commands

ollama serve              # start Ollama
ollama list               # list downloaded models
ollama pull llama3        # download a model
ollama rm llama3          # remove a model
```

---

*Airvo v0.7.0 · [github.com/airvo-dev/airvo](https://github.com/airvo-dev/airvo) · [pypi.org/project/airvo](https://pypi.org/project/airvo)*
