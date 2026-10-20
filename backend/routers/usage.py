from calendar import month_abbr
from datetime import date, datetime, time, timedelta, timezone
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from routers.auth import AuthUser, get_current_user
from schemas import ErrorResponse
from services.supabase_client import get_supabase

router = APIRouter(prefix="/api/usage", tags=["usage"])


class UsageStat(BaseModel):
    label: str
    value: str
    change: str
    icon: str = Field(description="One of: messages, tokens, storage, documents")


class UsageSeriesPoint(BaseModel):
    date: str
    tokens: int | None = None
    messages: int | None = None


class UsageResponse(BaseModel):
    stats: list[UsageStat]
    tokenUsage: list[UsageSeriesPoint]
    messageUsage: list[UsageSeriesPoint]


def _format_bytes(value: int) -> str:
    if value < 1024:
        return f"{value} B"
    if value < 1024 * 1024:
        return f"{value / 1024:.1f} KB"
    if value < 1024 * 1024 * 1024:
        return f"{value / (1024 * 1024):.1f} MB"
    return f"{value / (1024 * 1024 * 1024):.1f} GB"


def _month_start(current: date, months_ago: int) -> date:
    month_index = current.year * 12 + current.month - 1 - months_ago
    return date(month_index // 12, month_index % 12 + 1, 1)


@router.get(
    "",
    response_model=UsageResponse,
    summary="Get usage statistics",
    description="Return account message, token, storage, and document usage statistics.",
    responses={
        401: {"model": ErrorResponse, "description": "Missing or invalid bearer token"},
        502: {"model": ErrorResponse, "description": "Database service unavailable"},
    },
)
def get_usage(user: AuthUser = Depends(get_current_user)) -> dict[str, Any]:
    supabase = get_supabase()
    today = datetime.now(timezone.utc).date()
    first_month = _month_start(today, 6)
    logs = (
        supabase.table("usage_logs")
        .select("event_type,tokens_used,created_at")
        .eq("user_id", user.id)
        .gte("created_at", datetime.combine(first_month, time.min, timezone.utc).isoformat())
        .order("created_at")
        .limit(10_000)
        .execute()
    ).data or []
    documents = (
        supabase.table("documents")
        .select("size_bytes")
        .eq("user_id", user.id)
        .execute()
    ).data or []

    messages_by_day = {today - timedelta(days=offset): 0 for offset in range(7)}
    messages_by_month: dict[date, int] = {
        _month_start(today, offset): 0 for offset in range(7)
    }
    tokens_by_day = {today - timedelta(days=offset): 0 for offset in range(7)}
    chat_count = 0
    token_count = 0
    for row in logs:
        timestamp = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
        log_day = timestamp.astimezone(timezone.utc).date()
        month = date(log_day.year, log_day.month, 1)
        token_value = int(row.get("tokens_used") or 0)
        if row.get("event_type") == "chat":
            chat_count += 1
            token_count += token_value
            if log_day in messages_by_day:
                messages_by_day[log_day] += 1
            if month in messages_by_month:
                messages_by_month[month] += 1
            if log_day in tokens_by_day:
                tokens_by_day[log_day] += token_value

    total_bytes = sum(int(row.get("size_bytes") or 0) for row in documents)
    stats = [
        {"label": "Messages", "value": str(chat_count), "change": "Last 7 months", "icon": "messages"},
        {"label": "Tokens", "value": f"{token_count:,}", "change": "Last 7 months", "icon": "tokens"},
        {"label": "Storage", "value": _format_bytes(total_bytes), "change": "All documents", "icon": "storage"},
        {"label": "Documents", "value": str(len(documents)), "change": "In your workspace", "icon": "documents"},
    ]
    token_usage = [
        {
            "date": (today - timedelta(days=offset)).strftime("%a"),
            "tokens": tokens_by_day[today - timedelta(days=offset)],
        }
        for offset in reversed(range(7))
    ]
    message_usage = [
        {
            "date": month_abbr[month.month],
            "messages": messages_by_month[month],
        }
        for month in sorted(messages_by_month)
    ]
    return {"stats": stats, "tokenUsage": token_usage, "messageUsage": message_usage}
