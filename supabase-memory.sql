-- Memory Drive tabloları
-- Supabase SQL Editor'da çalıştırın

create table if not exists memory_events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,               -- URL: /memory/ayse-ali
  title text not null,                     -- "Ayşe & Ali Düğünü"
  description text,
  invitation_id uuid references invitations(id) on delete set null,
  password text,                           -- galeri şifresi (opsiyonel)
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists memory_uploads (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references memory_events(id) on delete cascade,
  file_url text not null,
  file_path text not null,
  file_type text not null default 'image', -- 'image' | 'video'
  file_name text,
  file_size bigint,
  uploader_name text,
  created_at timestamptz not null default now()
);

-- RLS
alter table memory_events enable row level security;
alter table memory_uploads enable row level security;

-- Public: aktif event'leri okuyabilir
create policy "public read active memory events"
  on memory_events for select using (is_active = true);

-- Public: upload ekleyebilir
create policy "public insert memory uploads"
  on memory_uploads for insert with check (true);

-- Public: galeri için upload'ları okuyabilir
create policy "public read memory uploads"
  on memory_uploads for select using (true);

-- Service role tam erişim
create policy "service full memory events"
  on memory_events for all using (true) with check (true);

create policy "service full memory uploads"
  on memory_uploads for all using (true) with check (true);
