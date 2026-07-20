-- NOQT — Memory Drive galeri görünürlüğü
-- Supabase Dashboard > SQL Editor'da çalıştır

ALTER TABLE memory_events
  ADD COLUMN IF NOT EXISTS gallery_visibility text NOT NULL DEFAULT 'guests',
  ADD COLUMN IF NOT EXISTS gallery_token      text,
  ADD COLUMN IF NOT EXISTS couple_email       text,        -- gelin & damat bildirim e-postası
  ADD COLUMN IF NOT EXISTS last_notified_at   timestamptz; -- yükleme bildirimi throttle'ı

-- gallery_visibility:
--   'guests' → misafirler de galeriyi görebilir (yükleme sayfasında link gösterilir)
--   'couple' → galeri özeldir; yalnızca gelin & damat'a verilen ?k=<gallery_token> linkiyle açılır

-- Mevcut event'lere token üret (couple moduna geçtiklerinde hazır olsun)
UPDATE memory_events
  SET gallery_token = encode(gen_random_bytes(9), 'hex')
  WHERE gallery_token IS NULL;
