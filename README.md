# Stackd – Study Buddy 📚

> A SOA-based unified learning platform that aggregates YouTube, Google Books, and Wikipedia into one searchable interface with AI-powered subtopic suggestions, folder organisation, and progress tracking.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                   │
│  Search → Results → Folders → Progress                   │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP REST
┌────────────────────────▼────────────────────────────────┐
│                   BACKEND (FastAPI)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐  │
│  │ /search  │ │/subtopics│ │ /folders │ │/resources  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘  │
│       │            │            │              │          │
│  ┌────▼──────────────────┐  ┌───▼──────────────▼──────┐  │
│  │   External APIs       │  │      Supabase (DB)       │  │
│  │  YouTube · Books · WP │  │  folders · resources     │  │
│  │  OpenAI (subtopics)   │  │  search_history          │  │
│  └───────────────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
stackd/
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app + CORS
│   │   ├── core/
│   │   │   ├── config.py         # Settings from .env
│   │   │   └── database.py       # Supabase client
│   │   ├── models/
│   │   │   └── schemas.py        # Pydantic models
│   │   ├── routes/
│   │   │   ├── search.py         # GET /search
│   │   │   ├── subtopics.py      # POST /subtopics
│   │   │   ├── folders.py        # CRUD /folders
│   │   │   ├── resources.py      # /resources/*
│   │   │   └── history.py        # GET /history
│   │   └── services/
│   │       ├── youtube_service.py
│   │       ├── books_service.py
│   │       ├── wikipedia_service.py
│   │       └── ai_service.py
│   ├── supabase_schema.sql       # Run this in Supabase
│   ├── requirements.txt
│   ├── render.yaml               # Render deployment
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx           # Search page
    │   │   ├── results/page.tsx   # Results page
    │   │   ├── folders/page.tsx   # Folder manager
    │   │   └── progress/page.tsx  # Kanban progress
    │   ├── components/
    │   │   ├── Nav.tsx
    │   │   └── ResourceCard.tsx
    │   ├── lib/api.ts             # All API calls
    │   └── types/index.ts
    ├── vercel.json
    └── .env.local.example
```

---

## Setup Guide

### 1. Supabase Database

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run `backend/supabase_schema.sql`
3. Copy your **Project URL** and **anon key** from Settings → API

### 2. Get API Keys

| API | Where to get it | Required? |
|-----|----------------|-----------|
| YouTube Data API v3 | [Google Cloud Console](https://console.cloud.google.com) | Yes |
| Google Books API | Same project as YouTube (optional) | No (books still work) |
| OpenAI API | [platform.openai.com](https://platform.openai.com) | No (fallback subtopics) |
| Supabase | Your project settings | Yes |

### 3. Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your API keys

python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
# API runs at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### 4. Frontend Setup

```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local: NEXT_PUBLIC_API_URL=http://localhost:8000

npm install
npm run dev
# App runs at http://localhost:3000
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/search?query=` | Unified search (YouTube + Books + Wikipedia) |
| `POST` | `/subtopics` | AI subtopic suggestions |
| `GET` | `/folders` | List all folders |
| `POST` | `/folders` | Create a folder |
| `DELETE` | `/folders/:id` | Delete folder + its resources |
| `POST` | `/resources/save` | Save a resource to a folder |
| `GET` | `/resources/folder/:id` | Get resources in a folder |
| `PATCH` | `/resources/progress/:id` | Update resource status |
| `DELETE` | `/resources/:id` | Delete a resource |
| `GET` | `/resources/progress/all` | All resources for progress page |
| `GET` | `/history` | Search history |

### Unified Resource Format

```json
{
  "title": "Introduction to Machine Learning",
  "source": "youtube",
  "description": "A beginner-friendly overview...",
  "thumbnail": "https://i.ytimg.com/vi/...",
  "link": "https://www.youtube.com/watch?v=...",
  "difficulty": "beginner"
}
```

---

## Deployment

### Backend → Render

1. Push `backend/` to a GitHub repo
2. Create a new **Web Service** on Render
3. Set environment variables from `.env.example`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend → Vercel

1. Push `frontend/` to a GitHub repo
2. Import on Vercel
3. Set env var: `NEXT_PUBLIC_API_URL=https://your-render-url.onrender.com`
4. Deploy

---

## SOA Demonstration

This system demonstrates **Service-Oriented Architecture** through:

- **Loose coupling**: Each external API is isolated in its own service module
- **API Gateway pattern**: FastAPI backend acts as a single entry point, aggregating multiple external services
- **Uniform interface**: All sources normalized to the same `Resource` schema
- **Separation of concerns**: Routes → Services → External APIs
- **Independent deployability**: Frontend and backend deployed independently

---

## Features

- ✅ Unified search across 3 content sources
- ✅ AI-powered subtopic suggestions (OpenAI with fallback)  
- ✅ Folder system for resource organisation
- ✅ Progress tracking (Want to Learn / In Progress / Done)
- ✅ Search history
- ✅ Source & difficulty filtering
- ✅ Kanban-style progress board
- ✅ Difficulty inference from metadata
- ✅ CORS configured
- ✅ Environment variable driven
- ✅ Graceful error handling (API failures degrade gracefully)
