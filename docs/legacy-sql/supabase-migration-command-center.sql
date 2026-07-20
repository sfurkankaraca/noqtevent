-- Etkinlik komuta merkezi — görev son tarihleri + etkinlik günü planı (run sheet)
-- Supabase Dashboard > SQL Editor'da çalıştırın

ALTER TABLE checklist_items ADD COLUMN IF NOT EXISTS due_date date;

CREATE TABLE IF NOT EXISTS event_schedule_items (
  id uuid primary key default gen_random_uuid(),
  event_project_id uuid not null references event_projects(id) on delete cascade,
  time text not null,
  title text not null,
  description text,
  assigned_to text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
CREATE INDEX IF NOT EXISTS event_schedule_items_project_idx ON event_schedule_items(event_project_id);

DROP TRIGGER IF EXISTS event_schedule_items_updated_at ON event_schedule_items;
CREATE TRIGGER event_schedule_items_updated_at BEFORE UPDATE ON event_schedule_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
