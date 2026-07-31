from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from routers.auth import AuthUser, get_current_user
from services.supabase_client import get_supabase

router = APIRouter(prefix="/api/history", tags=["history"])


class HistoryMessage(BaseModel):
    id: str
    role: str
    content: str
    sources: list[dict] | None = None
    timestamp: str


class HistoryConversation(BaseModel):
    id: str
    title: str
    preview: str
    timestamp: str
    messages: list[HistoryMessage] | None = None


class CreateConversationRequest(BaseModel):
    title: str | None = "New Chat"


class UpdateConversationRequest(BaseModel):
    title: str


def _relative_time(value: str) -> str:
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return value

    now = datetime.now(timezone.utc)
    delta = now - dt.astimezone(timezone.utc)
    seconds = int(delta.total_seconds())
    if seconds < 60:
        return "Just now"
    if seconds < 3600:
        return f"{seconds // 60}m ago"
    if seconds < 86400:
        return f"{seconds // 3600}h ago"
    if seconds < 604800:
        return f"{seconds // 86400}d ago"
    return dt.strftime("%b %d")


def _serialize_message(row: dict) -> HistoryMessage:
    return HistoryMessage(
        id=row["id"],
        role=row["role"],
        content=row["content"],
        sources=row.get("sources"),
        timestamp=row["created_at"],
    )


def _serialize_conversation(row: dict, include_messages: bool = False) -> HistoryConversation:
    messages = None
    preview = ""
    if include_messages and row.get("messages"):
        message_rows = row["messages"]
        messages = [_serialize_message(message) for message in message_rows]
        last = next((message for message in reversed(message_rows) if message.get("content")), None)
        preview = (last or {}).get("content", "")[:80]
    else:
        preview = row.get("preview") or ""

    return HistoryConversation(
        id=row["id"],
        title=row.get("title") or "New Chat",
        preview=preview,
        timestamp=_relative_time(row.get("updated_at") or row.get("created_at")),
        messages=messages,
    )


@router.get("", response_model=list[HistoryConversation])
async def list_conversations(user: AuthUser = Depends(get_current_user)):
    supabase = get_supabase()
    conversations = (
        supabase.table("conversations")
        .select("id,title,created_at,updated_at")
        .eq("user_id", user.id)
        .order("updated_at", desc=True)
        .execute()
    ).data or []

    results: list[HistoryConversation] = []
    for conversation in conversations:
        latest_message = (
            supabase.table("messages")
            .select("content,created_at")
            .eq("conversation_id", conversation["id"])
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        ).data
        preview = latest_message[0]["content"][:80] if latest_message else ""
        conversation["preview"] = preview
        results.append(_serialize_conversation(conversation))

    return results


@router.post("", response_model=HistoryConversation, status_code=201)
async def create_conversation(
    payload: CreateConversationRequest,
    user: AuthUser = Depends(get_current_user),
):
    supabase = get_supabase()
    created = (
        supabase.table("conversations")
        .insert({"user_id": user.id, "title": payload.title or "New Chat"})
        .execute()
    )
    return _serialize_conversation(created.data[0])


@router.get("/{conversation_id}", response_model=HistoryConversation)
async def get_conversation(conversation_id: str, user: AuthUser = Depends(get_current_user)):
    supabase = get_supabase()
    conversation = (
        supabase.table("conversations")
        .select("*")
        .eq("id", conversation_id)
        .eq("user_id", user.id)
        .maybe_single()
        .execute()
    ).data
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = (
        supabase.table("messages")
        .select("*")
        .eq("conversation_id", conversation_id)
        .order("created_at")
        .execute()
    ).data or []
    conversation["messages"] = messages
    return _serialize_conversation(conversation, include_messages=True)


@router.patch("/{conversation_id}", response_model=HistoryConversation)
async def update_conversation(
    conversation_id: str,
    payload: UpdateConversationRequest,
    user: AuthUser = Depends(get_current_user),
):
    supabase = get_supabase()
    updated = (
        supabase.table("conversations")
        .update({"title": payload.title})
        .eq("id", conversation_id)
        .eq("user_id", user.id)
        .execute()
    ).data
    if not updated:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return _serialize_conversation(updated[0])


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(conversation_id: str, user: AuthUser = Depends(get_current_user)):
    supabase = get_supabase()
    deleted = (
        supabase.table("conversations")
        .delete()
        .eq("id", conversation_id)
        .eq("user_id", user.id)
        .execute()
    ).data
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
