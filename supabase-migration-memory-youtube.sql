-- NOQT — Memory Drive videoları için YouTube taşıma
-- Video YouTube'a taşındığında youtube_url dolar, R2 dosyası silinir (yer tasarrufu)
-- Supabase Dashboard > SQL Editor'da çalıştır

ALTER TABLE memory_uploads
  ADD COLUMN IF NOT EXISTS youtube_url text;
