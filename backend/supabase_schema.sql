-- ============================================================
-- Stackd – Study Buddy  |  Supabase SQL Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Folders ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS folders (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  color      TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Folder names must be unique per user
ALTER TABLE folders ADD CONSTRAINT folders_name_unique_per_user UNIQUE (user_id, name);
CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id);

-- ─── Saved Resources ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS saved_resources (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_saved_resources_user ON saved_resources(user_id);

-- ─── Search History ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS search_history (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  query        TEXT NOT NULL,
  result_count INTEGER DEFAULT 0,
  searched_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_saved_resources_folder ON saved_resources(folder_id);
CREATE INDEX IF NOT EXISTS idx_saved_resources_status ON saved_resources(status);
CREATE INDEX IF NOT EXISTS idx_search_history_date ON search_history(searched_at DESC);

-- ─── Row Level Security ───────────────────────────────────────────────────────
ALTER TABLE folders          ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_resources  ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history   ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY folders_user_isolation ON folders
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY resources_user_isolation ON saved_resources
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY history_user_isolation ON search_history
  FOR ALL USING (auth.uid() = user_id);
