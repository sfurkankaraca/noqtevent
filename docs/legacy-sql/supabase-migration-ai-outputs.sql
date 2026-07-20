-- Etkinlik AI İçerik Stüdyosu — proje dosyası/sponsor/strateji metinleri + afiş
-- Supabase Dashboard > SQL Editor'da çalıştırın

CREATE TABLE IF NOT EXISTS event_ai_outputs (
  id uuid primary key default gen_random_uuid(),
  event_project_id uuid not null references event_projects(id) on delete cascade,
  type text not null,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_project_id, type)
);
CREATE INDEX IF NOT EXISTS event_ai_outputs_project_idx ON event_ai_outputs(event_project_id);

DROP TRIGGER IF EXISTS event_ai_outputs_updated_at ON event_ai_outputs;
CREATE TRIGGER event_ai_outputs_updated_at BEFORE UPDATE ON event_ai_outputs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
