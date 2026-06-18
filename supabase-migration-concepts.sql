-- ============================================================
-- NOQT — Concepts Table + Seed
-- Supabase Dashboard > SQL Editor'da çalıştır
-- ============================================================

CREATE TABLE IF NOT EXISTS concepts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text UNIQUE NOT NULL,
  name           text NOT NULL,
  emoji          text,
  category       text NOT NULL CHECK (category IN ('cocktail','celebration','traditional','after-party')),
  description    text,
  atmosphere     text[] DEFAULT '{}',
  musical_direction text[] DEFAULT '{}',
  cover_image_url text,
  color          text DEFAULT 'bg-secondary',
  is_dark        boolean DEFAULT false,
  is_signature   boolean DEFAULT false,
  energy_level   int DEFAULT 5,
  is_active      boolean DEFAULT true,
  sort_order     int DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON concepts FOR SELECT USING (is_active = true);

-- ── SEED ─────────────────────────────────────────────────────────────────────

INSERT INTO concepts (slug, name, emoji, category, description, atmosphere, musical_direction, color, is_dark, is_signature, energy_level, sort_order) VALUES

-- KOKTEYL & KARŞILAMA
('sohbet-arasi',      'Sohbet Arası',      '☕', 'cocktail',
 'Müziğin değil sohbetin ön planda olduğu rahat ve sosyal atmosfer. Misafirlerin birbirleriyle tanışmasına, rahatlamasına ve etkinliğe yavaşça adapte olmasına yardımcı olur.',
 ARRAY['Sosyal','Samimi','Rahat','Zamansız'], ARRAY['Lounge','Chill','Downtempo','Nu Jazz'],
 'bg-[oklch(0.95_0.012_80)]', false, false, 3, 10),

('sehirli-zarafet',   'Şehirli Zarafet',   '🥂', 'cocktail',
 'Minimal, rafine ve modern. Müzik ortamı doldurur ama asla dikkat dağıtmaz. Şehrin en şık kokteyl barlarını andıran atmosfer.',
 ARRAY['Şık','Modern','Zarif','Şehirli'], ARRAY['Deep House','Soulful House','Elegant House'],
 'bg-[oklch(0.93_0.006_240)]', false, false, 4, 20),

('gun-batimi',        'Gün Batımı',        '🌅', 'cocktail',
 'NOQT''un imza konsepti. Anadolu esintileri, organik ritimler ve modern elektronik müziğin birleştiği sıcak ve karakterli atmosfer. Atmosfer yaratır, dikkat çekmez.',
 ARRAY['Sıcak','Duygusal','Modern','Estetik'], ARRAY['Organic House','Afro House','Ethnic House'],
 'bg-[oklch(0.88_0.055_65)]', false, true, 5, 5),

('toprak-ritim',      'Toprak ve Ritim',   '🌿', 'cocktail',
 'Doğal perküsyonlar ve groove odaklı sıcak bir akış. Daha ritmik ama hala sohbet dostu. Toprağı, ormanı ve ritmi aynı anda hissettiren organik enerji.',
 ARRAY['Organik','Doğal','Akışkan','Modern'], ARRAY['Organic House','Afro House'],
 'bg-[oklch(0.88_0.035_120)]', false, false, 6, 30),

('anadolu-esintileri','Anadolu Esintileri','🧿', 'cocktail',
 'Anadolu, Akdeniz ve Orta Doğu etkilerinin modern elektronik müzikle buluştuğu kültürel ama çağdaş atmosfer. Köklü ama asla ağır değil.',
 ARRAY['Kültürel','Karakterli','Modern','Özgün'], ARRAY['Anatolian House','Ethnic House','World Music'],
 'bg-[oklch(0.87_0.045_50)]', false, false, 5, 40),

('caz-kulubu',        'Caz Kulübü',        '🎷', 'cocktail',
 'Caz, soul ve zamansız klasiklerle karakterli ve rafine bir karşılama. Zamanın durduğu, bir hikayenin içine çekildiğin atmosfer.',
 ARRAY['Zamansız','Klasik','Zarif','Derin'], ARRAY['Jazz','Soul','Bossa Nova','Neo Soul'],
 'bg-[oklch(0.91_0.015_70)]', false, false, 3, 50),

-- MODERN KUTLAMA
('karisik-kaset',     'Karışık Kaset',     '🎵', 'celebration',
 'Türkçe pop, global hitler, nostaljik favoriler ve dans pisti klasikleri. En güvenli ve en kapsayıcı seçenek. Karma kitleler için birebir.',
 ARRAY['Evrensel','Eğlenceli','Kapsayıcı','Sosyal'], ARRAY['Open Format','Mixed','Pop'],
 'bg-[oklch(0.93_0.012_70)]', false, false, 8, 110),

('disko-gecesi',      'Disko Gecesi',      '🪩', 'celebration',
 'Disco, funk ve nu-disco''nun zamansız enerjisi. Dans etmeye başlamak için cesaret gerektirmez. Herkes piste çeker.',
 ARRAY['Eğlenceli','Şık','Dans Odaklı','Nostaljik'], ARRAY['Disco','Funk','Nu-Disco'],
 'bg-[oklch(0.90_0.025_320)]', false, false, 8, 120),

('afro-ritimler',     'Afro Ritimler',     '🌍', 'celebration',
 'Perküsyon odaklı, groove güçlü, modern ve enerjik. Afrika ritimlerinin elektronik müzikle buluştuğu evrensel dans dili.',
 ARRAY['Enerjik','Özgür','Dans Odaklı','Modern'], ARRAY['Afro House','Afrobeat'],
 'bg-[oklch(0.86_0.04_100)]', false, false, 8, 130),

('kiz-kiza',          'Kız Kıza',          '👑', 'celebration',
 'Pop ikonları, guilty pleasures ve yüksek enerjili eşlik edilen şarkılar. Kutlama, özgürlük ve kolektif neşe için tasarlandı.',
 ARRAY['Güçlendirici','Oyuncu','Yüksek Enerji','Kutlama'], ARRAY['Pop','Dance Pop'],
 'bg-[oklch(0.90_0.04_350)]', false, false, 10, 140),

('kulup-modu',        'Kulüp Modu',        '⚡', 'celebration',
 'Modern House ve Tech House seçkileri. Dans pistini sürekli canlı tutar. Gece ilerledikçe yükselen enerji.',
 ARRAY['Modern','Enerjik','Gece Hayatı','Yoğun'], ARRAY['House','Tech House'],
 'bg-[oklch(0.20_0.025_260)]', true, false, 9, 150),

('melodik-gece',      'Melodik Gece',      '🌌', 'celebration',
 'Duygusal ama dans ettiren elektronik müzik. Gece boyunca sizi hem hissettirir hem hareket ettirir.',
 ARRAY['Duygusal','Akışkan','Modern','Derinlikli'], ARRAY['Melodic House','Melodic Techno'],
 'bg-[oklch(0.22_0.04_280)]', true, false, 7, 160),

('gece-akisi',        'Gece Akışı',        '🚀', 'celebration',
 'Yüksek enerjili Tech House deneyimi. Gece ilerledikçe yükselen kulüp enerjisi. Sabaha kadar devam eden ritim.',
 ARRAY['Yoğun','Özgür','Karanlık','Güçlü'], ARRAY['Tech House','Minimal House'],
 'bg-[oklch(0.12_0.008_45)]', true, false, 10, 170),

('kpop-party',        'K-Pop Party',       '🇰🇷', 'celebration',
 'Renkli, enerjik ve genç. K-Pop''un ikonik koreografileri ve yüksek üretim değerli müzikleriyle dolu bir kutlama.',
 ARRAY['Renkli','Enerjik','Genç','Eğlenceli'], ARRAY['K-Pop','Dance Pop'],
 'bg-[oklch(0.88_0.06_330)]', false, false, 10, 180),

('rock-klasikleri',   'Rock Klasikleri',   '🎸', 'celebration',
 'Rock tarihinin en sevilen şarkıları. Herkesin bildiği, birlikte söylediği o zamansız parçalar.',
 ARRAY['Güçlü','Özgür','Enerjik','Nostaljik'], ARRAY['Classic Rock','Alternative Rock'],
 'bg-[oklch(0.22_0.012_60)]', true, false, 8, 190),

-- GELENEKSEL
('halaylar',          'Halaylar',          '🔥', 'traditional',
 'Türkiye''nin en güçlü kolektif kutlama formatı. Herkesin elinden tuttuğu, birlikte aktığı anlar. Bir düğünü gerçek bir kutlamaya dönüştürür.',
 ARRAY['Kolektif','Neşeli','Coşkulu','Geleneksel'], ARRAY['Halay','Türk Halk Müziği'],
 'bg-[oklch(0.84_0.07_40)]', false, false, 9, 210),

('oyun-havalari',     'Oyun Havaları',     '🎉', 'traditional',
 'Ankara ve Kırşehir ağırlıklı oyun havaları. Düğünün en enerjik anlarını yaratır.',
 ARRAY['Neşeli','Hareketli','Geleneksel','Coşkulu'], ARRAY['Ankara Oyun Havası','Kırşehir'],
 'bg-[oklch(0.86_0.055_60)]', false, false, 9, 220),

('roman-atesi',       'Roman Ateşi',       '🕺', 'traditional',
 'Roman havaları ve yüksek enerji. Dans pistini ateşe verir. İsteseniz de istemeseniz de ayağa kalkarsınız.',
 ARRAY['Ateşli','Spontan','Enerjik','Neşeli'], ARRAY['Roman Havası'],
 'bg-[oklch(0.82_0.08_35)]', false, false, 10, 230),

('oryantal',          'Oryantal',          '💃', 'traditional',
 'Klasik düğün enerjisi. Oryantal ritimler ve dans kültürümüzün vazgeçilmez parçası.',
 ARRAY['Feminen','Eğlenceli','Geleneksel','Canlı'], ARRAY['Oriental','Arabesk'],
 'bg-[oklch(0.88_0.04_80)]', false, false, 8, 240),

('arap-esintileri',   'Arap Esintileri',   '🌙', 'traditional',
 'Arabic pop ve kutlama müziklerinin coşkulu havası. Orta Doğu''nun neşeli ve enerjik kutlama kültürü.',
 ARRAY['Coşkulu','Egzotik','Kutlama','Neşeli'], ARRAY['Arabic Pop','Khaleeji'],
 'bg-[oklch(0.22_0.045_65)]', true, false, 8, 250),

('horon',             'Horon',             '🌊', 'traditional',
 'Karadeniz''in özgün enerjisi. Hızlı ritimler, omuz omuza dans ve kolektif coşku.',
 ARRAY['Coşkulu','Özgün','Kolektif','Hareketli'], ARRAY['Horon','Karadeniz Müziği'],
 'bg-[oklch(0.88_0.05_220)]', false, false, 10, 260),

-- AFTER PARTY
('duezler-kaseti',    '2000''ler Kaseti',  '📼', 'after-party',
 'Global 2000''ler hitleri. Anında tanınma ve maksimum katılım. Herkesin bildiği, herkesin söylediği o şarkılar.',
 ARRAY['Nostaljik','Eğlenceli','Tanıdık','Enerjik'], ARRAY['2000s Pop','R&B','Hip Hop'],
 'bg-[oklch(0.92_0.03_55)]', false, false, 10, 310),

('karisik-kaset-after','Karışık Kaset',    '🎵', 'after-party',
 'Türkçe pop, global hitler ve sürpriz favorilerin after party versiyonu. Herkes için bir şeyler var.',
 ARRAY['Evrensel','Eğlenceli','Sürprizli'], ARRAY['Open Format','Mixed'],
 'bg-[oklch(0.93_0.01_70)]', false, false, 9, 320),

('duezler-turkce-pop','2000''ler Türkçe Pop','💿','after-party',
 '2000''lerin unutulmaz Türkçe hitleri. Sing-along garantili, dans pisti dolu.',
 ARRAY['Nostalji','Kutlama','Tanıdık','Eğlenceli'], ARRAY['Türkçe Pop','2000s'],
 'bg-[oklch(0.90_0.02_140)]', false, false, 9, 330),

('doksanlar-turkce-pop','90''lar Türkçe Pop','🎤','after-party',
 'Bir neslin ortak hafızası. Tarkan''dan Sertab''a. Herkesin birlikte söylediği o anlar.',
 ARRAY['Kolektif','Nostaljik','Sıcak','Coşkulu'], ARRAY['Türkçe Pop','90s'],
 'bg-[oklch(0.91_0.025_200)]', false, false, 8, 340),

('yazlik-hitler',     'Yazlık Hitler',     '🌴', 'after-party',
 'Yaz akşamlarını hatırlatan iyi hissettiren şarkılar. Güneş batmış ama yaz hala devam ediyor.',
 ARRAY['Hafif','Neşeli','Özgür','Romantik'], ARRAY['Summer Pop','Tropical'],
 'bg-[oklch(0.91_0.04_90)]', false, false, 7, 350),

('hiphop-rnb',        'Hip Hop & R&B',     '🎧', 'after-party',
 'Sahnenin en büyük isimlerinden sofistike ve enerjik bir after party seçkisi.',
 ARRAY['Sofistike','Enerjik','Cool','Modern'], ARRAY['Hip Hop','R&B'],
 'bg-[oklch(0.18_0.01_260)]', true, false, 8, 360),

('gece-kulubu',       'Gece Kulübü',       '🌃', 'after-party',
 'Kulüp enerjisiyle devam eden after party. Sabaha kadar süren dans ve ritim.',
 ARRAY['Karanlık','Enerjik','Yoğun','Özgür'], ARRAY['House','Tech House','Club'],
 'bg-[oklch(0.14_0.01_260)]', true, false, 10, 370),

('disko-sonrasi',     'Disko Sonrası',     '🪩', 'after-party',
 'Disko enerjisinin geceye uzanan versiyonu. Sahadan ayrılmak istemeyenler için.',
 ARRAY['Dans Odaklı','Enerjik','Nostaljik','Eğlenceli'], ARRAY['Disco','Nu-Disco','Funk'],
 'bg-[oklch(0.88_0.03_310)]', false, false, 9, 380),

('dunya-turu',        'Dünya Turu',        '🌍', 'after-party',
 'Latin, Balkan, Akdeniz ve dünya müziklerinden oluşan eğlenceli yolculuk. Her şarkı başka bir kıtaya götürür.',
 ARRAY['Maceraperest','Eğlenceli','Renkli','Evrensel'], ARRAY['Latin','World Music','Balkan','Mediterranean'],
 'bg-[oklch(0.87_0.04_165)]', false, false, 8, 390),

('cocuklara-ozel',    'Çocuklara Özel',    '🎠', 'after-party',
 'Minik misafirler için özenle hazırlanmış, hem çocukları hem büyükleri dans ettiren neşeli seçki.',
 ARRAY['Neşeli','Masumane','Eğlenceli','Renkli'], ARRAY['Çocuk Müziği','Pop','Animasyon Müzikleri'],
 'bg-[oklch(0.94_0.04_140)]', false, false, 7, 400);
