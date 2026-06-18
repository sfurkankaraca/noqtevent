-- ============================================================
-- NOQT Platform — Supabase Schema
-- Supabase Dashboard > SQL Editor'da çalıştır
-- ============================================================

-- ── SONGS ─────────────────────────────────────────────────────
create table if not exists songs (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  title         text not null,
  artist        text not null,
  event_moment  text not null,   -- ilk-dans, pasta-kesimi, vb.
  category      text not null,   -- FIRST_DANCE, CAKE_CUTTING, vb.
  language      text not null default 'tr',  -- tr | en | other
  energy        text not null default 'slow', -- slow | medium | energetic
  mood_tags     text[] default '{}',
  spotify_url   text,
  youtube_url   text,
  audio_file_url text,
  is_active     boolean default true
);

-- ── INQUIRIES ──────────────────────────────────────────────────
create table if not exists inquiries (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz default now(),
  event_type       text not null,
  event_date       text,
  guest_type       text,
  event_sections   jsonb default '{}',
  moment_selections jsonb default '{}',
  services         text[] default '{}',
  contact          jsonb default '{}',  -- { name, surname, email, phone }
  assigned_partners text[] default '{}'
);

-- ── DJ PROFILES ────────────────────────────────────────────────
create table if not exists dj_profiles (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz default now(),
  clerk_id        text unique not null,
  name            text not null,
  bio             text,
  photo_url       text,
  soundcloud_url  text,
  mixcloud_url    text,
  youtube_url     text,
  concept_tags    text[] default '{}',
  available_dates date[] default '{}',
  is_active       boolean default true
);

-- ── PARTNER PROFILES ───────────────────────────────────────────
create table if not exists partner_profiles (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz default now(),
  clerk_id         text unique not null,
  company_name     text not null,
  description      text,
  logo_url         text,
  contact_email    text,
  contact_phone    text,
  service_category text,   -- Mekan, Müzik & Teknik, Görsel, vb.
  services         jsonb default '[]',  -- [{ name, price_range }]
  portfolio_images text[] default '{}',
  is_active        boolean default true
);

-- ── STORAGE BUCKET ─────────────────────────────────────────────
-- Supabase Dashboard > Storage > New Bucket > "audio"
-- Public bucket: true
-- (Bu SQL ile yapılamaz, dashboard'dan manuel oluştur)

-- ── ROW LEVEL SECURITY ─────────────────────────────────────────
alter table songs enable row level security;
alter table inquiries enable row level security;
alter table dj_profiles enable row level security;
alter table partner_profiles enable row level security;

-- Public read for songs (planner shows these)
create policy "Songs public read" on songs
  for select using (is_active = true);

-- Service role bypass (admin panel uses service role key)
create policy "Service role full access songs" on songs
  using (true) with check (true);

-- Inquiries — service role only
create policy "Service role full access inquiries" on inquiries
  using (true) with check (true);
