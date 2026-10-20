from __future__ import annotations

from threading import Lock
from typing import TYPE_CHECKING, Any

from config import settings
from services.supabase_client import get_supabase

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer

_model: SentenceTransformer | None = None
_model_lock = Lock()


def _get_model() -> "SentenceTransformer":
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                from sentence_transformers import SentenceTransformer

                _model = SentenceTransformer(settings.embedding_model)
    return _model


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    embeddings = _get_model().encode(texts, normalize_embeddings=True)
    if embeddings.shape[1] != settings.embedding_dimension:
        raise RuntimeError(
            f"Embedding model dimension {embeddings.shape[1]} does not match "
            f"configured dimension {settings.embedding_dimension}"
        )
    return embeddings.tolist()


def insert_chunks(user_id: str, document_id: str, chunks: list[dict[str, Any]]) -> None:
    if not chunks:
        return
    embeddings = embed_texts([chunk["content"] for chunk in chunks])
    rows = [
        {
            **chunk,
            "user_id": user_id,
            "document_id": document_id,
            "embedding": embedding,
        }
        for chunk, embedding in zip(chunks, embeddings, strict=True)
    ]
    supabase = get_supabase()
    for offset in range(0, len(rows), 100):
        supabase.table("document_chunks").insert(rows[offset : offset + 100]).execute()


def search_chunks(
    user_id: str,
    question: str,
    document_id: str | None = None,
    limit: int = 5,
) -> list[dict[str, Any]]:
    query_embedding = embed_texts([question])[0]
    response = get_supabase().rpc(
        "match_document_chunks",
        {
            "query_embedding": query_embedding,
            "match_count": limit,
            "filter_user_id": user_id,
            "filter_document_id": document_id,
        },
    ).execute()
    return response.data or []


def delete_document_chunks(document_id: str, user_id: str) -> None:
    get_supabase().table("document_chunks").delete().eq(
        "document_id", document_id
    ).eq("user_id", user_id).execute()
