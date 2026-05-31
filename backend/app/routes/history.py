from fastapi import APIRouter, Depends
from app.core.database import get_supabase
from app.core.auth import get_current_user

router = APIRouter(prefix="/history", tags=["history"])

@router.get("", response_model=list[dict])
async def get_search_history(limit: int = 20, user: dict = Depends(get_current_user)):
    try:
        db = get_supabase()
        res = (
            db.table("search_history")
            .select("*")
            .eq("user_id", user["id"])
            .order("searched_at", desc=True)
            .limit(limit)
            .execute()
        )
        return res.data
    except Exception:
        return []
