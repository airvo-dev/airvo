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
    description="Local AI coding copilot — any model, any provider.",
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
