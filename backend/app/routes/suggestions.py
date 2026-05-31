from fastapi import APIRouter, Query, Depends
from app.core.database import get_supabase
from app.core.auth import get_current_user

router = APIRouter(prefix="/suggestions", tags=["suggestions"])

@router.get("", response_model=list[str])
async def get_suggestions(
    query: str = Query(..., min_length=1),
    user: dict = Depends(get_current_user),
):
    """Return past search queries that match the typed text (case-insensitive)."""
    try:
        db = get_supabase()
        res = (
            db.table("search_history")
            .select("query")
            .eq("user_id", user["id"])
            .ilike("query", f"%{query}%")
            .order("searched_at", desc=True)
            .limit(6)
            .execute()
        )
        seen = set()
        suggestions = []
        for row in res.data:
            q = row["query"]
            if q not in seen:
                seen.add(q)
                suggestions.append(q)
        return suggestions
    except Exception:
        return []
