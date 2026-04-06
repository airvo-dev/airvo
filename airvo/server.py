import os
from pathlib import Path
from importlib.metadata import version as _pkg_version
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from airvo.api.routes import router

# ── Request size limit (10 MB max) ────────────────────────────────────────
MAX_REQUEST_SIZE = 10 * 1024 * 1024  # 10 MB

_VERSION = _pkg_version("airvo")

# ── FastAPI app ────────────────────────────────────────────────────────────
app = FastAPI(
    title="Airvo",
    version=_VERSION,
    description=(
        "**Your AI. Your Rules.** — Local AI coding copilot that routes to any provider.\n\n"
        "## Quick Start\n"
        "```bash\n"
        "pip install airvo\n"
        "airvo start\n"
        "```\n\n"
        "## Key Features\n"
        "- **OpenAI-compatible** — works with continue.dev, Cursor, and any OpenAI client\n"
        "- **Multi-model modes** — Parallel, Race, Vote, Review\n"
        "- **RAG** — index your codebase and inject relevant context automatically\n"
        "- **TPM Guard** — automatic rate-limit protection for free-tier providers\n"
        "- **Hardware Monitor** — RAM/GPU/Ollama status and smart suggestions\n"
        "- **Model Discovery** — browse Ollama catalog and OpenRouter models\n\n"
        "## Authentication\n"
        "No API key needed for the Airvo server itself. "
        "Provider API keys are configured per-model in the dashboard or via `/api/models`.\n\n"
        "## Dashboard\n"
        "Open the root URL (`/`) in a browser to access the React dashboard."
    ),
    openapi_tags=[
        {"name": "Chat", "description": "OpenAI-compatible chat completion endpoint. Connect any IDE or client that speaks the OpenAI protocol."},
        {"name": "Models", "description": "CRUD operations for model configurations. Manage providers, API keys, and active/inactive status."},
        {"name": "Preferences", "description": "User preferences: mode (parallel/race/vote/review), temperature, max tokens, RAG settings, memory."},
        {"name": "Stats", "description": "Per-model usage statistics — request counts and token usage."},
        {"name": "Health", "description": "Server health check and diagnostics."},
        {"name": "RAG", "description": "Retrieval-Augmented Generation — index your codebase and inject relevant code into every chat request."},
        {"name": "Hardware", "description": "System monitoring — RAM, GPU/VRAM, Ollama loaded models, and memory pressure suggestions."},
        {"name": "Discovery", "description": "Find and add new models — browse the curated Ollama catalog or OpenRouter's model library."},
    ],
)

# ── Request size limit middleware ───────────────────────────────────────
@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_REQUEST_SIZE:
        return JSONResponse(
            status_code=413,
            content={"detail": "Request too large. Maximum size is 10 MB."}
        )
    return await call_next(request)

# ── CORS — needed for dashboard in development mode ───────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"(vscode-webview://.*|http://localhost:\d+|http://127\.0\.0\.1:\d+)",
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

# ── API routes — registered BEFORE static files ───────────────────────────
app.include_router(router)

# ── Static files — serve compiled React dashboard ─────────────────────────
# Check package dist/ first (production), then cwd/dashboard/dist (dev)
_package_dist = Path(__file__).parent / "dashboard" / "dist"
_dev_dist     = Path.cwd() / "dashboard" / "dist"
_dist         = _package_dist if _package_dist.exists() else _dev_dist

if _dist.exists():
    # Serve JS/CSS assets
    _assets = _dist / "assets"
    if _assets.exists():
        app.mount("/assets", StaticFiles(directory=str(_assets)), name="assets")

    @app.get("/")
    async def serve_dashboard():
        """Serve the React dashboard index"""
        return FileResponse(str(_dist / "index.html"))

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """
        Catch-all route — serve static files if they exist,
        otherwise fall back to index.html for React client-side routing.
        Path traversal protection: resolved path must stay within _dist.
        """
        try:
            file_path = (_dist / full_path).resolve()
            dist_resolved = _dist.resolve()
            # Block path traversal attacks
            if not str(file_path).startswith(str(dist_resolved)):
                return FileResponse(str(_dist / "index.html"))
            if file_path.exists() and file_path.is_file():
                return FileResponse(str(file_path))
        except Exception:
            pass
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
