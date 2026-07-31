import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from config import settings
from routers.auth import AuthUser, get_current_user
from services.llm import estimate_tokens, stream_answer
from services.supabase_client import get_supabase
from services.vector_db import search_similar_chunks

router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    question: str
    conversationId: str | None = None
    documentId: str | None = None


class ChatSource(BaseModel):
    id: str
    document: str
    page: int
    section: str
    snippet: str


def _format_sse(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _serialize_sources(chunks: list[dict]) -> list[dict]:
    sources: list[dict] = []
    for chunk in chunks:
        sources.append(
            {
                "id": chunk.get("id") or chunk.get("chunk_id") or "",
                "document": chunk.get("document_name") or "Document",
                "page": chunk.get("page_number") or 0,
                "section": chunk.get("section") or "",
                "snippet": (chunk.get("content") or "")[:240],
            }
        )
    return sources


async def _ensure_conversation(user: AuthUser, conversation_id: str | None, question: str) -> str:
    supabase = get_supabase()
    if conversation_id:
        existing = (
            supabase.table("conversations")
            .select("id")
            .eq("id", conversation_id)
            .eq("user_id", user.id)
            .maybe_single()
            .execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return conversation_id

    title = question.strip()[:60] or "New Chat"
    created = (
        supabase.table("conversations")
        .insert({"user_id": user.id, "title": title})
        .execute()
    )
    return created.data[0]["id"]


@router.post("")
async def chat(
    payload: ChatRequest,
    user: AuthUser = Depends(get_current_user),
):
    question = payload.question.strip()
    if not question:
        raise HTTPException(status_code=400, detail="Question is required")

    supabase = get_supabase()
    conversation_id = await _ensure_conversation(user, payload.conversationId, question)

    chunks = search_similar_chunks(
        user_id=user.id,
        query=question,
        document_id=payload.documentId,
        match_count=settings.rag_top_k,
    )
    sources = _serialize_sources(chunks)

    supabase.table("messages").insert(
        {
            "conversation_id": conversation_id,
            "user_id": user.id,
            "role": "user",
            "content": question,
            "sources": None,
            "tokens_used": estimate_tokens(question),
        }
    ).execute()

    async def event_stream():
        answer_parts: list[str] = []
        yield _format_sse(
            "meta",
            {"conversationId": conversation_id, "sources": sources},
        )

        for token in stream_answer(question, chunks):
            answer_parts.append(token)
            yield _format_sse("token", {"content": token})

        answer = "".join(answer_parts)
        tokens_used = estimate_tokens(answer)

        supabase.table("messages").insert(
            {
                "conversation_id": conversation_id,
                "user_id": user.id,
                "role": "assistant",
                "content": answer,
                "sources": sources,
                "tokens_used": tokens_used,
            }
        ).execute()

        supabase.table("conversations").update(
            {
                "updated_at": datetime.now(timezone.utc).isoformat(),
                "title": question[:60] or "New Chat",
            }
        ).eq("id", conversation_id).execute()

        supabase.table("usage_logs").insert(
            {
                "user_id": user.id,
                "event_type": "chat",
                "tokens_used": tokens_used + estimate_tokens(question),
                "metadata": {"conversation_id": conversation_id},
            }
        ).execute()

        yield _format_sse("done", {"answer": answer, "sources": sources})

    return StreamingResponse(event_stream(), media_type="text/event-stream")
