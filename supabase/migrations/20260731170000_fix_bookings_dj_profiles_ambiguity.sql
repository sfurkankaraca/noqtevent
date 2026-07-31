-- bookings → dj_profiles arasında İKİ foreign key olunca PostgREST
-- `.select("*, dj_profiles(...)")` embed'ini çözemiyor ve tüm sorgular
-- "Could not embed because more than one relationship was found" hatası veriyor.
-- Sonuç: booking listesi/detayı, teklif sayfası, sözleşme ve finans sorguları
-- sessizce boş dönüyordu (hatalar kodda yutuluyor).
--
-- offer_selected_artist_id yalnızca müşterinin teklif sayfasındaki tercihinin
-- anlık kaydı — sıkı referans bütünlüğü gerektirmiyor. FK'yı kaldırıp kolonu
-- düz uuid olarak bırakıyoruz; böylece bookings → dj_profiles ilişkisi tekrar
-- tek (artist_id) ve embed'ler çalışıyor.
--
-- DİKKAT: bookings tablosuna dj_profiles'a giden ikinci bir FK EKLEMEYİN.
-- Gerekirse embed'leri `dj_profiles!bookings_artist_id_fkey(...)` ile nitelemek
-- şart olur (20+ çağrı noktası).

ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_offer_selected_artist_id_fkey;
