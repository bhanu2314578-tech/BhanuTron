from typing import Any

from services.embedder import embed_text
from services.supabase_client import get_supabase


def insert_chunks(
    *,
    user_id: str,
    document_id: str,
    chunks: list[dict[str, Any]],
) -> None:
    if not chunks:
        return

    texts = [chunk["content"] for chunk in chunks]
    from services.embedder import embed_texts as generate_embeddings

    embeddings = generate_embeddings(texts)

    rows = []
    for chunk, embedding in zip(chunks, embeddings):
        rows.append(
            {
                "document_id": document_id,
                "user_id": user_id,
                "content": chunk["content"],
                "page_number": chunk.get("page_number"),
                "section": chunk.get("section"),
                "chunk_index": chunk["chunk_index"],
                "embedding": embedding,
            }
        )

    supabase = get_supabase()
    supabase.table("document_chunks").insert(rows).execute()


def search_similar_chunks(
    *,
    user_id: str,
    query: str,
    document_id: str | None = None,
    match_count: int = 5,
) -> list[dict[str, Any]]:
    supabase = get_supabase()
    query_embedding = embed_text(query)

    params: dict[str, Any] = {
        "query_embedding": query_embedding,
        "match_count": match_count,
        "filter_user_id": user_id,
    }
    if document_id:
        params["filter_document_id"] = document_id

    response = supabase.rpc("match_document_chunks", params).execute()
    return response.data or []


def delete_document_chunks(document_id: str) -> None:
    supabase = get_supabase()
    supabase.table("document_chunks").delete().eq("document_id", document_id).execute()
