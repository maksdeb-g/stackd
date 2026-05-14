from fastapi import APIRouter, Query
from app.core.database import get_supabase

router = APIRouter(prefix="/suggestions", tags=["suggestions"])

@router.get("", response_model=list[str])
async def get_suggestions(query: str = Query(..., min_length=1)):
    """Return past search queries that match the typed text (case-insensitive)."""
    try:
        db = get_supabase()
        res = (
            db.table("search_history")
            .select("query")
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
