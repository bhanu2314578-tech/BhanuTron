import logging
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from config import settings
from routers.auth import AuthUser, get_current_user
from services.rag import answer_question
from services.supabase_client import get_supabase
from schemas import ErrorResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["chat"])


class ChatRequest(BaseModel):
    question: str = Field(min_length=1)
    documentId: UUID | None = None
    conversationId: UUID | None = None

    def normalized_question(self) -> str:
        question = self.question.strip()
        if not question:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Question cannot be empty",
            )
        if len(question) > settings.max_question_chars:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Question is too long",
            )
        return question


def _get_or_create_conversation(
    user_id: str,
    conversation_id: UUID | None,
    question: str,
) -> dict[str, Any]:
    supabase = get_supabase()
    if conversation_id:
        response = (
            supabase.table("conversations")
            .select("id,title")
            .eq("id", str(conversation_id))
            .eq("user_id", user_id)
            .maybe_single()
            .execute()
        )
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )
        return response.data

    title = question[:60].strip() or "New Chat"
    created = supabase.table("conversations").insert(
        {"user_id": user_id, "title": title}
    ).execute().data
    if not created:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to create conversation",
        )
    return created[0]


@router.post(
    "",
    summary="Ask a question",
    description=(
        "Retrieve relevant chunks from the authenticated user's processed documents, "
        "generate an answer with Groq, and save both messages to conversation history. "
        "Supply documentId to constrain retrieval to one owned document."
    ),
    responses={
        200: {
            "description": "Generated answer and document citations",
            "content": {
                "application/json": {
                    "example": {
                        "answer": "The policy allows 30 days for returns.",
                        "sources": [
                            {
                                "id": "chunk-uuid",
                                "document": "returns-policy.pdf",
                                "page": 2,
                                "section": "Page 2",
                                "snippet": "Items may be returned within 30 days...",
                            }
                        ],
                    }
                }
            },
        },
        401: {"model": ErrorResponse, "description": "Missing or invalid bearer token"},
        404: {"model": ErrorResponse, "description": "Conversation or document not found"},
        413: {"model": ErrorResponse, "description": "Question is too long"},
        422: {"model": ErrorResponse, "description": "Question is empty or invalid"},
        502: {"model": ErrorResponse, "description": "Database, embedding, or LLM service failed"},
    },
)
def chat(
    payload: ChatRequest,
    user: AuthUser = Depends(get_current_user),
) -> dict[str, Any]:
    question = payload.normalized_question()
    supabase = get_supabase()
    conversation = _get_or_create_conversation(
        user.id, payload.conversationId, question
    )

    if payload.documentId:
        document = (
            supabase.table("documents")
            .select("id")
            .eq("id", str(payload.documentId))
            .eq("user_id", user.id)
            .eq("status", "processed")
            .maybe_single()
            .execute()
        ).data
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Processed document not found",
            )

    answer, sources, tokens_used = answer_question(
        user.id,
        question,
        str(payload.documentId) if payload.documentId else None,
    )
    rows = [
        {
            "conversation_id": conversation["id"],
            "user_id": user.id,
            "role": role,
            "content": content,
            "sources": message_sources,
            "tokens_used": message_tokens,
        }
        for role, content, message_sources, message_tokens in (
            ("user", question, None, 0),
            ("assistant", answer, sources, tokens_used),
        )
    ]
    supabase.table("messages").insert(rows).execute()
    conversation_updates = {"updated_at": datetime.now(timezone.utc).isoformat()}
    if conversation.get("title") == "New Chat":
        conversation_updates["title"] = question[:60]
    supabase.table("conversations").update(conversation_updates).eq(
        "id", conversation["id"]
    ).eq("user_id", user.id).execute()
    try:
        supabase.table("usage_logs").insert(
            {
                "user_id": user.id,
                "event_type": "chat",
                "tokens_used": tokens_used,
                "metadata": {"conversation_id": conversation["id"]},
            }
        ).execute()
    except Exception:
        logger.exception("Could not record usage for conversation %s", conversation["id"])

    return {"answer": answer, "sources": sources}
