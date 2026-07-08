-- Etkinlik checklist + proje dosyası sistemi
-- Supabase Dashboard > SQL Editor'da çalıştırın

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checklist_token text UNIQUE;

CREATE TABLE IF NOT EXISTS checklist_items (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  category text not null,
  title text not null,
  description text,
  is_done boolean not null default false,
  done_by text,
  done_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS checklist_items_booking_id_idx ON checklist_items(booking_id);

CREATE TABLE IF NOT EXISTS checklist_comments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references checklist_items(id) on delete cascade,
  booking_id uuid not null references bookings(id) on delete cascade,
  author_type text not null,
  author_name text,
  body text not null,
  created_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS checklist_comments_item_id_idx ON checklist_comments(item_id);

DROP TRIGGER IF EXISTS checklist_items_updated_at ON checklist_items;
CREATE TRIGGER checklist_items_updated_at BEFORE UPDATE ON checklist_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
