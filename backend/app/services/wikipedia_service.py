import httpx
from app.models.schemas import Resource
from app.core.config import settings

async def search_wikipedia(query: str, max_results: int = 4) -> list[Resource]:
    search_params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "srlimit": max_results,
        "format": "json",
        "srprop": "snippet|titlesnippet",
    }

    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.get(settings.WIKI_BASE_URL, params=search_params)
            resp.raise_for_status()
            data = resp.json()
        except Exception:
            return []

        pages = data.get("query", {}).get("search", [])
        results: list[Resource] = []

        for page in pages:
            title = page.get("title", "Untitled")
            snippet = (
                page.get("snippet", "")
                .replace('<span class="searchmatch">', "")
                .replace("</span>", "")
                .strip()
            )
            page_id = page.get("pageid", "")

            thumb = ""
            try:
                img_resp = await client.get(settings.WIKI_BASE_URL, params={
                    "action": "query",
                    "pageids": page_id,
                    "prop": "pageimages",
                    "pithumbsize": 300,
                    "format": "json",
                })
                img_data = img_resp.json()
                thumb = (
                    img_data.get("query", {})
                    .get("pages", {})
                    .get(str(page_id), {})
                    .get("thumbnail", {})
                    .get("source", "")
                )
            except Exception:
                pass

            results.append(Resource(
                title=title,
                source="wikipedia",
                description=snippet[:300] if snippet else "Wikipedia article.",
                thumbnail=thumb,
                link=f"https://en.wikipedia.org/wiki/{title.replace(' ', '_')}",
                difficulty="beginner",
            ))

        return results