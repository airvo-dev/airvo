"""
airvo/rag/indexer.py
────────────────────
Scans a directory, chunks text files, generates embeddings with
sentence-transformers (all-MiniLM-L6-v2) and stores them in a local
ChromaDB collection at ~/.airvo/rag/.

Public API
──────────
    index_directory(path, config) → IndexStats
    get_index_stats()             → IndexStats
    clear_index()                 → None
    is_rag_available()            → bool
"""

from __future__ import annotations

import hashlib
import logging
import os
import time
from dataclasses import dataclass, field
from typing import List, Optional

logger = logging.getLogger(__name__)

# ── Constants ────────────────────────────────────────────────────────────────
CHROMA_DIR     = os.path.join(os.path.expanduser("~"), ".airvo", "rag")
COLLECTION_NAME = "airvo_codebase"
EMBED_MODEL    = "all-MiniLM-L6-v2"

CHUNK_SIZE     = 400   # characters per chunk (≈ 100 tokens)
CHUNK_OVERLAP  = 80    # overlap to preserve context across chunk boundaries

# ── Lazy singletons (loaded only when RAG is actually used) ─────────────────
_chroma_client = None
_collection    = None
_embedder      = None


# ── Availability check ───────────────────────────────────────────────────────

def is_rag_available() -> bool:
    """Returns True only if both sentence-transformers and chromadb are installed."""
    try:
        import sentence_transformers  # noqa: F401
        import chromadb               # noqa: F401
        return True
    except ImportError:
        return False


def _allowed_roots() -> list[str]:
    """Return the allowed root directories for RAG indexing."""
    roots: list[str] = []
    env_value = os.getenv("AIRVO_RAG_ALLOWED_ROOTS", "").strip()
    if env_value:
        for item in env_value.split(os.pathsep):
            item = item.strip()
            if not item:
                continue
            try:
                expanded = os.path.expanduser(item)
                resolved = os.path.realpath(expanded)
                if os.path.isdir(resolved):
                    roots.append(resolved)
            except OSError:
                continue
    try:
        roots.append(os.path.realpath(os.getcwd()))
    except OSError:
        pass

    # Deduplicate while preserving order.
    unique: list[str] = []
    for root in roots:
        if root not in unique:
            unique.append(root)
    return unique


def _is_path_allowed(candidate: str, allowed_roots: list[str]) -> bool:
    for base in allowed_roots:
        try:
            if os.path.commonpath([base, candidate]) == base:
                return True
        except ValueError:
            continue
        except OSError:
            continue
    return False


# ── Internal helpers ─────────────────────────────────────────────────────────

def _get_collection():
    """Return (or initialise) the ChromaDB collection and sentence-transformer."""
    global _chroma_client, _collection, _embedder

    if _collection is not None and _embedder is not None:
        return _collection, _embedder

    import chromadb
    from sentence_transformers import SentenceTransformer

    os.makedirs(CHROMA_DIR, exist_ok=True)
    _chroma_client = chromadb.PersistentClient(path=CHROMA_DIR)
    _collection    = _chroma_client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},
    )

    logger.info(f"[RAG] Loading embedding model '{EMBED_MODEL}' …")
    _embedder = SentenceTransformer(EMBED_MODEL)
    logger.info("[RAG] Embedding model ready.")

    return _collection, _embedder


def _chunk_text(text: str) -> List[str]:
    """Split text into overlapping chunks of ~CHUNK_SIZE characters."""
    chunks = []
    start  = 0
    length = len(text)
    while start < length:
        end = start + CHUNK_SIZE
        chunks.append(text[start:end])
        start += CHUNK_SIZE - CHUNK_OVERLAP
    return [c.strip() for c in chunks if c.strip()]


# ── Public dataclass ─────────────────────────────────────────────────────────

@dataclass
class IndexStats:
    files_indexed:  int   = 0
    chunks_total:   int   = 0
    index_size_mb:  float = 0.0
    last_indexed:   str   = ""          # ISO-8601 timestamp
    errors:         List[str] = field(default_factory=list)


# ── Public functions ─────────────────────────────────────────────────────────

def index_directory(
    path: str,
    extensions:    Optional[List[str]] = None,
    exclude_dirs:  Optional[List[str]] = None,
    max_file_kb:   int  = 500,
    max_index_mb:  int  = 200,
) -> IndexStats:
    """
    Walk *path* recursively, chunk every matching text file and upsert
    embeddings into the local ChromaDB collection.

    Parameters
    ──────────
    path          : Root directory to index.
    extensions    : File extensions to include (default: common code/text).
    exclude_dirs  : Directory names to skip (default: node_modules, .git, …).
    max_file_kb   : Per-file size limit in KB (files larger than this are skipped).
    max_index_mb  : Total index size cap in MB (indexing stops once reached).
    """
    if not is_rag_available():
        raise RuntimeError(
            "RAG dependencies not installed. Run: pip install airvo[rag]"
        )

    # ── Defaults ────────────────────────────────────────────────────────────
    if extensions is None:
        extensions = [
            ".py", ".js", ".ts", ".jsx", ".tsx",
            ".md", ".go", ".rs", ".java", ".cpp", ".c",
            ".html", ".css", ".json", ".yaml", ".yml", ".toml",
            ".txt", ".sh", ".rb", ".php", ".swift", ".kt",
        ]
    if exclude_dirs is None:
        exclude_dirs = [
            "node_modules", ".git", "dist", "__pycache__",
            "venv", ".venv", "build", ".next", "coverage",
            ".tox", "eggs", "*.egg-info",
        ]

    ext_set      = {e.lower() for e in extensions}
    exclude_set  = {d.lower() for d in exclude_dirs}
    max_file_bytes = max_file_kb * 1024
    max_index_bytes = max_index_mb * 1024 * 1024

    collection, embedder = _get_collection()

    stats         = IndexStats()
    total_indexed = 0   # bytes of file content indexed so far

    normalized_input = os.path.normpath((path or "").strip())
    path_parts = normalized_input.split(os.sep)
    if (
        normalized_input in {"", ".", os.curdir}
        or os.path.isabs(normalized_input)
        or ".." in path_parts
    ):
        stats.errors.append("Invalid directory path: must be relative and stay within workspace.")
        return stats

    workspace_root = os.path.realpath(os.getcwd())
    try:
        root = os.path.realpath(os.path.join(workspace_root, normalized_input))
    except OSError:
        stats.errors.append(f"Directory not found: {path}")
        return stats

    # Canonical containment check: root must be workspace_root or a descendant.
    try:
        if os.path.commonpath([workspace_root, root]) != workspace_root:
            stats.errors.append("Invalid directory path: must stay within workspace.")
            return stats
    except ValueError:
        stats.errors.append("Invalid directory path: must stay within workspace.")
        return stats

    allowed_roots = _allowed_roots()

    if not os.path.isdir(root):
        stats.errors.append(f"Directory not found: {path}")
        return stats

    if not _is_path_allowed(root, allowed_roots):
        allowed_txt = ", ".join(str(p) for p in allowed_roots) or "<none>"
        stats.errors.append(
            f"Directory not allowed for indexing: {root}. Allowed roots: {allowed_txt}"
        )
        return stats

    logger.info(f"[RAG] Indexing '{root}' …")

    for dirpath, dirnames, filenames in os.walk(root, followlinks=False):
        # Prune excluded directories in-place so os.walk won't recurse into them
        dirnames[:] = [
            d for d in dirnames
            if d.lower() not in exclude_set
            and not d.endswith(".egg-info")
        ]

        safe_dirpath = os.path.realpath(dirpath)
        try:
            if os.path.commonpath([root, safe_dirpath]) != root:
                continue
        except ValueError:
            continue

        for filename in filenames:
            _, suffix = os.path.splitext(filename)
            suffix = suffix.lower()

            if suffix not in ext_set:
                continue

            try:
                candidate_file = os.path.realpath(os.path.join(safe_dirpath, filename))
                if os.path.commonpath([root, candidate_file]) != root:
                    continue
            except ValueError:
                continue
            except OSError:
                continue

            if not os.path.isfile(candidate_file):
                continue

            try:
                file_size = os.path.getsize(candidate_file)
            except OSError:
                continue

            if total_indexed + file_size > max_index_bytes:
                logger.info("[RAG] Index size cap reached, stopping early.")
                stats.errors.append(
                    f"Index cap ({max_index_mb} MB) reached — some files skipped."
                )
                _finalise_stats(stats)
                return stats

            if file_size == 0 or file_size > max_file_bytes:
                continue

            try:
                with open(candidate_file, "r", encoding="utf-8", errors="replace") as f:
                    text = f.read()
            except OSError:
                continue

            chunks     = _chunk_text(text)
            if not chunks:
                continue

            hasher = hashlib.sha1()
            try:
                with open(candidate_file, "rb") as f:
                    for block in iter(lambda: f.read(65536), b""):
                        hasher.update(block)
            except OSError:
                continue

            file_hash = hasher.hexdigest()[:16]
            rel_path = os.path.relpath(candidate_file, root)

            ids        = [f"{file_hash}_{i}" for i in range(len(chunks))]
            metadatas  = [{"file": rel_path, "chunk": i} for i in range(len(chunks))]

            try:
                embeddings = embedder.encode(chunks).tolist()
                collection.upsert(
                    ids=ids,
                    documents=chunks,
                    embeddings=embeddings,
                    metadatas=metadatas,
                )
                stats.files_indexed += 1
                stats.chunks_total  += len(chunks)
                total_indexed       += file_size
            except Exception as exc:
                msg = f"Error indexing {rel_path}: {exc}"
                logger.warning(f"[RAG] {msg}")
                stats.errors.append(msg)

    _finalise_stats(stats)
    logger.info(
        f"[RAG] Done — {stats.files_indexed} files, "
        f"{stats.chunks_total} chunks, {stats.index_size_mb:.1f} MB."
    )
    return stats


def _finalise_stats(stats: IndexStats):
    """Set index_size_mb and last_indexed timestamp."""
    stats.index_size_mb = _get_chroma_dir_size_mb()
    stats.last_indexed  = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _get_chroma_dir_size_mb() -> float:
    total = 0
    for dirpath, _, filenames in os.walk(CHROMA_DIR):
        for f in filenames:
            try:
                total += os.path.getsize(os.path.join(dirpath, f))
            except OSError:
                pass
    return round(total / (1024 * 1024), 2)


def get_index_stats() -> IndexStats:
    """
    Return the current state of the ChromaDB index without re-indexing.
    Counts are derived from the live collection + disk size.
    """
    stats = IndexStats(
        index_size_mb=_get_chroma_dir_size_mb(),
        last_indexed="",
    )
    if not is_rag_available():
        return stats

    try:
        collection, _ = _get_collection()
        count = collection.count()
        stats.chunks_total = count
        # files_indexed is an approximation from distinct metadata values
        all_meta = collection.get(include=["metadatas"])["metadatas"] or []
        stats.files_indexed = len({m.get("file") for m in all_meta if m})
    except Exception as exc:
        logger.warning(f"[RAG] Could not read index stats: {exc}")

    return stats


def clear_index() -> None:
    """Wipe the entire ChromaDB collection (all embeddings + metadata)."""
    global _collection

    if not is_rag_available():
        return

    try:
        client, _ = _get_collection()
        # Re-create resets the collection atomically
        _chroma_client.delete_collection(COLLECTION_NAME)
        _collection = _chroma_client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info("[RAG] Index cleared.")
    except Exception as exc:
        logger.warning(f"[RAG] clear_index error: {exc}")
