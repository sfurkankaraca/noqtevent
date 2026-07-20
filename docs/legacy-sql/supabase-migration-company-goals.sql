-- Şirket kokpiti — yıllık hedefler + tekrarlayan şirket görevleri
-- Supabase Dashboard > SQL Editor'da çalıştırın

CREATE TABLE IF NOT EXISTS company_goals (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  metric text not null,
  label text,
  target numeric not null,
  manual_actual numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
CREATE UNIQUE INDEX IF NOT EXISTS company_goals_year_metric_idx
  ON company_goals(year, metric, coalesce(label, ''));

CREATE TABLE IF NOT EXISTS company_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'diger',
  recurrence text not null default 'once',
  due_date date,
  assigned_to text,
  is_done boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

CREATE TABLE IF NOT EXISTS company_task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references company_tasks(id) on delete cascade,
  period text not null,
  done_at timestamptz not null default now(),
  unique (task_id, period)
);

DROP TRIGGER IF EXISTS company_goals_updated_at ON company_goals;
CREATE TRIGGER company_goals_updated_at BEFORE UPDATE ON company_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS company_tasks_updated_at ON company_tasks;
CREATE TRIGGER company_tasks_updated_at BEFORE UPDATE ON company_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
