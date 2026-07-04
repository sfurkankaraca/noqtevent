-- NOQT — Paketler tablosu
-- Supabase Dashboard > SQL Editor'da çalıştır

CREATE TABLE IF NOT EXISTS packages (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug         text UNIQUE NOT NULL,
  name         text NOT NULL,
  tag          text,
  emoji        text DEFAULT '📦',
  description  text,
  includes     jsonb DEFAULT '[]',
  suitable     jsonb DEFAULT '[]',
  price_from   numeric(12,2),
  price_note   text,
  cta_text     text DEFAULT 'Teklif Al',
  cta_href     text DEFAULT '/planla',
  color        text DEFAULT 'bg-background',
  is_dark      boolean DEFAULT false,
  is_active    boolean DEFAULT true,
  sort_order   integer DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);

-- Mevcut hardcoded paketleri ekle
INSERT INTO packages (slug, name, tag, emoji, description, includes, suitable, price_from, price_note, cta_text, cta_href, color, is_dark, sort_order)
VALUES
(
  'dugun-deneyimi',
  'Düğün Deneyimi',
  'En Çok Tercih',
  '💍',
  'Hayatınızın en özel gecesini başından sonuna biz yönetiyoruz. DJ, canlı müzisyen, fotoğrafçı ve dekorasyon tek çatı altında.',
  '["Profesyonel DJ (5 saat set)","Canlı müzisyen / klarnet","Düğün fotoğrafçısı","Çiçek & masa dekorasyonu","Ses sistemi kurulum & operasyon","Etkinlik koordinatörü","Sözleşme & ödeme planı"]',
  '["Düğün","Nişan","Kına Gecesi"]',
  NULL,
  'Kişisel teklif için',
  'Teklif Al',
  '/planla',
  'bg-[oklch(0.94_0.035_65)]',
  false,
  1
),
(
  'kulup-gecesi',
  'Kulüp & Festival Gecesi',
  'Organizatörlere Özel',
  '🎧',
  'Kulüp açılışları, festival sahneleri ve after party''ler için eksiksiz teknik ve sanatsal kadro.',
  '["Ana DJ + açılış DJ","Profesyonel ses & ışık sistemi","Teknik rider hazırlığı","Sahne koordinasyonu","Sözleşme & ön ödeme sistemi"]',
  '["Kulüp Gecesi","Festival","After Party","Morning Party"]',
  NULL,
  'Kadro & tarih bazlı fiyat',
  'Kadroyu Gör',
  '/sanatcilar',
  'bg-[oklch(0.13_0.01_260)]',
  true,
  2
),
(
  'kurumsal-gece',
  'Kurumsal Etkinlik',
  'Kurumsal',
  '🏢',
  'Lansman, yılsonu gecesi, açılış — fatura, sözleşme, teknik koordinasyon ve MC dahil tam kapsamlı paket.',
  '["DJ veya canlı müzisyen","MC / Sunucu","Ses & sahne teknik koordinasyonu","Fatura & kurumsal sözleşme","Etkinlik timeline planlaması"]',
  '["Lansman","Yılsonu Gecesi","Açılış","Ödül Töreni"]',
  NULL,
  'Kişisel teklif için',
  'Teklif Al',
  '/planla',
  'bg-[oklch(0.93_0.012_200)]',
  false,
  3
),
(
  'ozel-parti',
  'Özel Parti',
  'Esnek',
  '🎉',
  'Doğum günü, bride party, sürpriz — küçük ölçekli ama büyük enerji. Bütçenize göre şekillendiriyoruz.',
  '["DJ (3-4 saat set)","Bluetooth / kablosuz ses sistemi","Şarkı listesi planlaması","Dekor önerileri"]',
  '["Doğum Günü","Bride Party","Sürpriz Parti","Mezuniyet"]',
  NULL,
  'Mekan & süreye göre',
  'Planlamaya Başla',
  '/planla',
  'bg-[oklch(0.92_0.022_320)]',
  false,
  4
)
ON CONFLICT (slug) DO NOTHING;
