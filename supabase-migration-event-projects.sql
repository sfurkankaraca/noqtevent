-- Bağımsız "Etkinlik" sihirbazı — event_projects + checklist genişletmesi
-- Supabase Dashboard > SQL Editor'da çalıştırın

CREATE TABLE IF NOT EXISTS event_projects (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete set null,
  client_name text not null,
  client_email text,
  client_phone text,
  event_type text,
  event_date date,
  event_time text,
  guest_count int,
  venue_name text,
  venue_city text,
  venue_address text,
  budget numeric,
  decisions jsonb not null default '{}',
  status text not null default 'planning',
  checklist_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS event_projects_booking_id_idx ON event_projects(booking_id);

DROP TRIGGER IF EXISTS event_projects_updated_at ON event_projects;
CREATE TRIGGER event_projects_updated_at BEFORE UPDATE ON event_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- checklist_items/checklist_comments artık event_projects'e de bağlanabilsin
ALTER TABLE checklist_items ALTER COLUMN booking_id DROP NOT NULL;
ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS event_project_id uuid references event_projects(id) on delete cascade;
ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS assigned_to text;
CREATE INDEX IF NOT EXISTS checklist_items_event_project_id_idx ON checklist_items(event_project_id);

ALTER TABLE checklist_comments ALTER COLUMN booking_id DROP NOT NULL;
ALTER TABLE checklist_comments ADD COLUMN IF NOT EXISTS event_project_id uuid references event_projects(id) on delete cascade;
