from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pydantic import BaseModel, Field

from routers.auth import AuthUser, get_current_user
from services.supabase_client import get_supabase
from schemas import ErrorResponse

router = APIRouter(prefix="/api/history", tags=["history"])


class CreateConversationRequest(BaseModel):
    title: str = Field(default="New Chat", min_length=1, max_length=120)


class HistoryMessage(BaseModel):
    id: str
    role: str
    content: str
    sources: list[dict[str, Any]]
    timestamp: str


class ConversationResponse(BaseModel):
    id: str
    title: str
    preview: str
    timestamp: str
    messages: list[HistoryMessage] = Field(default_factory=list)


def _serialize_conversation(
    conversation: dict[str, Any],
    messages: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    messages = messages or []
    latest = messages[-1] if messages else None
    return {
        "id": str(conversation["id"]),
        "title": conversation["title"],
        "preview": latest["content"][:180] if latest else "",
        "timestamp": conversation["updated_at"],
        "messages": [
            {
                "id": str(message["id"]),
                "role": message["role"],
                "content": message["content"],
                "sources": message.get("sources") or [],
                "timestamp": message["created_at"],
            }
            for message in messages
        ],
    }


@router.get(
    "",
    response_model=list[ConversationResponse],
    summary="List conversations",
    description="List up to 100 of the user's most recently updated conversations and their messages.",
    responses={
        401: {"model": ErrorResponse, "description": "Missing or invalid bearer token"},
        502: {"model": ErrorResponse, "description": "Database service unavailable"},
    },
)
def list_conversations(
    user: AuthUser = Depends(get_current_user),
) -> list[dict[str, Any]]:
    supabase = get_supabase()
    conversations = (
        supabase.table("conversations")
        .select("id,title,created_at,updated_at")
        .eq("user_id", user.id)
        .order("updated_at", desc=True)
        .limit(100)
        .execute()
    ).data or []
    if not conversations:
        return []
    ids = [row["id"] for row in conversations]
    messages = (
        supabase.table("messages")
        .select("id,conversation_id,role,content,sources,created_at")
        .eq("user_id", user.id)
        .in_("conversation_id", ids)
        .order("created_at")
        .limit(5_000)
        .execute()
    ).data or []
    grouped: dict[str, list[dict[str, Any]]] = {str(value): [] for value in ids}
    for message in messages:
        grouped[str(message["conversation_id"])].append(message)
    return [
        _serialize_conversation(row, grouped[str(row["id"])])
        for row in conversations
    ]


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ConversationResponse,
    summary="Create a conversation",
    description="Create an empty conversation for the authenticated user.",
    responses={
        201: {"description": "Conversation created"},
        401: {"model": ErrorResponse, "description": "Missing or invalid bearer token"},
        422: {"model": ErrorResponse, "description": "Invalid conversation title"},
    },
)
def create_conversation(
    payload: CreateConversationRequest,
    user: AuthUser = Depends(get_current_user),
) -> dict[str, Any]:
    title = payload.title.strip()
    if not title:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Conversation title cannot be empty",
        )
    rows = get_supabase().table("conversations").insert(
        {"user_id": user.id, "title": title}
    ).execute().data
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Unable to create conversation",
        )
    return _serialize_conversation(rows[0])


@router.get(
    "/{conversation_id}",
    response_model=ConversationResponse,
    summary="Get a conversation",
    description="Return a conversation and its messages if it belongs to the user.",
    responses={
        401: {"model": ErrorResponse, "description": "Missing or invalid bearer token"},
        404: {"model": ErrorResponse, "description": "Conversation not found"},
        422: {"model": ErrorResponse, "description": "Conversation ID is not a UUID"},
    },
)
def get_conversation(
    conversation_id: UUID,
    user: AuthUser = Depends(get_current_user),
) -> dict[str, Any]:
    supabase = get_supabase()
    conversation = (
        supabase.table("conversations")
        .select("id,title,created_at,updated_at")
        .eq("id", str(conversation_id))
        .eq("user_id", user.id)
        .maybe_single()
        .execute()
    ).data
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    messages = (
        supabase.table("messages")
        .select("id,conversation_id,role,content,sources,created_at")
        .eq("conversation_id", str(conversation_id))
        .eq("user_id", user.id)
        .order("created_at")
        .execute()
    ).data or []
    return _serialize_conversation(conversation, messages)


@router.delete(
    "/{conversation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a conversation",
    description="Delete a conversation owned by the authenticated user and its messages.",
    responses={
        204: {"description": "Conversation deleted"},
        401: {"model": ErrorResponse, "description": "Missing or invalid bearer token"},
        404: {"model": ErrorResponse, "description": "Conversation not found"},
        422: {"model": ErrorResponse, "description": "Conversation ID is not a UUID"},
    },
)
def delete_conversation(
    conversation_id: UUID,
    user: AuthUser = Depends(get_current_user),
) -> Response:
    deleted = (
        get_supabase()
        .table("conversations")
        .delete()
        .eq("id", str(conversation_id))
        .eq("user_id", user.id)
        .execute()
    ).data
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
