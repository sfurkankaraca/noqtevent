-- ============================================================
-- NOQT — Journal Posts Table
-- Supabase Dashboard > SQL Editor'da çalıştır
-- ============================================================

CREATE TABLE IF NOT EXISTS journal_posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  title         text NOT NULL,
  category      text,
  excerpt       text,
  content       text,           -- Markdown veya HTML
  cover_image_url text,
  color         text DEFAULT 'bg-secondary',
  read_time     text,
  is_featured   boolean DEFAULT false,
  is_published  boolean DEFAULT false,
  published_at  timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE journal_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read published" ON journal_posts
  FOR SELECT USING (is_published = true);
