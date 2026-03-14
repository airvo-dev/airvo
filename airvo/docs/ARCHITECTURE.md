# 🏗️ Architecture - Airvo v0.1.0

**Version:** 0.1.0  
**Last Updated:** March 13, 2026  
**Status:** Documentation Complete ✅

---

## 📑 Table of Contents

1. [Overview](#1-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Directory Structure](#4-directory-structure)
5. [Core Components](#5-core-components)
6. [Data Flows](#6-data-flows)
7. [Database and Persistence](#7-database-and-persistence)
8. [API Endpoints](#8-api-endpoints)
9. [Design Decisions](#9-design-decisions)

---

## 1. Overview

### What is Airvo?

**Airvo** is a local server that acts as an orchestrator for multiple AI models. It integrates natively with VS Code + Continue.dev, enabling:

- ✅ Run 2+ models in parallel
- ✅ API keys stored locally (never in cloud)
- ✅ Compatible with Continue.dev (OpenAI API compatible)
- ✅ Support for cloud models (Groq, OpenAI, Anthropic) + local models (Ollama, LM Studio)
- ✅ Web dashboard for managing everything
- ✅ Zero-configuration auto-setup

### Why it exists

Provides complete control over:
- **Which models to use** → No vendor lock-in
- **Where data is processed** → Local-first, never in cloud
- **How much it costs** → Free models (Groq) + optional premium models
- **How they behave** → Control temperature, tokens, prompt injection

### Core objectives

| Objective | Support |
|-----------|---------|
| Single model streaming | ✅ |
| Multi-model parallel execution | ✅ |
| Local models (offline) | ✅ |
| Cloud models (paid) | ✅ |
| Usage statistics | ✅ |
| Project memory/context | ✅ |
| Auto-setup continue.dev | ✅ |

---

## 2. High-Level Architecture

### Component flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        VS Code Editor                           │
│                  + Continue.dev Extension                       │
│          (connects via OpenAI-compatible API)                   │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                    HTTP POST/GET
                    (streaming SSE)
                           │
        ┌──────────────────▼──────────────────┐
        │                                      │
        │     🚀 AIRVO SERVER (FastAPI)       │
        │      localhost:8765                 │
        │                                      │
        │  • /v1/chat/completions (OpenAI)   │
        │  • /api/models (CRUD)              │
        │  • /api/prefs (Config)             │
        │  • /api/stats (Telemetry)          │
        │                                      │
        └──────────────┬───────────────────────┘
                       │
        ┌──────────────▼───────────────────────┐
        │   LiteLLM Router                     │
        │   (Abstraction of 100+ providers)   │
        └──────────────┬───────────────────────┘
                       │
        ┌──────────────▼───────────────────────┐
        │   Multi-Model Orchestrator           │
        │   • Parallel  • Race                 │
        │   • Vote      • Review               │
        └──────────────┬───────────────────────┘
                       │
        ┌──────────────┴──────────────┬───────────────┐
        │                             │               │
   Cloud Providers            Local Providers      HTTP APIs
        │                             │               │
    ┌───┴────┐              ┌─────────┴─────────┐  ┌─┴─┐
    │Groq    │              │  Ollama / LM      │  │...│
    │OpenAI  │              │  Studio (Local)   │  │   │
    │Claude  │              │  (100% offline)   │  └───┘
    └────────┘              └───────────────────┘
```

### Architecture layers

```
┌─────────────────────────────────────────┐
│  Presentation (React Dashboard)         │  ← UI for management
│  localhost:8765                         │
├─────────────────────────────────────────┤
│  API REST (FastAPI)                     │  ← HTTP Endpoints
│  • /v1/chat/completions (OpenAI)       │
│  • /api/models (CRUD)                  │
│  • /api/prefs (Preferences)            │
│  • /api/stats (Statistics)             │
├─────────────────────────────────────────┤
│  Orchestration (LiteLLM)                │  ← Multi-model router
│  • asyncio.gather() for parallel       │
│  • Project context injection           │
│  • Token and usage tracking            │
├─────────────────────────────────────────┤
│  Storage (JSON)                         │  ← ~/.airvo/
│  • models.json (list + API keys)       │
│  • prefs.json (preferences)            │
│  • stats.json (statistics)             │
└─────────────────────────────────────────┘
```

---

## 3. Technology Stack

### Backend

| Component | Technology | Purpose | Reason |
|-----------|-----------|---------|--------|
| Web Framework | **FastAPI** | Async HTTP server | Native async/await, streaming, type-safe |
| ASGI Server | **Uvicorn** | Run FastAPI | Fast, supports streaming |
| LLM Router | **LiteLLM** | Abstract 100+ providers | Unified API, automatic fallback |
| CLI | **Typer** | Command-line interface | Auto documentation, type hints |
| Config | **Pydantic** | Settings validation | Type-safe, automatic serialization |

### Frontend

| Component | Technology | Purpose | Reason |
|-----------|-----------|---------|--------|
| Framework | **React 19** | Interactive UI | Modern hooks, efficient re-renders |
| Bundler | **Vite** | Fast compilation | Build < 1s, excellent HMR |
| CSS | **Vanilla** | Styling | No dependencies, custom dark theme |
| HTTP | **Fetch API** | HTTP requests | Native, promises, streaming |
| Storage | **localStorage** | Persist UI state | Selected language, preferences |

### Why these choices

```python
# FastAPI: Async/await + native streaming
@app.post("/v1/chat/completions")
async def chat_completions(request: ChatRequest):
    return StreamingResponse(stream_generator(), media_type="text/event-stream")

# LiteLLM: One API for 100+ models
response = await litellm.acompletion(
    model="groq/llama-3.3-70b-versatile",  # Same code for OpenAI, Claude, etc.
    messages=messages,
    api_key=api_key
)

# asyncio: True parallelization
results = await asyncio.gather(
    call_model(model1, messages),
    call_model(model2, messages)
)  # ✅ Both execute simultaneously

# JSON: Simple data, no DB needed
~/.airvo/models.json    ← Portable, readable, backupable
```

---

## 4. Directory Structure

```
airvo/
│
├── airvo/                                    ← Main Python package
│   ├── __init__.py
│   │
│   ├── 🎯 cli.py                            ← CLI (airvo start, airvo config)
│   │   ├── start()                          ← Start server
│   │   ├── config()                         ← Configure settings
│   │   ├── version()                        ← Show version
│   │   ├── ensure_models_config()
│   │   ├── ensure_continue_config()
│   │   ├── detect_continue_dev()
│   │   └── print_banner()
│   │
│   ├── 🎯 server.py                         ← FastAPI + static files (66 lines)
│   │   ├── app = FastAPI()
│   │   ├── CORS middleware
│   │   ├── Include API router
│   │   ├── Mount static files (React dist/)
│   │   └── SPA fallback (client-side routing)
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   └── 🎯 routes.py                     ← All endpoints (350 lines)
│   │       ├── POST   /v1/chat/completions  ← OpenAI compatible
│   │       ├── GET    /v1/models
│   │       ├── GET    /api/models
│   │       ├── POST   /api/models
│   │       ├── PATCH  /api/models/{id}
│   │       ├── DELETE /api/models/{id}
│   │       ├── PATCH  /api/models/{id}/toggle
│   │       ├── GET    /api/prefs
│   │       ├── PATCH  /api/prefs
│   │       ├── GET    /api/stats
│   │       ├── DELETE /api/stats
│   │       └── GET    /api/health
│   │
│   ├── config/
│   │   ├── __init__.py
│   │   └── 🎯 settings.py                   ← Settings + I/O (250 lines)
│   │       ├── class Settings (Singleton)
│   │       ├── load_models()
│   │       ├── save_models()
│   │       ├── get_active_models()
│   │       ├── record_usage()
│   │       └── get_prefs()
│   │
│   ├── dashboard/                           ← Frontend React + Vite
│   │   ├── src/
│   │   │   ├── 🎯 App.jsx                   ← Main component (850 lines)
│   │   │   │   ├── Models page (CRUD)
│   │   │   │   ├── Status page (health)
│   │   │   │   ├── Config page (prefs)
│   │   │   │   ├── Add Model page
│   │   │   │   └── Help page
│   │   │   ├── App.css                      ← Dark theme
│   │   │   ├── index.css
│   │   │   └── main.jsx
│   │   ├── vite.config.js
│   │   ├── package.json
│   │   └── dist/                            ← Compiled (npm run build)
│   │
│   └── docs/
│       └── assets/                          ← Images, icons
│
├── tests/
│   ├── __init__.py
│   └── test_multi.py                        ← Multi-model tests
│
├── pyproject.toml                           ← Package definition
├── MANIFEST.in                              ← Include dashboard in dist
├── README.md                                ← Documentation
├── LICENSE                                  ← MIT
├── .gitignore
└── .env                                     ← (gitignored)

~/.airvo/                                    ← User home config
├── models.json                              ← Models list + API keys
├── prefs.json                               ← User preferences
└── stats.json                               ← Usage statistics
```

---

## 5. Core Components

### 5.1 CLI: `airvo/cli.py`

**Responsibility:** Command-line interface for starting and configuring Airvo

**Commands:**

```bash
# Start the server (main command)
airvo start

# With options
airvo start --host 0.0.0.0 --port 9000 --reload

# Show configuration
airvo config --show

# Configure Telegram integration
airvo config --telegram-token <token>

# Show version
airvo version
```

**Flow of `airvo start`:**

```
1️⃣  ensure_models_config()
    └─ Create ~/.airvo/models.json if not exists
    └─ Display: "✓ Created ~/.airvo/models.json with default models"

2️⃣  ensure_continue_config()
    └─ Create ~/.continue/config.yaml if not exists
    └─ Auto-configure continue.dev for Airvo
    └─ Call detect_continue_dev()
    └─ If not detected: show link to install

3️⃣  detect_continue_dev()
    └─ Search for extension in VS Code directories
    └─ Windows:  %AppData%/Roaming/Code/User/extensions
    └─ macOS:    ~/Library/Application Support/Code/User/extensions
    └─ Linux:    ~/.config/Code/User/extensions
    └─ Return True if found folder starting with "continue."

4️⃣  print_banner(host, port, dashboard_ready)
    └─ Show ASCII art with server info
    
5️⃣  open_browser_delayed(url, delay=1.5)
    └─ Background thread opens browser after 1.5s
    └─ Gives time for Uvicorn to start

6️⃣  uvicorn.run()
    └─ Start FastAPI server on port 8765
    └─ Log level: warning (less noise)
```

**Key functions:**

| Function | Purpose |
|----------|---------|
| `ensure_models_config()` | Create ~/.airvo/models.json with defaults |
| `ensure_continue_config()` | Auto-configure continue.dev |
| `detect_continue_dev()` | Detect if continue.dev is in VS Code |
| `print_banner()` | Show server info on startup |
| `open_browser_delayed()` | Open dashboard after delay |
| `start()` | Main command (airvo start) |
| `config()` | Configuration command |
| `version()` | Show version |

---

### 5.2 Server: `airvo/server.py`

**Responsibility:** Configure FastAPI, middlewares, routes, and serve dashboard

**Content:**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path
from airvo.api.routes import router

# ── FastAPI instance
app = FastAPI(
    title="Airvo",
    version="0.1.0",
    description="Local AI coding copilot — any model, any provider."
)

# ── CORS middleware (for dashboard development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Include API routes
app.include_router(router)  # /v1, /api endpoints

# ── Serve static dashboard
_package_dist = Path(__file__).parent / "dashboard" / "dist"
_dev_dist     = Path.cwd() / "dashboard" / "dist"
_dist         = _package_dist if _package_dist.exists() else _dev_dist

if _dist.exists():
    # Mount assets
    _assets = _dist / "assets"
    if _assets.exists():
        app.mount("/assets", StaticFiles(directory=str(_assets)), name="assets")
    
    # SPA fallback (React client-side routing)
    @app.get("/")
    async def serve_dashboard():
        """Serve the React dashboard index"""
        return FileResponse(str(_dist / "index.html"))

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """
        Catch-all route — serve static files if they exist,
        otherwise fall back to index.html for React client-side routing.
        """
        file_path = _dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(_dist / "index.html"))
else:
    @app.get("/")
    async def no_dashboard():
        """Fallback when dashboard hasn't been built yet"""
        return {
            "status": "running",
            "message": "Airvo API is running. Dashboard not built yet.",
            "hint": "cd dashboard && npm run build",
            "api_docs": "/docs",
        }
```

**Key features:**

- ✅ Centralized FastAPI instance
- ✅ CORS enabled (for development)
- ✅ API routes included
- ✅ Dashboard served as static files
- ✅ SPA fallback for React routing
- ✅ Supports development and production

**Why this approach?**

```
Development:
  dashboard/dist/ → npm run build → locally compiled files

Production:
  airvo/dashboard/dist/ → packaged in pip install
```

---

### 5.3 Settings: `airvo/config/settings.py`

**Responsibility:** Manage all configuration and persistence

**Settings class (Singleton):**

```python
class Settings:
    """Singleton for managing all configuration"""
    
    def __init__(self):
        self.config_dir = Path.home() / ".airvo"
        self.models_file = self.config_dir / "models.json"
        self.prefs_file = self.config_dir / "prefs.json"
        self.stats_file = self.config_dir / "stats.json"
        self.config_dir.mkdir(exist_ok=True)
    
    # ── CRUD Models ────────────────────────────
    def get_models(self) -> List[dict]:
        if not self.models_file.exists():
            self.save_models(DEFAULT_MODELS)
        return json.load(self.models_file)
    
    def add_model(self, model: dict):
        models = self.get_models()
        models.append(model)
        self.save_models(models)
    
    def update_model(self, model_id: str, updates: dict):
        models = self.get_models()
        for m in models:
            if m["id"] == model_id:
                m.update(updates)
                break
        self.save_models(models)
    
    def delete_model(self, model_id: str):
        models = [m for m in self.get_models() if m["id"] != model_id]
        self.save_models(models)
    
    def get_active_models(self) -> List[dict]:
        return [m for m in self.get_models() if m["active"]]
    
    # ── Preferences ────────────────────────────
    def get_prefs(self) -> dict:
        if not self.prefs_file.exists():
            self.save_prefs(DEFAULT_PREFS)
        return json.load(self.prefs_file)
    
    def update_prefs(self, updates: dict):
        prefs = self.get_prefs()
        prefs.update(updates)
        self.save_prefs(prefs)
    
    # ── Statistics ────────────────────────────
    def record_usage(self, model_id: str, tokens: int):
        stats = self.get_stats()
        if model_id not in stats:
            stats[model_id] = {"requests": 0, "tokens": 0}
        stats[model_id]["requests"] += 1
        stats[model_id]["tokens"] += tokens
        self.save_stats(stats)
    
    # ── Persistence (JSON) ────────────────────
    def save_models(self, models: List[dict]):
        self.models_file.write_text(json.dumps(models, indent=2))
    
    def save_prefs(self, prefs: dict):
        self.prefs_file.write_text(json.dumps(prefs, indent=2))
```

**Default models:**

```json
[
  {
    "id": "groq/llama-3.1-8b-instant",
    "name": "Llama 3.1 8B",
    "provider": "groq",
    "api_key": null,
    "base_url": null,
    "active": true,
    "free": true,
    "notes": "Fast and efficient, free on Groq"
  },
  {
    "id": "groq/llama-3.3-70b-versatile",
    "name": "Llama 3.3 70B",
    "provider": "groq",
    "api_key": null,
    "base_url": null,
    "active": true,
    "free": true,
    "notes": "More powerful, still free"
  }
]
```

---

### 5.4 API Routes: `airvo/api/routes.py`

**Responsibility:** All HTTP endpoints

**Main endpoints:**

#### OpenAI Compatible (Continue.dev)

```
POST   /v1/chat/completions    ← Main endpoint (streaming)
GET    /v1/models              ← List models
```

#### CRUD Models

```
GET    /api/models             ← List all
POST   /api/models             ← Add new
PATCH  /api/models/{id}        ← Update
DELETE /api/models/{id}        ← Delete
PATCH  /api/models/{id}/toggle ← Activate/deactivate
```

#### Preferences

```
GET    /api/prefs              ← Get prefs
PATCH  /api/prefs              ← Update prefs
```

#### Statistics

```
GET    /api/stats              ← Get stats
DELETE /api/stats              ← Reset stats
```

#### Health

```
GET    /api/health             ← Health check
```

**Main endpoint: `/v1/chat/completions`**

```python
@router.post("/v1/chat/completions")
async def chat_completions(request: ChatRequest):
    """
    OpenAI-compatible endpoint
    Used by Continue.dev in VS Code
    """
    # 1. Build system prompt
    system_content = "You are an expert software development assistant."
    memory = settings.get_memory_prompt()
    if memory:
        system_content += f"\n\n## Project Context\n{memory}"
    
    messages = inject_system_message(request.messages, system_content)
    
    # 2. Get active models
    active = settings.get_active_models()
    
    # 3. Execute (single or multi-model)
    if len(active) == 1:
        # Single model → direct streaming
        response = await litellm.acompletion(
            model=active[0]["id"],
            messages=messages,
            stream=True,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            api_key=active[0].get("api_key"),
            api_base=active[0].get("base_url")
        )
        return StreamingResponse(single_stream(response), ...)
    else:
        # Multi-model → asyncio.gather() parallel
        results = await asyncio.gather(
            *[call_model(m, messages, request) for m in active]
        )
        return StreamingResponse(multi_stream(results), ...)

async def call_model(model: dict, messages: list, request):
    """Call a single model"""
    try:
        response = await litellm.acompletion(
            model=model["id"],
            messages=messages,
            stream=False,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            api_key=model.get("api_key"),
            api_base=model.get("base_url")
        )
        
        # Record statistics
        tokens = response.usage.total_tokens
        settings.record_usage(model["id"], tokens)
        
        return {
            "model": model["id"],
            "content": response.choices[0].message.content,
            "error": None,
            "tokens": tokens
        }
    except Exception as e:
        return {
            "model": model["id"],
            "content": None,
            "error": str(e),
            "tokens": 0
        }
```

**Why this approach?**

```python
# ✅ Single model: direct streaming to client (no waiting)
if len(active) == 1:
    return StreamingResponse(response)

# ✅ Multi-model: asyncio.gather() for parallelization
results = await asyncio.gather(
    call_model(model1),    # Starts
    call_model(model2)     # Simultaneously
)
# Waits for BOTH (not sequential)

# ✅ Tracking: record tokens for statistics
settings.record_usage(model_id, tokens)
```

---

### 5.5 Dashboard: `dashboard/src/App.jsx`

**Responsibility:** Visual interface for managing Airvo

**Structure:**

```
AirvoDashboard (850 lines)
├── Header (logo, language, status)
├── Sidebar (navigation)
└── MainContent (5 pages)
    ├── Models       (CRUD, toggle, API keys)
    ├── Status       (health check, continue.dev detection)
    ├── Config       (mode, temperature, memory, statistics)
    ├── AddModel     (form for adding models)
    └── Help         (documentation)
```

**Features:**

```javascript
// 1. Fetch data from backend
const [models, setModels] = useState([])
useEffect(() => {
  fetch(`${API}/api/models`)
    .then(r => r.json())
    .then(d => setModels(d.models))
}, [])

// 2. CRUD operations
async function addModel(data) {
  const res = await fetch(`${API}/api/models`, {
    method: "POST",
    body: JSON.stringify(data)
  })
  if (res.ok) toast("Model added ✓", "success")
}

async function updateModel(id, updates) {
  await fetch(`${API}/api/models/${id}`, {
    method: "PATCH",
    body: JSON.stringify(updates)
  })
}

async function deleteModel(id) {
  await fetch(`${API}/api/models/${id}`, {
    method: "DELETE"
  })
}

async function toggleModel(id, active) {
  await fetch(`${API}/api/models/${id}/toggle?active=${active}`, {
    method: "PATCH"
  })
}

// 3. Support for 7 languages
const [language, setLanguage] = useState(
  localStorage.getItem("lang") || "en"
)
useEffect(() => {
  localStorage.setItem("lang", language)
}, [language])

// 4. Native dark theme
const [darkMode, setDarkMode] = useState(true)
```

**Supported languages:**

- 🇬🇧 English
- 🇪🇸 Spanish
- 🇫🇷 French
- 🇩🇪 German
- 🇵🇹 Portuguese
- 🇯🇵 Japanese
- 🇨🇳 Chinese

---

## 6. Data Flows

### 6.1 Flow: User starts Airvo for the first time

```
$ pip install airvo
$ airvo start

┌─────────────────────────────────────────────────────────────────┐
│ 1️⃣  CLI: ensure_models_config()                               │
│     └─ Create ~/.airvo/models.json with 2 Groq models default  │
│                                                                 │
│ 2️⃣  CLI: ensure_continue_config()                             │
│     └─ Create ~/.continue/config.yaml                          │
│     └─ Auto-configure Airvo as model in continue.dev           │
│     └─ Detect continue.dev in VS Code                          │
│                                                                 │
│ 3️⃣  CLI: detect_continue_dev()                                │
│     └─ Search in extension directories                         │
│     └─ Windows: AppData/Roaming/Code/User/extensions           │
│     └─ macOS:   Library/Application Support/Code/User/...      │
│     └─ Linux:   .config/Code/User/extensions                   │
│     └─ Return True if found "continue.*"                       │
│                                                                 │
│ 4️⃣  CLI: print_banner()                                       │
│     └─ ASCII art with server URL                               │
│                                                                 │
│ 5️⃣  CLI: open_browser_delayed(1.5s)                           │
│     └─ Background thread waits 1.5s                            │
│     └─ Opens http://localhost:8765                             │
│                                                                 │
│ 6️⃣  CLI: uvicorn.run()                                        │
│     └─ Start FastAPI server                                    │
│     └─ Port: 8765                                              │
│                                                                 │
│ 7️⃣  Browser: Dashboard loads                                  │
│     └─ React compiles in development                           │
│     └─ Shows 2 active models (Groq)                            │
│     └─ API keys empty (not saved)                              │
│     └─ Status: ⚠ Requires Groq API key                         │
│                                                                 │
│ 8️⃣  User: Gets API key from Groq (free)                       │
│     └─ console.groq.com                                        │
│     └─ Copies key (gsk_...)                                    │
│                                                                 │
│ 9️⃣  User: Pastes key in dashboard                             │
│     └─ Click [Save]                                            │
│     └─ PATCH /api/models/{id}                                  │
│     └─ settings.update_model("groq/...", {"api_key": "..."})   │
│     └─ JSON write to ~/.airvo/models.json                      │
│     └─ Toast: ✓ API key saved                                  │
│                                                                 │
│ 🔟  Continue.dev: Already auto-configured                      │
│     └─ ~/.continue/config.yaml has Airvo                       │
│     └─ VS Code can press Ctrl+L                                │
│                                                                 │
│ Total time: ~30 seconds                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

### 6.2 Flow: User asks a question in VS Code

```
┌─────────────────────────────────────────────────────────────┐
│ VS Code + Continue.dev                                      │
│                                                             │
│ User: Presses Ctrl+L                                       │
│ User: Types "Create email validation function"             │
│                                                             │
│ Continue.dev builds request:                               │
│ POST /v1/chat/completions                                 │
│ {                                                          │
│   "model": "airvo-auto",                                 │
│   "messages": [{                                          │
│     "role": "user",                                       │
│     "content": "Create email validation..."               │
│   }],                                                      │
│   "stream": true,                                         │
│   "temperature": 0.7,                                     │
│   "max_tokens": 4096                                      │
│ }                                                          │
└────────────────────┬──────────────────────────────────────┘
                     │ HTTP POST (streaming)
                     ▼
        ┌────────────────────────────┐
        │ Airvo: /v1/chat/completions │
        │                             │
        │ 1. Receive request          │
        │ 2. system_prompt += context │
        │ 3. get_active_models()      │
        │    → 2 models               │
        │ 4. asyncio.gather():        │
        │    - groq/llama-3.1-8b      │
        │    - groq/llama-3.3-70b     │
        │    (Parallel, simultaneous) │
        │ 5. Wait for BOTH responses  │
        │ 6. Combine into SSE         │
        │ 7. Record stats             │
        │ 8. Return stream            │
        └────────────────┬────────────┘
                         │ HTTP Response (SSE)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ Continue.dev receives stream                                │
│                                                             │
│ Shows 2 responses side by side:                            │
│                                                             │
│ 🔵 Llama 3.1 8B:                                           │
│ def validate_email(email):                                │
│     import re                                             │
│     return bool(re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$'...)) │
│                                                             │
│ 🟢 Llama 3.3 70B:                                          │
│ def validate_email(email: str) -> bool:                   │
│     """Validates an email with regex"""                   │
│     import re                                             │
│     pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'                │
│     return bool(re.match(pattern, email))                │
│                                                             │
│ User: Selects the best → [Apply to file]                  │
│ Code inserted in file.py                                  │
└─────────────────────────────────────────────────────────────┘
```

**Timeline:**

```
T=0ms:     User presses Ctrl+L
T=50ms:    Continue.dev sends HTTP request
T=150ms:   Airvo receives, starts 2 LLMs (parallel)
T=1500ms:  First response arrives
T=2500ms:  Second response arrives
T=2600ms:  Combined and sent to frontend (SSE)
T=2700ms:  Continue.dev shows both options
T=3000ms:  User selects one and applies
```

**Why asyncio.gather()?**

```python
# Without asyncio (sequential):
# T=0s: model 1 starts → T=1s ends
# T=1s: model 2 starts → T=2s ends
# TOTAL: 2 seconds

# With asyncio.gather() (parallel):
# T=0s: both start (simultaneously)
# T=1s: both end
# TOTAL: 1 second ✅ 2x faster
```

---

### 6.3 Flow: Save API key

```
┌─ Dashboard ────────────────────────┐
│ Model Card: Llama 3.3 70B          │
│                                    │
│ [Input: Paste API key here]        │
│ gsk_abc123...                      │
│                                    │
│ [Save] [Delete]                    │
│  ▲                                 │
│  └─ Click Save                     │
└────────────────┬────────────────────┘
                 │
      fetch("/api/models/{id}",
        {method: "PATCH",
         body: JSON.stringify({
           api_key: "gsk_abc123..."
         })}
      )
                 │
     ┌───────────▼────────────┐
     │ Airvo: PATCH /api/...  │
     │                        │
     │ 1. Receive JSON        │
     │ 2. Validate (not-empty)│
     │ 3. settings.update()   │
     │ 4. Update memory       │
     │ 5. save_models()       │
     │ 6. JSON write          │
     │ 7. Return {ok: true}   │
     └───────────┬────────────┘
                 │
     ~/.airvo/models.json
     (file updated on disk)
                 │
     ┌───────────▼────────────┐
     │ Dashboard toast:       │
     │ ✓ API key saved        │
     │ (green, 3 seconds)     │
     └────────────────────────┘
```

**Security:**

- ✅ API key stored LOCALLY in `~/.airvo/models.json`
- ✅ NEVER sent to cloud
- ✅ NEVER logged
- ✅ Used only to connect to Groq/OpenAI/etc.

---

## 7. Database and Persistence

### 7.1 Location

```
~/.airvo/
├── models.json      ← List of models + API keys
├── prefs.json       ← User preferences
└── stats.json       ← Usage statistics
```

### 7.2 Schema: models.json

```json
[
  {
    "id": "groq/llama-3.3-70b-versatile",
    "name": "Llama 3.3 70B",
    "provider": "groq",
    "api_key": "gsk_abc123...",
    "base_url": null,
    "active": true,
    "free": true,
    "notes": "More powerful, still free"
  },
  {
    "id": "ollama/llama2",
    "name": "Llama2 Local",
    "provider": "ollama",
    "api_key": null,
    "base_url": "http://localhost:11434",
    "active": false,
    "free": true,
    "notes": "100% offline"
  }
]
```

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (provider/model) |
| `name` | string | Friendly name in dashboard |
| `provider` | string | groq, openai, anthropic, ollama, lmstudio |
| `api_key` | string | Authentication token (null for local) |
| `base_url` | string | Server URL (null for cloud) |
| `active` | boolean | Is it enabled? |
| `free` | boolean | Is it free? |
| `notes` | string | User notes |

### 7.3 Schema: prefs.json

```json
{
  "mode": "parallel",
  "temperature": 0.7,
  "max_tokens": 4096,
  "memory_enabled": true,
  "memory_text": "I work with FastAPI and Python 3.12.\nAlways use async/await and type hints."
}
```

### 7.4 Schema: stats.json

```json
{
  "groq/llama-3.1-8b-instant": {
    "requests": 150,
    "tokens": 45230
  },
  "groq/llama-3.3-70b-versatile": {
    "requests": 98,
    "tokens": 78920
  }
}
```

### 7.5 Why JSON and not SQL?

| Aspect | JSON | SQL |
|--------|------|-----|
| **Setup** | 0 lines | 50+ lines |
| **Dependencies** | 0 | 1+ (driver) |
| **Portability** | ✅ Maximum | ~ Requires setup |
| **Locality** | ✅ 100% local | ~ Can be remote |
| **Readability** | ✅ Human | ✗ Binary |

**Decision: JSON is ideal because:**

1. Small data (< 1MB)
2. Single user (not multi-user web app)
3. Simple structure (arrays + objects)
4. No complex transactions
5. User can manually edit if needed

---

## 8. API Endpoints

### 8.1 OpenAI Compatible

#### `POST /v1/chat/completions`

Compatible with Continue.dev

**Request:**

```json
{
  "model": "airvo-auto",
  "messages": [{"role": "user", "content": "Hello"}],
  "stream": true,
  "temperature": 0.7,
  "max_tokens": 4096
}
```

**Response (Streaming SSE):**

```
data: {"choices":[{"delta":{"content":"I"}}]}
data: {"choices":[{"delta":{"content":"'m"}}]}
data: [DONE]
```

#### `GET /v1/models`

OpenAI compatible models list

**Response:**

```json
{
  "object": "list",
  "data": [
    {"id": "airvo-auto", "object": "model"}
  ]
}
```

---

### 8.2 Dashboard API

#### `GET /api/models`

Get all models

**Response:**

```json
{
  "models": [
    {
      "id": "groq/llama-3.3-70b-versatile",
      "name": "Llama 3.3 70B",
      "provider": "groq",
      "api_key": "gsk_...",
      "active": true
    }
  ]
}
```

#### `POST /api/models`

Add new model

**Request:**

```json
{
  "id": "openai/gpt-4o",
  "name": "GPT-4o",
  "provider": "openai",
  "api_key": "sk_live_...",
  "active": false
}
```

#### `PATCH /api/models/{model_id}`

Update model

**Request:**

```json
{
  "api_key": "gsk_new_key",
  "notes": "Updated notes"
}
```

#### `DELETE /api/models/{model_id}`

Delete model

#### `PATCH /api/models/{model_id}/toggle?active=true`

Activate/deactivate model

#### `GET /api/prefs`

Get preferences

**Response:**

```json
{
  "mode": "parallel",
  "temperature": 0.7,
  "max_tokens": 4096,
  "memory_enabled": true
}
```

#### `PATCH /api/prefs`

Update preferences

**Request:**

```json
{
  "temperature": 0.9,
  "memory_text": "..."
}
```

#### `GET /api/stats`

Get statistics

#### `DELETE /api/stats`

Reset statistics

#### `GET /api/health`

Health check

**Response:**

```json
{
  "status": "ok",
  "server": "running",
  "dashboard": "ok"
}
```

---

## 9. Design Decisions

### Decision 1: JSON instead of SQL

**Reason:**
- Small data (< 1MB typically)
- Single user (local tool)
- Simple structure (arrays + objects)
- No complex transactions

**Benefit:**
- Zero external dependencies
- Maximum portability
- User can manually edit
- Simple backup (copy file)

```python
# Changing providers is easy
models = json.load(models_file)
# ✅ Add local model
models.append({"id": "ollama/llama2", ...})
json.dump(models, models_file)
```

---

### Decision 2: FastAPI instead of Flask/Django

**Reason:**
- Native async/await (streaming)
- Type hints (safety)
- Auto-documentation
- Native SSE streaming

**Benefit:**
- Better performance (concurrent requests)
- More maintainable code
- Easy LiteLLM integration

```python
# Real-time streaming
@app.post("/v1/chat/completions")
async def chat(request):
    return StreamingResponse(stream_response(), media_type="text/event-stream")
```

---

### Decision 3: React instead of HTML/Templates

**Reason:**
- Interactive UI (smooth CRUD)
- Reactive state
- Component reusability
- Faster development

**Benefit:**
- Modern dashboard
- Better user experience
- Easy to maintain and extend

```javascript
// Automatic reactive state
const [models, setModels] = useState([])
// UI automatically updates when setModels() is called
```

---

### Decision 4: asyncio.gather() for multi-model

**Reason:**
- True parallelization in Python
- Waits for BOTH responses simultaneously
- Efficient (not sequential)

**Benefit:**
- 2 models in ~1s (vs 2s sequential)
- User sees both options quickly

```python
# Parallel
results = await asyncio.gather(
    call_model(model1),    # Starts
    call_model(model2)     # Simultaneously
)
# Waits for BOTH (not one by one)
```

---

### Decision 5: LiteLLM instead of manual integration

**Reason:**
- Abstraction of 100+ providers
- Unified API
- Automatic fallback
- Simplified maintenance

**Benefit:**
- Add new provider = 1 line
- No code duplication

```python
# Same code for any provider
response = await litellm.acompletion(
    model="groq/llama-3.3-70b",  # ← Change here
    messages=messages
)

# vs

response = await litellm.acompletion(
    model="openai/gpt-4o",  # ← Just change string
    messages=messages
)
```

---

### Decision 6: Auto-configure continue.dev

**Reason:**
- Reduces friction (zero manual config)
- Automatic VS Code detection
- Better user experience

**Benefit:**
- `airvo start` → automatically works in VS Code
- No manual steps in `~/.continue/config.yaml`

```python
# Auto-setup
ensure_continue_config()  # Creates config.yaml
detect_continue_dev()     # Detects extension
```

---

## Executive Summary

### By the numbers

| Metric | Value |
|--------|-------|
| Backend | ~600 lines Python |
| Frontend | ~850 lines React |
| API Routes | 12+ endpoints |
| Default Models | 2 (Groq free) |
| Supported Providers | 100+ (via LiteLLM) |
| Languages | 7 |
| Python Dependencies | < 10 |
| npm Dependencies | < 15 |
| dist/ Size | < 200KB |

### Capabilities

| Capability | Support |
|-----------|---------|
| Single model streaming | ✅ |
| Multi-model parallel | ✅ |
| Local models (offline) | ✅ |
| Cloud models (paid) | ✅ |
| Real-time streaming | ✅ |
| Local API keys | ✅ |
| Web dashboard | ✅ |
| Continue.dev integration | ✅ |
| Auto-configuration | ✅ |
| Usage statistics | ✅ |

### Key advantages

```
✅ No lock-in       → Easy to switch providers
✅ Local-first      → API keys on your PC
✅ Free             → Groq models at no cost
✅ Offline          → Works without internet (Ollama)
✅ Observable       → Dashboard + statistics
✅ Compatible       → OpenAI API standard
✅ Simple           → 30 seconds to configure
```

---

## Contributing

To understand the codebase better, refer to:

- [`README.md`](../README.md) - Quick start guide
- [`docs/DEVELOPMENT.md`](./DEVELOPMENT.md) - Development setup
- [`docs/API.md`](./API.md) - Endpoint documentation
- [`tests/`](../tests/) - Test examples

---

**Last Updated:** March 13, 2026  
**Version:** 0.1.0  
**Status:** ✅ Documentation Complete