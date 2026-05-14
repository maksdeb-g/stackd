import json
import httpx
from app.core.config import settings

async def generate_subtopics(topic: str) -> list[str]:
    if not settings.OPENCLAW_API_KEY or not settings.OPENCLAW_BASE_URL:
        return [
            f"Introduction to {topic}",
            f"Core concepts of {topic}",
            f"Advanced {topic} techniques",
            f"Practical applications of {topic}",
            f"{topic} best practices",
        ]

    prompt = (
        f"Generate 6 to 8 specific, focused subtopics for someone learning about: '{topic}'. "
        "Return ONLY a JSON array of strings. No explanations, no markdown, just the array. "
        'Example: ["Subtopic 1", "Subtopic 2", ...]'
    )

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            f"{settings.OPENCLAW_BASE_URL}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.OPENCLAW_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-3.5-turbo",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "max_tokens": 300,
            },
        )
        resp.raise_for_status()
        data = resp.json()

    raw = data["choices"][0]["message"]["content"].strip()
    raw = raw.strip("```json").strip("```").strip()
    subtopics: list[str] = json.loads(raw)
    return subtopics[:8]
