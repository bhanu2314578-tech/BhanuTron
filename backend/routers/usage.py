from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from routers.auth import AuthUser, get_current_user
from services.supabase_client import get_supabase

router = APIRouter(prefix="/api/usage", tags=["usage"])


class UsageStat(BaseModel):
    label: str
    value: str
    change: str
    icon: str


class UsageSeriesPoint(BaseModel):
    date: str
    tokens: float | None = None
    messages: int | None = None


class UsageResponse(BaseModel):
    stats: list[UsageStat]
    tokenUsage: list[UsageSeriesPoint]
    messageUsage: list[UsageSeriesPoint]


def _format_storage(size_bytes: int) -> str:
    if size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    return f"{size_bytes / (1024 * 1024):.1f} MB"


@router.get("", response_model=UsageResponse)
async def get_usage(user: AuthUser = Depends(get_current_user)):
    supabase = get_supabase()
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=29)

    documents = (
        supabase.table("documents")
        .select("size_bytes")
        .eq("user_id", user.id)
        .execute()
    ).data or []
    messages = (
        supabase.table("messages")
        .select("created_at,tokens_used,role")
        .eq("user_id", user.id)
        .gte("created_at", start.isoformat())
        .execute()
    ).data or []
    usage_logs = (
        supabase.table("usage_logs")
        .select("created_at,tokens_used,event_type")
        .eq("user_id", user.id)
        .gte("created_at", start.isoformat())
        .execute()
    ).data or []

    total_messages = len([message for message in messages if message.get("role") == "user"])
    total_tokens = sum(log.get("tokens_used") or 0 for log in usage_logs)
    total_storage = sum(document.get("size_bytes") or 0 for document in documents)

    token_by_day: dict[str, float] = defaultdict(float)
    message_by_day: dict[str, int] = defaultdict(int)

    for day_offset in range(30):
        day = (start + timedelta(days=day_offset)).strftime("%Y-%m-%d")
        token_by_day[day] = 0
        message_by_day[day] = 0

    for log in usage_logs:
        day = (log.get("created_at") or "")[:10]
        if day in token_by_day:
            token_by_day[day] += (log.get("tokens_used") or 0) / 1000

    for message in messages:
        if message.get("role") != "user":
            continue
        day = (message.get("created_at") or "")[:10]
        if day in message_by_day:
            message_by_day[day] += 1

    token_usage = [
        UsageSeriesPoint(date=day, tokens=round(value, 2))
        for day, value in sorted(token_by_day.items())
    ]
    message_usage = [
        UsageSeriesPoint(date=day, messages=value)
        for day, value in sorted(message_by_day.items())
    ]

    return UsageResponse(
        stats=[
            UsageStat(
                label="Messages sent",
                value=str(total_messages),
                change="+0%",
                icon="messages",
            ),
            UsageStat(
                label="Tokens used",
                value=f"{total_tokens:,}",
                change="+0%",
                icon="tokens",
            ),
            UsageStat(
                label="Storage used",
                value=_format_storage(total_storage),
                change="+0%",
                icon="storage",
            ),
            UsageStat(
                label="Documents",
                value=str(len(documents)),
                change="+0%",
                icon="documents",
            ),
        ],
        tokenUsage=token_usage,
        messageUsage=message_usage,
    )
