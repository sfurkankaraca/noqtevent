-- ============================================================
-- NOQT — Kayseri Partner Seed Data
-- Supabase Dashboard > SQL Editor'da çalıştır
-- Görseller admin panelinden eklenecek
-- ============================================================

INSERT INTO partner_profiles (clerk_id, company_name, description, service_category, services, contact_email, contact_phone, is_active)
VALUES

-- ── MEKAN ──────────────────────────────────────────────────────

('seed-erciyes-binicilik', 'Erciyes Binicilik Balo & Davet Salonu',
 'Kayseri''nin prestijli düğün mekanlarından biri. At çiftliği atmosferinde, doğayla iç içe 300-800 kişilik kapasitesiyle görkemli düğünlere ev sahipliği yapıyor.',
 'Mekan',
 '[{"name":"Düğün Paketi (yemekli)","price_range":"Kişi başı ₺950"},{"name":"Kına Gecesi","price_range":"Fiyat alınız"},{"name":"Açık Alan Etkinlik","price_range":"Fiyat alınız"}]',
 NULL, NULL, true),

('seed-tulpar-binicilik', 'Tulpar Binicilik Ziyafet ve Balo Salonları',
 'Kayseri''nin en lüks düğün salonlarından. 200-1800 kişilik kapasitesiyle büyük organizasyonlara uygun, at binicilik alanıyla eşsiz bir atmosfer sunuyor.',
 'Mekan',
 '[{"name":"Düğün Paketi","price_range":"₺150.000''den başlıyor"},{"name":"Kurumsal Etkinlik","price_range":"Fiyat alınız"}]',
 NULL, NULL, true),

('seed-diva-premium', 'Diva Premium Düğün Salonu',
 'Talas''ın şık düğün salonlarından Diva Premium, 100-600 kişilik kapasitesi ve modern tasarımıyla öne çıkıyor. 5.0 puanla Kayseri''nin en beğenilen salonlarından.',
 'Mekan',
 '[{"name":"Düğün Paketi","price_range":"₺65.000''den başlıyor"},{"name":"Nişan / Söz","price_range":"Fiyat alınız"}]',
 NULL, NULL, true),

('seed-ideal-garden', 'İdeal Garden My Berra',
 'Melikgazi''de 50-1200 kişilik kapasitesiyle kır düğünü ve balo seçenekleri sunan İdeal Garden, açık ve kapalı alanlarıyla her mevsim hizmet veriyor.',
 'Mekan',
 '[{"name":"Kır Düğünü","price_range":"Kişi başı ₺600"},{"name":"Kapalı Salon","price_range":"Kişi başı ₺850"}]',
 NULL, NULL, true),

('seed-bebektepe', 'Bebektepe Kır Bahçesi Düğün Salonu',
 'Melikgazi''nin doğa içinde saklı kır bahçesi. 2000 kişilik kapasitesiyle Kayseri''nin en büyük açık hava düğün mekanlarından.',
 'Mekan',
 '[{"name":"Kır Düğünü","price_range":"Kişi başı ₺720''den başlıyor"}]',
 NULL, NULL, true),

('seed-florya-deluxe', 'Florya Deluxe Ziyafet ve Balo Salonu',
 'Kocasinan''da 700 kişilik kapalı davet alanı, fotoğraf köşesi ve after party hizmetiyle tam kapsamlı düğün deneyimi sunan prestijli salon.',
 'Mekan',
 '[{"name":"Düğün Paketi","price_range":"₺70.000''den başlıyor"},{"name":"After Party","price_range":"Fiyat alınız"}]',
 NULL, NULL, true),

-- ── GÖRSEL & VİDEO ─────────────────────────────────────────────

('seed-aydogan-ekici', 'Aydoğan Ekici Fotoğraf Stüdyosu',
 'Kocasinan merkezli, sahici anları yakalamaya odaklanan profesyonel düğün fotoğrafçısı. Albüm, dış çekim ve stüdyo çekimlerinde uzman.',
 'Görsel & Video',
 '[{"name":"Düğün Fotoğraf Paketi","price_range":"₺19.999 (paket)"},{"name":"Dış Çekim","price_range":"Fiyat alınız"},{"name":"Stüdyo Çekimi","price_range":"Fiyat alınız"}]',
 NULL, NULL, true),

('seed-kaya-film', 'Kaya Film Wedding',
 'Kocasinan''da modern medya yaklaşımıyla sinematik düğün fotoğrafları ve videolar üretiyor. Premium paket kapsamında lüks araç hizmeti de sunuluyor.',
 'Görsel & Video',
 '[{"name":"Fotoğraf + Video Paketi","price_range":"Fiyat alınız"},{"name":"Drone Çekim","price_range":"Fiyat alınız"}]',
 NULL, NULL, true),

('seed-studio-tek', 'Stüdyo Tek — Ersin Korkut',
 'Melikgazi''de 5.0 puanla değerlendirilen, müşteri memnuniyetine odaklanan düğün fotoğraf ve video stüdyosu. Tam gün çekim hizmeti.',
 'Görsel & Video',
 '[{"name":"Tam Gün Düğün Çekimi","price_range":"Fiyat alınız"},{"name":"Düğün Albümü","price_range":"Fiyat alınız"}]',
 NULL, NULL, true),

('seed-foto-mustafa', 'Foto Mustafa',
 '1976''dan bu yana Kayseri''de hizmet veren köklü fotoğraf stüdyosu. Geleneksel ustalık ve modern tekniği bir arada sunan deneyimli ekip.',
 'Görsel & Video',
 '[{"name":"Düğün Fotoğraf Çekimi","price_range":"₺9.900''den başlıyor"},{"name":"Etkinlik Çekimi","price_range":"Fiyat alınız"}]',
 NULL, NULL, true),

-- ── ÇİÇEK & DEKOR ──────────────────────────────────────────────

('seed-hayal-cicek', 'Hayal Çiçek',
 'Kocasinan''da gelin-damat buketleri ve etkinlik çiçek düzenlemelerinde uzman çiçekçi. Profesyonel düğün çiçeği hizmetiyle öne çıkıyor.',
 'Çiçek & Dekor',
 '[{"name":"Gelin Buketi","price_range":"Fiyat alınız"},{"name":"Salon Çiçek Dekorasyonu","price_range":"Fiyat alınız"},{"name":"Araç Süsleme","price_range":"Fiyat alınız"}]',
 NULL, NULL, true),

('seed-vizyon-cicek', 'Vizyon Çiçekçilik',
 'Modern tasarımları ve rekabetçi fiyatlarıyla Kayseri''nin düğün çiçeği sektöründe öne çıkan deneyimli firma.',
 'Çiçek & Dekor',
 '[{"name":"Gelin Buketi","price_range":"Fiyat alınız"},{"name":"Masa Süslemesi","price_range":"Fiyat alınız"}]',
 NULL, NULL, true),

('seed-moda-cicek', 'Moda Çiçekcilik',
 'Melikgazi merkezli, gelin buketleri, araç dekorasyonu ve etkinlik çiçeklerinde geniş ürün yelpazesiyle hizmet veren çiçekçi.',
 'Çiçek & Dekor',
 '[{"name":"Gelin & Damat Buketi","price_range":"Fiyat alınız"},{"name":"Araç Dekorasyonu","price_range":"Fiyat alınız"}]',
 NULL, NULL, true),

-- ── STİL & GÜZELLİK ────────────────────────────────────────────

('seed-royal-derm', 'Royal Derm Güzellik Salonu & Spa',
 '2013''ten bu yana Kocasinan''da uzman ve profesyonel kadrosuyla hizmet veren güzellik salonu. Gelin saçı, makyaj ve spa hizmetleri sunuyor.',
 'Stil & Güzellik',
 '[{"name":"Gelin Saçı & Makyaj","price_range":"Fiyat alınız"},{"name":"Spa & Bakım","price_range":"Fiyat alınız"}]',
 NULL, NULL, true),

('seed-koket-kuafor', 'Koket Kuaför',
 'Kocasinan''da gelin hazırlığından bakım ve epilasyona uzanan kapsamlı hizmet yelpazesiyle düğün günü hazırlıklarında güvenilir isim.',
 'Stil & Güzellik',
 '[{"name":"Gelin Saçı & Makyaj","price_range":"Fiyat alınız"},{"name":"Bakım Paketleri","price_range":"Fiyat alınız"}]',
 NULL, NULL, true),

('seed-vip-venus', 'VIP Venüs Güzellik Salonu',
 'Melikgazi''de uzman kuaför ve makyöz ekibiyle gelin hazırlığında 5.0 puanla değerlendirilen butik güzellik salonu.',
 'Stil & Güzellik',
 '[{"name":"Gelin Saçı & Makyaj","price_range":"Fiyat alınız"}]',
 NULL, NULL, true),

('seed-seda-bayer', 'Seda Bayer Makeup Studio',
 'Kayseri''de profesyonel gelin makyajı ve etkinlik makyajı konusunda uzmanlaşmış bağımsız makyöz stüdyosu.',
 'Stil & Güzellik',
 '[{"name":"Gelin Makyajı","price_range":"Fiyat alınız"},{"name":"Kına & Nişan Makyajı","price_range":"Fiyat alınız"}]',
 NULL, NULL, true);
