from typing import List, Optional
import logging
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from airvo.config.settings import settings

router = APIRouter()
logger = logging.getLogger(__name__)


class RagIndexRequest(BaseModel):
    path: Optional[str] = None
    max_index_mb: Optional[int] = None
    max_file_kb: Optional[int] = None
    extensions: Optional[List[str]] = None
    exclude_dirs: Optional[List[str]] = None


@router.get("/api/rag/status", tags=["RAG"], summary="RAG index status",
    description="Returns current index statistics and whether RAG dependencies (chromadb, sentence-transformers) are installed. Install with: `pip install airvo[rag]`.")
async def rag_status():
    try:
        from airvo.rag.indexer import is_rag_available, get_index_stats
        available = is_rag_available()
        if not available:
            return {
                "available": False,
                "files_indexed": 0,
                "chunks_total": 0,
                "index_size_mb": 0.0,
                "last_indexed": "",
            }
        stats = get_index_stats()
        prefs = settings.get_prefs()
        return {
            "available": True,
            "rag_enabled": prefs.get("rag_enabled", False),
            "rag_path": prefs.get("rag_path", ""),
            "files_indexed": stats.files_indexed,
            "chunks_total": stats.chunks_total,
            "index_size_mb": stats.index_size_mb,
            "last_indexed": stats.last_indexed,
        }
    except Exception:
        logger.exception("Failed to fetch RAG status")
        raise HTTPException(status_code=500, detail="Failed to fetch RAG status")


@router.post("/api/rag/index", tags=["RAG"], summary="Index a directory",
    description="Trigger indexing of a codebase directory. Walks the directory recursively, chunks text files, generates embeddings, and stores them in a local ChromaDB collection. Can take 10-60 seconds depending on project size.")
async def rag_index(req: RagIndexRequest):
    try:
        from airvo.rag.indexer import is_rag_available, index_directory

        if not is_rag_available():
            raise HTTPException(
                status_code=503,
                detail="RAG dependencies not installed. Run: pip install airvo[rag]"
            )

        prefs = settings.get_prefs()
        path = (req.path or prefs.get("rag_path", "")).strip()

        if not path:
            raise HTTPException(
                status_code=400,
                detail="No directory configured. Set rag_path in preferences first."
            )

        workspace_root = Path.cwd().resolve()
        candidate_path = Path(path)
        if candidate_path.is_absolute():
            raise HTTPException(
                status_code=400,
                detail="RAG path must be a relative path inside the current workspace.",
            )

        if ".." in candidate_path.parts:
            raise HTTPException(
                status_code=400,
                detail="RAG path cannot traverse parent directories.",
            )

        resolved_path = (workspace_root / candidate_path).resolve(strict=False)
        try:
            resolved_path.relative_to(workspace_root)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="RAG path must be inside the current workspace."
            )

        stats = index_directory(
            path=str(resolved_path),
            extensions=req.extensions or prefs.get("rag_extensions"),
            exclude_dirs=req.exclude_dirs or prefs.get("rag_exclude_dirs"),
            max_file_kb=req.max_file_kb or prefs.get("rag_max_file_kb", 500),
            max_index_mb=req.max_index_mb or prefs.get("rag_max_index_mb", 200),
        )

        return {
            "ok": True,
            "files_indexed": stats.files_indexed,
            "chunks_total": stats.chunks_total,
            "index_size_mb": stats.index_size_mb,
            "last_indexed": stats.last_indexed,
            "errors": stats.errors,
        }

    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to index RAG directory")
        raise HTTPException(status_code=500, detail="Failed to index RAG directory")


@router.delete("/api/rag/reset", tags=["RAG"], summary="Reset RAG index",
    description="Wipe the entire ChromaDB collection - all embeddings and metadata are deleted. You'll need to re-index afterwards.")
async def rag_reset():
    try:
        from airvo.rag.indexer import clear_index
        clear_index()
        return {"ok": True}
    except Exception:
        logger.exception("Failed to reset RAG index")
        raise HTTPException(status_code=500, detail="Failed to reset RAG index")
