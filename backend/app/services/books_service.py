import httpx
from app.core.config import settings
from app.models.schemas import Resource

BOOKS_BASE = "https://www.googleapis.com/books/v1/volumes"

def _infer_difficulty(categories: list[str], description: str) -> str:
    text = (" ".join(categories) + " " + description).lower()
    if any(w in text for w in ["advanced", "graduate", "research", "theory"]):
        return "advanced"
    if any(w in text for w in ["intermediate", "professional", "practical"]):
        return "intermediate"
    return "beginner"

async def search_books(query: str, max_results: int = 6) -> list[Resource]:
    params = {
        "q": query,
        "maxResults": max_results,
        "printType": "books",
        "langRestrict": "en",
        "orderBy": "relevance",
    }
    if settings.GOOGLE_BOOKS_API_KEY:
        params["key"] = settings.GOOGLE_BOOKS_API_KEY

    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(BOOKS_BASE, params=params)
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            return []

    results: list[Resource] = []
    for item in data.get("items", []):
        info = item.get("volumeInfo", {})
        title = info.get("title", "Untitled")
        authors = ", ".join(info.get("authors", []))
        desc = info.get("description", "")
        categories = info.get("categories", [])
        images = info.get("imageLinks", {})
        thumb = images.get("thumbnail", "")
        link = info.get("infoLink", f"https://books.google.com/books?id={item.get('id', '')}")

        results.append(Resource(
            title=title,
            source="book",
            description=(f"By {authors}. " if authors else "") + (desc[:250] or "No description."),
            thumbnail=thumb,
            link=link,
            difficulty=_infer_difficulty(categories, desc),
        ))
    return results
