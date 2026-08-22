-- Teklif: liste fiyatı + müşteriye özel iskonto ve önerilen müzik konseptleri
-- fee = indirimli (geçerli) fiyat olarak kalır; sözleşme/ödeme akışı değişmez.
-- list_price > fee ise müşteri teklif sayfasında ve PDF'te "size özel indirim" gösterilir.

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS list_price numeric(12,2);
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS discount_note text;
-- MUSIC_CONCEPTS id'leri (src/components/planner/PlannerStore.ts), admin'in sıraladığı sırada
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS offer_music_concept_ids text[] DEFAULT '{}';
