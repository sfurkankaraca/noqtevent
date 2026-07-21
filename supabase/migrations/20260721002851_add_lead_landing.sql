-- Sales OS — kişiye özel lead landing sayfası (founder kararı 2026-07-21).
-- Her lead tahmin edilemez bir landing token'ı alır; müşteri /t/[token] sayfasında
-- eksik bilgileri bırakır. Görüntüleme/gönderim lead_events'e yazılır.

ALTER TABLE leads ADD COLUMN landing_token uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX leads_landing_token_idx ON leads (landing_token);

-- Yeni olay türleri: landing_viewed, landing_submitted
ALTER TABLE lead_events DROP CONSTRAINT lead_events_type_check;
ALTER TABLE lead_events ADD CONSTRAINT lead_events_type_check
  CHECK (type IN ('created','ai_analyzed','reply_generated','reply_edited',
                  'marked_sent','customer_replied','followup_sent',
                  'call_made','status_changed','note_added',
                  'landing_viewed','landing_submitted'));
