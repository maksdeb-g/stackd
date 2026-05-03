import httpx
from app.core.config import settings
from app.models.schemas import Resource

YOUTUBE_BASE = "https://www.googleapis.com/youtube/v3/search"

def _infer_difficulty(title: str, description: str) -> str:
    text = (title + " " + description).lower()
    if any(w in text for w in ["advanced", "expert", "deep dive", "internals", "phd"]):
        return "advanced"
    if any(w in text for w in ["intermediate", "mid-level", "tutorial", "practical"]):
        return "intermediate"
    return "beginner"

async def search_youtube(query: str, max_results: int = 6) -> list[Resource]:
    if not settings.YOUTUBE_API_KEY:
        return []
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": max_results,
        "key": settings.YOUTUBE_API_KEY,
        "relevanceLanguage": "en",
        "safeSearch": "moderate",
    }
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(YOUTUBE_BASE, params=params)
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            return []

    results: list[Resource] = []
    for item in data.get("items", []):
        snip = item.get("snippet", {})
        vid_id = item.get("id", {}).get("videoId", "")
        title = snip.get("title", "Untitled")
        desc = snip.get("description", "")
        thumb = snip.get("thumbnails", {}).get("medium", {}).get("url", "")
        results.append(Resource(
            title=title,
            source="youtube",
            description=desc[:300] or "No description available.",
            thumbnail=thumb,
            link=f"https://www.youtube.com/watch?v={vid_id}",
            difficulty=_infer_difficulty(title, desc),
        ))
    return results
