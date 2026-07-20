-- GÜVENLİK: Eksik RLS düzeltmesi
-- Supabase Dashboard > SQL Editor'da çalıştırın
--
-- Bu tablolar RLS olmadan oluşturulmuştu; public anon key (NEXT_PUBLIC_SUPABASE_ANON_KEY
-- tarayıcıya gider) ile PostgREST üzerinden dışarıdan okunabilir/yazılabilir durumdaydı.
-- Kodda anon client hiç kullanılmıyor (tüm erişim server tarafında service role ile,
-- service role RLS'i otomatik bypass eder) — bu yüzden anon policy tanımlamadan
-- RLS'i açmak hiçbir şeyi bozmaz, yalnızca dış erişimi kapatır.

ALTER TABLE bookings           ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_payments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials       ENABLE ROW LEVEL SECURITY;
