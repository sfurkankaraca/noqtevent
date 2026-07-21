-- Sales OS Hafta 2 — ingestion adaptör imleci.
-- Kaynak başına tek satır: cron son nereden okuduğunu ve son hatayı burada tutar.

CREATE TABLE ingestion_state (
  source           text PRIMARY KEY,
  last_checked_at  timestamptz,
  -- Gmail internalDate (ms epoch) — bu tarihten yeni mesajlar taranır
  last_internal_date bigint,
  last_error       text,
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER update_ingestion_state_updated_at
  BEFORE UPDATE ON ingestion_state
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE ingestion_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role only" ON ingestion_state
  FOR ALL TO service_role USING (true) WITH CHECK (true);
