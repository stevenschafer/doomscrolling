-- Modify subscribers table for auth + email preferences
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS daily_briefing_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS weekly_digest_enabled BOOLEAN DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_user_id ON subscribers(user_id);

-- Doom Index table
CREATE TABLE IF NOT EXISTS doom_index (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL UNIQUE,
  overall_score NUMERIC(5,2) NOT NULL,
  category_scores JSONB NOT NULL,
  article_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Podcast episodes table
CREATE TABLE IF NOT EXISTS podcast_episodes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  script TEXT,
  audio_url TEXT,
  duration_seconds INTEGER,
  status TEXT DEFAULT 'generating',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Synthesis reports table
CREATE TABLE IF NOT EXISTS synthesis_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  doom_index_id UUID REFERENCES doom_index(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
