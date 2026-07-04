-- NOQT — Fiyatlar sayfası yönetimi
-- Supabase Dashboard > SQL Editor'da çalıştır

CREATE TABLE IF NOT EXISTS pricing_tiers (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  label       text NOT NULL,
  emoji       text DEFAULT '🎵',
  range_text  text NOT NULL,
  description text,
  includes    jsonb DEFAULT '[]',
  suitable    jsonb DEFAULT '[]',
  is_featured boolean DEFAULT false,
  is_dark     boolean DEFAULT false,
  color       text DEFAULT 'bg-background',
  sort_order  integer DEFAULT 0,
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pricing_factors (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  factor     text NOT NULL,
  impact     text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active  boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS pricing_faq (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question   text NOT NULL,
  answer     text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active  boolean DEFAULT true
);

-- Seed: bütçe seviyeleri
INSERT INTO pricing_tiers (label, emoji, range_text, description, includes, suitable, is_featured, is_dark, color, sort_order)
VALUES
(
  'Başlangıç', '🎵', '₺3.000 – ₺8.000',
  'Kişisel DJ seti, taşınabilir ses sistemi. Küçük mekanlara ve özel partilere uygun.',
  '["DJ (3-4 saat)","Taşınabilir ses sistemi","Şarkı listesi planlaması"]',
  '["Doğum günü","Küçük özel parti","Küçük nişan"]',
  false, false, 'bg-[oklch(0.94_0.012_200)]', 1
),
(
  'Standart', '🎧', '₺8.000 – ₺18.000',
  'Profesyonel DJ, tam kapsamlı ses sistemi, ışık donanımı. Orta ölçekli düğün ve etkinlikler.',
  '["Profesyonel DJ (4-5 saat)","Tam ses sistemi & subwoofer","Işık donanımı","Teknik operatör"]',
  '["Nişan","Düğün (orta salon)","Kına gecesi","Yıldönümü"]',
  true, false, 'bg-[oklch(0.975_0.006_80)]', 2
),
(
  'Premium', '✨', '₺18.000 – ₺40.000+',
  'Deneyimli DJ + canlı müzisyen, premium ses & ışık, etkinlik koordinatörü dahil.',
  '["Headliner DJ (5+ saat)","Canlı müzisyen (klarnet, keman vb.)","Premium ses & ışık sistemi","Etkinlik koordinatörü","Fotoğrafçı opsiyonu"]',
  '["Büyük düğün","Festival & kulüp gecesi","Kurumsal etkinlik","VIP parti"]',
  false, true, 'bg-[oklch(0.13_0.01_260)]', 3
)
ON CONFLICT DO NOTHING;

-- Seed: faktörler
INSERT INTO pricing_factors (factor, impact, sort_order)
VALUES
  ('Mekan büyüklüğü', 'Büyük salon → daha güçlü ses sistemi gereksinimi', 1),
  ('Etkinlik süresi', 'Her ekstra saat ücrete eklenir', 2),
  ('Sanatçı deneyimi', 'Resident vs. headliner DJ arasında fark var', 3),
  ('Tarih', 'Yaz ve yılbaşı dönemi yoğun talep → erken rezervasyon şart', 4),
  ('Canlı müzisyen', 'DJ + klarnet/keman kombinasyonu premium ekler', 5),
  ('Teknik rider', 'Kendi ekipmanını getiren DJ mi, kiralık mı?', 6)
ON CONFLICT DO NOTHING;

-- Seed: SSS
INSERT INTO pricing_faq (question, answer, sort_order)
VALUES
  ('Fiyata KDV dahil mi?', 'Bireysel etkinliklerde genellikle KDV''siz fiyat verilir. Kurumsal etkinliklerde fatura ve KDV ayrıca belirtilir.', 1),
  ('Depozito alıyor musunuz?', 'Evet, rezervasyon onayı için toplam ücretin %%30–50''si kapora olarak alınır. Kalan tutar etkinlik günü veya öncesinde ödenir.', 2),
  ('İptal veya tarih değişikliği mümkün mü?', '30 gün öncesine kadar iade veya tarih değişikliği yapılabilir. Sözleşmede detaylı koşullar belirtilir.', 3),
  ('Ses sistemi fiyata dahil mi?', 'Standart ve premium paketlerde ses sistemi dahildir. Başlangıç paketinde mekan ses sistemini kullanabilirsiniz ya da ekleme ücretli yapılır.', 4),
  ('Kayseri dışına hizmet veriyor musunuz?', 'Evet. Nevşehir, Kapadokya ve çevre illere hizmet veriyoruz. Ulaşım mesafesine göre yol ücreti eklenir.', 5)
ON CONFLICT DO NOTHING;
