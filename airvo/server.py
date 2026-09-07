import os
import json
import logging
import time
import uuid
from pathlib import Path
from importlib.metadata import version as _pkg_version
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, Response

from airvo.api.routes import router
from airvo.api.common import OpsMetricsCollector, SlidingWindowRateLimiter, build_http_error_payload, get_request_id
from airvo.observability import get_prometheus_metrics_payload, init_external_observability, record_http_metrics

# ── Request size limit (10 MB max) ────────────────────────────────────────
MAX_REQUEST_SIZE = 10 * 1024 * 1024  # 10 MB
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("AIRVO_RATE_LIMIT_WINDOW_SECONDS", "60"))
RATE_LIMIT_DEFAULT_PER_WINDOW = int(os.getenv("AIRVO_RATE_LIMIT_DEFAULT_PER_WINDOW", "120"))
RATE_LIMIT_STREAM_PER_WINDOW = int(os.getenv("AIRVO_RATE_LIMIT_STREAM_PER_WINDOW", "40"))
OPS_METRICS_MAX_SAMPLES = int(os.getenv("AIRVO_OPS_METRICS_MAX_SAMPLES", "1000"))
ADMIN_TOKEN = os.getenv("AIRVO_ADMIN_TOKEN", "").strip()

_VERSION = _pkg_version("airvo")
logger = logging.getLogger(__name__)
_rate_limiter = SlidingWindowRateLimiter()
_ops_metrics = OpsMetricsCollector(max_samples_per_endpoint=OPS_METRICS_MAX_SAMPLES)

_ADMIN_PROTECTED_PATH_PREFIXES = (
    "/api/models",
    "/api/model-test",
    "/api/prefs",
    "/api/stats",
    "/api/rag/index",
    "/api/rag/reset",
    "/api/free-route",
    "/api/discovery/add",
    "/api/hardware/unload",
    "/api/cache",
    "/api/history",
)


def _requires_admin_token(method: str, path: str) -> bool:
    if method.upper() not in {"POST", "PATCH", "DELETE", "PUT"}:
        return False
    # Keep chat/stream operations open for normal runtime usage.
    if path in ("/v1/chat/completions", "/api/chat/stream", "/api/compare/stream", "/api/compare/run"):
        return False
    return any(path.startswith(prefix) for prefix in _ADMIN_PROTECTED_PATH_PREFIXES)


def _extract_admin_token(request: Request) -> str:
    auth_header = request.headers.get("authorization", "")
    if auth_header.lower().startswith("bearer "):
        return auth_header[7:].strip()
    return request.headers.get("x-airvo-token", "").strip()


def _client_ip(request: Request) -> str:
    forwarded_for = request.headers.get("x-forwarded-for", "").strip()
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


def _rate_limit_for_path(path: str) -> int:
    if path in ("/v1/chat/completions", "/api/chat/stream", "/api/compare/stream"):
        return RATE_LIMIT_STREAM_PER_WINDOW
    if path.startswith("/api/") or path.startswith("/v1/"):
        return RATE_LIMIT_DEFAULT_PER_WINDOW
    return 0

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
async def request_context_and_limits(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    request.state.request_id = request_id
    t0 = time.perf_counter()

    if ADMIN_TOKEN and _requires_admin_token(request.method, request.url.path):
        supplied_token = _extract_admin_token(request)
        if supplied_token != ADMIN_TOKEN:
            response = JSONResponse(
                status_code=401,
                content=build_http_error_payload(
                    status_code=401,
                    detail="Admin token required for this endpoint.",
                    request_id=request_id,
                ),
                headers={"WWW-Authenticate": "Bearer"},
            )
            response.headers["X-Request-ID"] = request_id
            logger.warning(
                json.dumps(
                    {
                        "event": "admin_auth_failed",
                        "request_id": request_id,
                        "method": request.method,
                        "path": request.url.path,
                        "client_ip": _client_ip(request),
                    }
                )
            )
            return response

    limit = _rate_limit_for_path(request.url.path)
    ip = _client_ip(request)
    allowed, retry_after = _rate_limiter.allow(
        key=f"{ip}:{request.url.path}",
        limit=limit,
        window_seconds=RATE_LIMIT_WINDOW_SECONDS,
    )
    if not allowed:
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
        _ops_metrics.record(
            method=request.method,
            path=request.url.path,
            status_code=429,
            elapsed_ms=elapsed_ms,
        )
        record_http_metrics(
            method=request.method,
            path=request.url.path,
            status_code=429,
            elapsed_ms=elapsed_ms,
        )
        response = JSONResponse(
            status_code=429,
            content=build_http_error_payload(
                status_code=429,
                detail="Rate limit exceeded. Please retry later.",
                request_id=request_id,
            ),
            headers={"Retry-After": str(retry_after)},
        )
        response.headers["X-Request-ID"] = request_id
        logger.warning(
            json.dumps(
                {
                    "event": "rate_limited",
                    "request_id": request_id,
                    "method": request.method,
                    "path": request.url.path,
                    "client_ip": ip,
                    "retry_after_s": retry_after,
                    "limit": limit,
                    "window_s": RATE_LIMIT_WINDOW_SECONDS,
                }
            )
        )
        return response

    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_REQUEST_SIZE:
        response = JSONResponse(
            status_code=413,
            content=build_http_error_payload(
                status_code=413,
                detail="Request too large. Maximum size is 10 MB.",
                request_id=request_id,
            ),
        )
    else:
        response = await call_next(request)

    response.headers["X-Request-ID"] = request_id
    elapsed_ms = round((time.perf_counter() - t0) * 1000, 2)
    _ops_metrics.record(
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        elapsed_ms=elapsed_ms,
    )
    record_http_metrics(
        method=request.method,
        path=request.url.path,
        status_code=response.status_code,
        elapsed_ms=elapsed_ms,
    )
    logger.info(
        json.dumps(
            {
                "event": "http_request",
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "elapsed_ms": elapsed_ms,
            }
        )
    )
    return response


@app.on_event("startup")
async def _init_obs() -> None:
    init_external_observability(app)


@app.get("/metrics", include_in_schema=False)
async def metrics():
    payload = get_prometheus_metrics_payload()
    if payload is None:
        return JSONResponse(
            status_code=503,
            content={
                "ok": False,
                "detail": "Prometheus exporter disabled or dependency missing. Install prometheus-client and set AIRVO_PROMETHEUS_ENABLED=1.",
            },
        )
    content, content_type = payload
    return Response(content=content, media_type=content_type)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    request_id = get_request_id(request)
    logger.warning(
        json.dumps(
            {
                "event": "http_error",
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "status_code": exc.status_code,
                "detail": exc.detail,
            }
        )
    )
    payload = build_http_error_payload(
        status_code=exc.status_code,
        detail=exc.detail,
        request_id=request_id,
    )
    return JSONResponse(status_code=exc.status_code, content=payload, headers={"X-Request-ID": request_id})


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = get_request_id(request)
    details = exc.errors()
    logger.warning(
        json.dumps(
            {
                "event": "validation_error",
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "errors": details,
            }
        )
    )
    payload = build_http_error_payload(
        status_code=422,
        detail={"message": "Validation failed", "errors": details},
        request_id=request_id,
    )
    return JSONResponse(status_code=422, content=payload, headers={"X-Request-ID": request_id})


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    request_id = get_request_id(request)
    logger.exception(
        json.dumps(
            {
                "event": "unhandled_error",
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "error": str(exc),
            }
        )
    )
    payload = build_http_error_payload(
        status_code=500,
        detail="Internal server error",
        request_id=request_id,
    )
    return JSONResponse(status_code=500, content=payload, headers={"X-Request-ID": request_id})

# ── CORS — needed for dashboard in development mode ───────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"(vscode-webview://.*|http://localhost:\d+|http://127\.0\.0\.1:\d+)",
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization", "X-Airvo-Token"],
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
            dist_resolved = _dist.resolve()
            file_path = (dist_resolved / full_path).resolve()
            # Block path traversal attacks using a path-aware boundary check.
            try:
                file_path.relative_to(dist_resolved)
            except ValueError:
                return FileResponse(str(_dist / "index.html"))
            if file_path.exists() and file_path.is_file():
                return FileResponse(str(file_path))
        except (OSError, RuntimeError, ValueError):
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
