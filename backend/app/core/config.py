from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    YOUTUBE_API_KEY: str = ""
    GOOGLE_BOOKS_API_KEY: str = ""
    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    FRONTEND_URL: str = "http://localhost:3000"
    WIKI_BASE_URL: str = "https://en.wikipedia.org/w/api.php"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()