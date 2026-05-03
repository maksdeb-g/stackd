from fastapi import APIRouter
from app.core.database import get_supabase

router = APIRouter(prefix="/history", tags=["history"])

@router.get("", response_model=list[dict])
async def get_search_history(limit: int = 20):
    try:
        db = get_supabase()
        res = (
            db.table("search_history")
            .select("*")
            .order("searched_at", desc=True)
            .limit(limit)
            .execute()
        )
        return res.data
    except Exception:
        return []   # ← return empty list instead of 500