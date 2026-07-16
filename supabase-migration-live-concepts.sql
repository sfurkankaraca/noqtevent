-- ============================================================
-- NOQT — Canlı Müzik konseptleri (DJ/Canlı Müzik ayrımı için)
-- Supabase Dashboard > SQL Editor'da çalıştır
-- Bu konseptler kodda (PlannerStore.ts) zaten tanımlı ama concepts
-- tablosuna hiç eklenmemişti — bu yüzden planlayıcıda "Canlı Müzik"
-- seçildiğinde hiç konsept görünmüyordu.
-- ============================================================

INSERT INTO concepts (slug, name, emoji, category, description, atmosphere, musical_direction, color, is_dark, is_signature, energy_level, sort_order) VALUES

('akustik-sohbet', 'Akustik Sohbet', '🎸', 'cocktail',
 'Canlı gitar ve vokal düetiyle sıcak, samimi bir karşılama. Sohbeti bastırmayan, tam tersine atmosferi zenginleştiren akustik bir eşlik.',
 ARRAY['Sıcak','Samimi','Canlı','Zamansız'], ARRAY['Akustik Pop','Cover','Unplugged'],
 'bg-[oklch(0.92_0.03_75)]', false, false, 3, 55),

('yayli-calgilar', 'Yaylı Çalgılar Zarafeti', '🎻', 'cocktail',
 'Keman ve çello eşliğinde klasik, zarif bir karşılama. Şıklığı ve inceliği bir arada hissettiren asil bir atmosfer.',
 ARRAY['Zarif','Klasik','Şık','Asil'], ARRAY['Klasik','Enstrümantal Pop Cover','Film Müzikleri'],
 'bg-[oklch(0.93_0.008_280)]', false, false, 2, 60),

('canli-caz-trio', 'Canlı Caz Trio', '🎹', 'cocktail',
 'Piyano, bas ve vokalden oluşan canlı caz trio. Karakterli, rafine ve zamansız bir kokteyl atmosferi.',
 ARRAY['Zamansız','Rafine','Canlı','Derin'], ARRAY['Jazz','Soul','Bossa Nova'],
 'bg-[oklch(0.91_0.015_70)]', false, false, 4, 65),

('turkce-pop-canli-grup', 'Türkçe Pop Canlı Grup', '🎤', 'celebration',
 'Canlı vokal, gitar, bas ve davuldan oluşan grup eşliğinde Türkçe pop coverlar. Sahne enerjisi ve canlı performansın gücünü bir arada sunar.',
 ARRAY['Enerjik','Canlı','Kapsayıcı','Sahne Odaklı'], ARRAY['Türkçe Pop','Cover','Canlı Performans'],
 'bg-[oklch(0.90_0.03_55)]', false, false, 8, 115),

('uluslararasi-cover-grubu', 'Uluslararası Cover Grubu', '🎺', 'celebration',
 'Global hitlerden Latin ritimlere geniş bir repertuvarı canlı seslendiren profesyonel cover grubu. Sahne şovuyla dans pistini canlı tutar.',
 ARRAY['Kozmopolit','Enerjik','Canlı','Şaşırtıcı'], ARRAY['Pop Cover','Latin','Funk','Canlı Performans'],
 'bg-[oklch(0.89_0.035_320)]', false, false, 9, 120)

ON CONFLICT (slug) DO NOTHING;
