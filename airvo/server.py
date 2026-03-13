import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from airvo.api.routes import router

# ── FastAPI app ────────────────────────────────────────────────────────────
app = FastAPI(
    title="Airvo",
    version="0.1.0",
    description="Local AI coding copilot — any model, any provider.",
)

# ── CORS — needed for dashboard in development mode ───────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
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
