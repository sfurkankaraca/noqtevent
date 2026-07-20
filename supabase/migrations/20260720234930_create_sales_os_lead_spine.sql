-- Sales OS — Hafta 1: lead omurgası + append-only olay günlüğü.
-- Mimari referans: founder onaylı Sales OS tasarımı (2026-07-21).
-- leads = Katman 1 (omurga); lead_events = Katman 2 (tüm gelecek analitiğin kaynağı).
-- Kaynak-agnostik: source için CHECK yok — yeni pazar yeri migration gerektirmez.
-- İleriye dönük kolonlar (raw_source_payload, call_reminder_at) şimdiden ekli:
-- Hafta 2 (Gmail ingestion) ve Hafta 3 (arama hatırlatıcısı) ikinci migration istemesin.

CREATE TABLE leads (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),

  source            text NOT NULL,
  source_ref        text,

  customer_name     text,
  event_type        text,
  event_date        date,
  location          text,
  budget_text       text,
  description       text NOT NULL,
  attachments       jsonb NOT NULL DEFAULT '[]',
  raw_source_payload jsonb,

  status            text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new','needs_review','proposal_ready','sent','waiting','won','lost','archived')),

  ai_analysis       jsonb,
  suggested_reply   text,
  reply_history     jsonb NOT NULL DEFAULT '[]',

  sent_at           timestamptz,
  followup_count    integer NOT NULL DEFAULT 0,
  last_followup_at  timestamptz,
  call_reminder_at  timestamptz,

  admin_notes       text,
  lost_reason       text
);

-- Aynı pazar yeri talebi iki kez lead olmasın (source_ref boşsa serbest).
CREATE UNIQUE INDEX leads_source_ref_unique_idx ON leads (source, source_ref)
  WHERE source_ref IS NOT NULL;

CREATE INDEX leads_status_idx  ON leads (status);
CREATE INDEX leads_source_idx  ON leads (source);
CREATE INDEX leads_sent_at_idx ON leads (sent_at);

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Append-only olay günlüğü: Phase 2-4 analitiği/zekası yalnızca buradan türetilir.
CREATE TABLE lead_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id     uuid NOT NULL REFERENCES leads (id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  type        text NOT NULL
    CHECK (type IN ('created','ai_analyzed','reply_generated','reply_edited',
                    'marked_sent','customer_replied','followup_sent',
                    'call_made','status_changed','note_added')),
  data        jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX lead_events_lead_id_idx ON lead_events (lead_id, created_at);
CREATE INDEX lead_events_type_idx    ON lead_events (type);

-- Not: rls_auto_enable event trigger'ı canlıda ekli olmayabilir (M3 açık maddesi) —
-- RLS'i açıkça etkinleştiriyoruz. Erişim modeli mevcut kalıp: service_role dışına kapalı,
-- yetki uygulama katmanında requireAdmin() ile.
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service role only" ON leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service role only" ON lead_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
