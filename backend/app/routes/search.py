import asyncio
from fastapi import APIRouter, Query, HTTPException, Depends
from app.services.youtube_service import search_youtube
from app.services.books_service import search_books
from app.services.wikipedia_service import search_wikipedia
from app.models.schemas import Resource
from app.core.database import get_supabase
from app.core.auth import get_optional_user
from datetime import datetime, timezone

router = APIRouter(prefix="/search", tags=["search"])

@router.get("", response_model=list[Resource])
async def unified_search(
    query: str = Query(..., min_length=1),
    user: dict | None = Depends(get_optional_user),
):
    """Aggregate results from YouTube, Google Books, and Wikipedia."""
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    yt_results, book_results, wiki_results = await asyncio.gather(
        search_youtube(query),
        search_books(query),
        search_wikipedia(query),
        return_exceptions=True,
    )

    combined: list[Resource] = []
    for r in [yt_results, book_results, wiki_results]:
        if isinstance(r, list):
            combined.extend(r)

    if user:
        try:
            db = get_supabase()
            db.table("search_history").insert({
                "user_id": user["id"],
                "query": query,
                "result_count": len(combined),
                "searched_at": datetime.now(timezone.utc).isoformat(),
            }).execute()
        except Exception:
            pass

    return combined
