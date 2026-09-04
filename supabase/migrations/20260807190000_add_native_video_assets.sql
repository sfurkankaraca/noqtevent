-- Mux tabanlı native video yükleme — sanatçı/mekan profillerine YouTube/Vimeo
-- linki dışında, uygulama içinde akıcı (HLS) oynatılabilen video eklenmesini
-- sağlar (kurucu talebi: "YouTube olmak zorunda olmadan video yüklenmesi,
-- ama akıcı bir şekilde takılmadan izletilebilsin").
--
-- Neden AYRI bir kolon (`video_assets`), mevcut `video_urls`e KARIŞTIRILMADI:
-- `video_urls` yalnız harici link (YouTube/Vimeo) taşıyor ve panel/Flutter
-- tarafında BASİT bir string listesi olarak ele alınıyor. Mux videosu ise
-- asenkron bir yaşam döngüsüne sahip (yükleniyor -> işleniyor -> hazır/
-- reddedildi) ve silindiğinde Mux tarafında da temizlenmesi gereken bir
-- `asset_id` taşıyor — bunu düz bir string URL'de saklamak (a) durumu takip
-- edemez, (b) silme sırasında Mux'a hangi asset'in silineceğini bilemeyiz.
--
-- Video HAZIR (`status: 'ready'`) olduğunda webhook, `stream.mux.com/{id}.m3u8`
-- adresini AYRICA `video_urls`e ekler — böylece Flutter tarafı, senkron ve
-- Firestore projeksiyonu HİÇ DEĞİŞMEDEN (hâlâ düz string listesi) çalışmaya
-- devam eder; yalnız istemci tarafında `stream.mux.com` adresi ayrı bir
-- oynatıcıyla (video_player/HLS) render edilir (bkz. eventmatch
-- supply_media_gallery.dart).
--
-- Süre kotası (60sn, kurucu kararı — 2026-08-07) uygulama kodunda
-- (webhook handler) uygulanır, burada şemaya yazılmaz: kota değişebilir bir
-- ürün kararı, migration'a gömülmesi yanlış katman.

ALTER TABLE artist_profiles
  ADD COLUMN IF NOT EXISTS video_assets jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE venue_details
  ADD COLUMN IF NOT EXISTS video_assets jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN artist_profiles.video_assets IS
  'Mux native video varlıkları: [{uploadId, assetId, playbackId, status, durationSeconds, createdAt}]. Yalnız panel/webhook tarafından yazılır.';
COMMENT ON COLUMN venue_details.video_assets IS
  'Mux native video varlıkları: [{uploadId, assetId, playbackId, status, durationSeconds, createdAt}]. Yalnız panel/webhook tarafından yazılır.';
