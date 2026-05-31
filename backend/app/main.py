from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import search, subtopics, folders, resources, history, suggestions, auth

app = FastAPI(
    title="Stackd - Study Buddy API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(search.router)
app.include_router(subtopics.router)
app.include_router(folders.router)
app.include_router(resources.router)
app.include_router(history.router)
app.include_router(suggestions.router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "Stackd API"}