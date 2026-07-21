-- Sales OS — tam geçmiş Armut e-posta yedeklemesi (backfill) için imleç.
-- Düzenli cron (last_internal_date) sadece ileriye akışı yönetir; backfill
-- ayrı bir sayfalama imleci kullanır çünkü tarihsel taramanın yönü tersine
-- (en eskiden en yeniye doğru tüketilmez, Gmail sayfalarını sırayla gezer).

ALTER TABLE ingestion_state ADD COLUMN backfill_page_token text;
ALTER TABLE ingestion_state ADD COLUMN backfill_done boolean NOT NULL DEFAULT false;
ALTER TABLE ingestion_state ADD COLUMN backfill_processed integer NOT NULL DEFAULT 0;
