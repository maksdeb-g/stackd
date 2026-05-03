import json
from openai import AsyncOpenAI
from app.core.config import settings

async def generate_subtopics(topic: str) -> list[str]:
    if not settings.OPENAI_API_KEY:
        # Fallback: return generic subtopics without AI
        return [
            f"Introduction to {topic}",
            f"Core concepts of {topic}",
            f"Advanced {topic} techniques",
            f"Practical applications of {topic}",
            f"{topic} best practices",
        ]

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    prompt = (
        f"Generate 6 to 8 specific, focused subtopics for someone learning about: '{topic}'. "
        "Return ONLY a JSON array of strings. No explanations, no markdown, just the array. "
        'Example: ["Subtopic 1", "Subtopic 2", ...]'
    )

    response = await client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=300,
    )

    raw = response.choices[0].message.content.strip()
    # Strip markdown fences if present
    raw = raw.strip("```json").strip("```").strip()
    subtopics: list[str] = json.loads(raw)
    return subtopics[:8]
