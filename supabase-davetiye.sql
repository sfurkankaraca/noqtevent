-- Dijital Davetiye tabloları
-- Supabase SQL Editor'da çalıştırın

create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  template text not null default 'modern', -- 'classic' | 'modern' | 'minimal'
  bride_name text not null,
  groom_name text not null,
  wedding_date date,
  wedding_time text,
  venue_name text,
  venue_address text,
  venue_maps_url text,
  story text,
  cover_photo_url text,
  music_note text,
  dress_code text,
  rsvp_deadline date,
  rsvp_enabled boolean not null default true,
  -- Oturma planı
  seating_plan_url text,        -- yüklenen yerleşim görseli
  seating_tables jsonb,         -- masa listesi: [{name, capacity, guests:[]}]
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists rsvp_responses (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references invitations(id) on delete cascade,
  guest_name text not null,
  guest_count int not null default 1,
  attending boolean not null,
  message text,
  created_at timestamptz not null default now()
);

-- Eğer tablo zaten varsa sadece yeni sütunları ekle
alter table invitations add column if not exists seating_plan_url text;
alter table invitations add column if not exists seating_tables jsonb;

-- RLS
alter table invitations enable row level security;
alter table rsvp_responses enable row level security;

-- Public can read active invitations
do $$ begin
  create policy "public read active invitations"
    on invitations for select using (is_active = true);
exception when duplicate_object then null; end $$;

-- Public can insert rsvp
do $$ begin
  create policy "public insert rsvp"
    on rsvp_responses for insert with check (true);
exception when duplicate_object then null; end $$;

-- Service role full access (admin)
do $$ begin
  create policy "service full invitations"
    on invitations for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "service full rsvp"
    on rsvp_responses for all using (true) with check (true);
exception when duplicate_object then null; end $$;
