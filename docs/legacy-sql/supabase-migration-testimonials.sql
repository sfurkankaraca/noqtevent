-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS testimonials (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote      text NOT NULL,
  name       text NOT NULL,
  event      text,
  initials   text,
  color      text    DEFAULT 'bg-[oklch(0.88_0.055_65)]',
  dark       boolean DEFAULT false,
  rating     integer DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  is_active  boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed existing static testimonials
INSERT INTO testimonials (quote, name, event, initials, color, dark, rating, sort_order) VALUES
(
  'Düğünümüzde müzik seçimini tamamen NOQT''a bıraktık. Karşılamadan halaylara, after party''ye kadar her geçiş mükemmeldi. Misafirlerimiz sabaha kadar dans pistinden ayrılmadı.',
  'Selin & Mert', 'Düğün — Bodrum Villa', 'SM', 'bg-[oklch(0.88_0.055_65)]', false, 5, 1
),
(
  'Marka lansmanımız için Gün Batımı konseptini seçtik. Mekanın enerjisi, müzik ve atmosfer tam istediğimiz gibiydi. Konuklarımız etkinliği hâlâ konuşuyor.',
  'Zeynep Akar', 'Marka Lansmanı — İstanbul', 'ZA', 'bg-[oklch(0.93_0.006_240)]', false, 5, 2
),
(
  'Kına gecemiz için geleneksel konsept istedik, hem halaylar hem modern müzik mükemmel geçti. Annem ''bu müzisyeni nereden buldunuz'' diye sordu durdu.',
  'Ayşe Demirkol', 'Kına Gecesi — Ankara', 'AD', 'bg-[oklch(0.84_0.07_40)]', false, 5, 3
),
(
  'Sunset Session organizasyonumuzda NOQT''un seçtiği set list tam isabet. Gün batımıyla başlayan müzik, geceye uzayan enerjisiyle misafirlerimizi büyüledi.',
  'Can Öztürk', 'Sunset Session — Çeşme', 'CÖ', 'bg-[oklch(0.90_0.025_320)]', false, 5, 4
),
(
  'Kurumsal yıl sonu etkinliğimizde hem profesyonel hem eğlenceli bir denge istedik. Konsept önerisi ve uygulama harikaydı — ekibimiz çok mutlu ayrıldı.',
  'Deniz Kaya', 'Kurumsal Etkinlik — İstanbul', 'DK', 'bg-[oklch(0.88_0.035_120)]', false, 5, 5
),
(
  'After party için Kulüp Modu konseptini seçtik, sabah 4''e kadar dans ettik. DJ''in set akışı inanılmazdı, enerji hiç düşmedi.',
  'Berk & Sena', 'After Party — İzmir', 'BS', 'bg-[oklch(0.20_0.025_260)]', true, 5, 6
)
ON CONFLICT DO NOTHING;
