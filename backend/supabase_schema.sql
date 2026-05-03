-- ============================================================
-- Stackd – Study Buddy  |  Supabase SQL Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Folders ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS folders (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL,
  color      TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Saved Resources ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_resources (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folder_id   UUID REFERENCES folders(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  source      TEXT NOT NULL CHECK (source IN ('youtube', 'book', 'wikipedia')),
  description TEXT,
  thumbnail   TEXT,
  link        TEXT NOT NULL,
  difficulty  TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  status      TEXT DEFAULT 'WANT_TO_LEARN' CHECK (status IN ('WANT_TO_LEARN', 'IN_PROGRESS', 'DONE')),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Search History ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_history (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query        TEXT NOT NULL,
  result_count INTEGER DEFAULT 0,
  searched_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_saved_resources_folder ON saved_resources(folder_id);
CREATE INDEX IF NOT EXISTS idx_saved_resources_status ON saved_resources(status);
CREATE INDEX IF NOT EXISTS idx_search_history_date ON search_history(searched_at DESC);

-- ─── Row Level Security (disable for MVP — no auth) ───────────────────────────
ALTER TABLE folders          DISABLE ROW LEVEL SECURITY;
ALTER TABLE saved_resources  DISABLE ROW LEVEL SECURITY;
ALTER TABLE search_history   DISABLE ROW LEVEL SECURITY;
