"""
airvo/rag/retriever.py
──────────────────────
Given a natural-language query, returns the most semantically relevant
code/text chunks from the local ChromaDB index.

Public API
──────────
    retrieve(query, top_k=5)   → List[RetrievedChunk]
    format_context(chunks)     → str   (ready to inject into system prompt)
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import List

logger = logging.getLogger(__name__)


@dataclass
class RetrievedChunk:
    file:     str          # relative path of the source file
    chunk_id: int          # chunk index within that file
    text:     str          # the actual text content
    score:    float        # cosine similarity (0–1, higher = more relevant)


def retrieve(query: str, top_k: int = 5) -> List[RetrievedChunk]:
    """
    Embed *query* and find the *top_k* most relevant chunks in the index.

    Returns an empty list if:
    - RAG dependencies are not installed
    - The index is empty
    - Any error occurs (logged as a warning, never raises)
    """
    from airvo.rag.indexer import is_rag_available, _get_collection

    if not is_rag_available():
        return []

    if not query or not query.strip():
        return []

    try:
        collection, embedder = _get_collection()

        if collection.count() == 0:
            return []

        query_embedding = embedder.encode([query.strip()]).tolist()

        results = collection.query(
            query_embeddings=query_embedding,
            n_results=min(top_k, collection.count()),
            include=["documents", "metadatas", "distances"],
        )

        chunks: List[RetrievedChunk] = []
        docs      = results.get("documents",  [[]])[0]
        metas     = results.get("metadatas",  [[]])[0]
        distances = results.get("distances",  [[]])[0]

        for doc, meta, dist in zip(docs, metas, distances):
            # ChromaDB returns cosine *distance* (0 = identical, 2 = opposite).
            # Convert to similarity score in [0, 1].
            score = round(max(0.0, 1.0 - dist / 2.0), 4)
            chunks.append(
                RetrievedChunk(
                    file=meta.get("file", "unknown"),
                    chunk_id=int(meta.get("chunk", 0)),
                    text=doc,
                    score=score,
                )
            )

        # Sort by descending similarity just in case ChromaDB returns unsorted
        chunks.sort(key=lambda c: c.score, reverse=True)
        return chunks

    except Exception as exc:
        logger.warning(f"[RAG] retrieve() error: {exc}")
        return []


def format_context(chunks: List[RetrievedChunk]) -> str:
    """
    Format retrieved chunks as a clean markdown block suitable for injection
    into the system prompt:

        ## Relevant Code (from your codebase)
        ### src/utils.py
        ```
        <chunk text>
        ```
        (relevance: 0.87)
    """
    if not chunks:
        return ""

    lines = ["## Relevant Code (from your codebase)\n"]
    for chunk in chunks:
        lines.append(f"### {chunk.file}")
        lines.append("```")
        lines.append(chunk.text.strip())
        lines.append("```")
        lines.append(f"*(relevance: {chunk.score:.2f})*\n")

    return "\n".join(lines)
