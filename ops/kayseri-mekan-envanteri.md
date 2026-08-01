# Kayseri Mekan Envanteri — Etkinlik Keşfi Soğuk Başlangıç Verisi

Derleme tarihi: 2026-08-01. Yöntem: web araması (WebSearch/WebFetch) — Google/Bing sonuçları,
mekanlar.com / tavsiyemiz.com / gezimanya.com / gezinomi.com gibi dizin siteleri, Instagram/Facebook
resmi hesapları, Yandex Haritalar, Foursquare, TripAdvisor, resmi işletme siteleri (fier.com.tr,
dedeman.com, jollyjoker.com.tr, erciyeskulturmerkezi.com vb.).

Kapsam kararı (görev tanımından): canlı müzik yapan bar/pub/meyhane/sahneli kafe, DJ geceleri yapan
kulüp/bar, karaoke/quiz/tema gecesi mekanları, konser salonları/performans sahneleri. Restoran
(sahnesiz), tiyatro, sinema, sergi, düğün salonu KAPSAM DIŞI.

Güven tanımı:
- **Yüksek**: en az 2 bağımsız kaynak (resmi site/instagram + bağımsız dizin/haber) birbirini
  doğruluyor, adres/telefon en az bir kaynakta net.
- **Orta**: tek güçlü kaynak (resmi instagram/site VEYA tutarlı dizin kaydı) var ama çapraz
  doğrulama sınırlı, ya da adres bilgisinde küçük tutarsızlık var.
- **Düşük**: yalnızca bir dizin listesinde adı geçiyor, adres/telefon/instagram doğrulanamadı,
  veya kategorisi (canlı müzik/DJ var mı) şüpheli.

---

## Ana Envanter (Güven: Yüksek + Orta) — SQL seed'e aday

| Ad | Semt/İlçe | Tür | Instagram | Telefon | Kaynak(lar) | Güven | Not |
|---|---|---|---|---|---|---|---|
| Harman Pub | Melikgazi/Kocasinan sınırı (İstasyon Cad. No:5/B) | bar | bulunamadı | bulunamadı | [Foursquare](https://tr.foursquare.com/v/harman-pub/4e6ce71de4cd4bedebd23843), [Facebook](https://www.facebook.com/p/Harman-pub-100067156144979/), [tavsiyemiz.com](https://tavsiyemiz.com/hizmetler/barlar/kayseri), [gezimanya.com](https://gezimanya.com/turkiye/kayseride-gece-hayati-0) | Yüksek | Öğrenci/genç kitleye hitap eden köklü canlı müzik pub'ı; kesin ilçe (Melikgazi mi Kocasinan mı) teyit edilemedi |
| JJ Pub Kayseri (Jolly Joker) | Kocasinan (Gevher Nesibe Mah. İstasyon Cad. No:3, Wyndham Grand Otel içi) | club | [@jjpubkayseri](https://www.instagram.com/jjpubkayseri/) | +90 850 549 01 45 | [Resmi site](https://jjpubkayseri.jollyjoker.com.tr/), [biletinial](https://biletinial.com/tr-tr/mekan/jolly-joker-pub-kayseri), [biletimgo](https://www.biletimgo.com/mekan/jolly-joker-pub-kayseri-86) | Yüksek | Zincir konsept; düzenli sahne performansı/konser var |
| Roof Lounge (Radisson Blu) | Melikgazi (Hunat) | bar | bulunamadı | bulunamadı | [gezinomi.com](https://www.gezinomi.com/gezi-rehberi/kayseri-nin-gece-hayati-hakkinda-merak-ettikleriniz.html), [mekanlar.com](https://mekanlar.com/kayseri/gece-hayati) | Orta | Hafta sonu 21:30–24:00 canlı müzik; otel çatı barı |
| The Godfather Cafe (Talas) | Talas (Atatürk Bul. No:21) | stage_cafe | [@thegodfathertalas](https://www.instagram.com/thegodfathertalas/) | bulunamadı | [Instagram](https://www.instagram.com/thegodfathertalas/), [Yandex Haritalar](https://yandex.com.tr/maps/org/the_godfather_/54463145659/), [restoranim.net](https://restoranim.net/kayseri/talas/kafe/the-godfather-cafe-restaurant) | Yüksek | Her gün 19:00–23:00 rock/pop ağırlıklı canlı müzik; öğrenci/genç kitle |
| Bigbosstalas | Talas (Yenidoğan Mah. Atatürk Cad., OPET karşısı) | stage_cafe | [@bigbosstalas](https://www.instagram.com/bigbosstalas/) | 0552 575 2495 | [Instagram](https://www.instagram.com/bigbosstalas/), Instagram reels | Yüksek | Her akşam canlı müzik konsepti |
| Seyir Teras & Cafe / Seyir Cafe & Restaurant (Talas) | Talas (Tablakaya Mah. Yukarı Talas Cad. No:2) | stage_cafe | bulunamadı | 438 08 80 (alan kodu doğrulanmalı, muhtemelen +90 352) | [restoranindirimi.com](https://www.restoranindirimi.com/seyir-restaurant-kayseri-adres-30937), [Foursquare](https://tr.foursquare.com/v/seyir-cafe--restaurant/4d9f532a7ec88cfa6f00815a), [mekan.com](https://m.mekan.com/mekan/seyir-cafe-restaurant) | Orta | Kaynaklar arasında adres tutarsızlığı var — bazı dizinler "230 A Atatürk Bulvarı Yukarı Mahalle" diyor, bazıları "Tablakaya Mah. Yukarı Talas Cad. No:2"; aynı mekanın iki farklı adı/adresi mi yoksa iki ayrı mekan mı belirsiz, kurucu sahada doğrulamalı. Canlı müzik + DJ performansı var |
| Mavera Mürüvvet Hanım Konağı | Talas | stage_cafe | [@maveramhk](https://www.instagram.com/maveramhk/) | 0553 695 67 58 | [Resmi site](https://kayserimaveramhk.com/kayseri-canli-muzik-mekanlari), [Facebook](https://www.facebook.com/maveramhk/), Instagram | Yüksek | Türk sanat müziği, akustik caz, klasik pop; belirli günlerde canlı müzik, rezervasyon öneriliyor |
| Heybe Cafe (Canlı Müzik) | Melikgazi (Hunat, Sivas Blv. No:10B) | stage_cafe | [@heybecafe](https://www.instagram.com/heybecafe/) | 222 08 94 (alan kodu eksik, muhtemelen +90 352) | [Foursquare](https://tr.foursquare.com/v/heybe-cafe/507ec1bee4b0894ae74bdd03), [Facebook](https://www.facebook.com/p/HEYBE-CAFE-CANLI-M%C3%9CZ%C4%B0K-100067038451368/), Instagram | Yüksek | Haftanın 7 günü canlı müzik iddiası |
| M&M Black Rose | Talas (Kiçi Köy Mah. Ali Saip Paşa Cad. Osmanlı Sok. No:23) | stage_cafe | [@mmblackrose](https://www.instagram.com/mmblackrose/) | bulunamadı | [Yandex Haritalar](https://yandex.com.tr/maps/org/mm_black_rose_kayseri_canli_muzik/51357424693/), [Foursquare](https://tr.foursquare.com/v/black-rose/4fef5787e4b0f34ae6fe7417), Instagram | Orta | Osmanlı Sokağı'nda canlı müzik konsepti; eski adı sadece "Black Rose" olabilir |
| Roof 11 by Dedeman | Melikgazi (Esentepe Mh. Ahmet Gazi Ayhan Blv. No:161) | bar | [@roof11kayseri](https://www.instagram.com/roof11kayseri/) | bulunamadı | [Dedeman resmi site](https://www.dedeman.com/eatdrink/roof-11-by-dedeman/62), Instagram | Yüksek | Otel çatı barı; "müzik dolu" gece etkinlikleri düzenli paylaşılıyor |
| FiER Roof Restaurant | Kocasinan (Mimarsinan Mah. Bozantı Cd. No:184, FiER Life Center) | stage_cafe | [@fierroof.kayseri](https://www.instagram.com/fierroof.kayseri/) | +90 352 333 36 36 (mobil: 0533 145 13 73) | [Resmi site](https://fier.com.tr/en/roof/), [TripAdvisor](https://www.tripadvisor.com.tr/LocationPhotoDirectLink-g297984-d12035169-i424189794-FiER_Roof_Restaurant-Kayseri_Kayseri_Province.html) | Yüksek | Hafta içi her gün + Cumartesi canlı müzik, 15:00–02:00 |
| Piyano Club (İncesu) | İncesu (Süksün Cumhuriyet, Kayseri Kırşehir Yolu) | club | bulunamadı | 0532 731 59 58 | [Foursquare](https://tr.foursquare.com/v/piyano-club/51a134c3498e38db1464d0ee), [Yandex Haritalar](https://yandex.com.tr/maps/org/piyano_bar_club/177063092645/), [mekanlar.com](https://mekanlar.com/mekan/piyano-club) | Orta | 20:00–04:00 açık, canlı müzik + mavi ışıklı gece kulübü atmosferi |
| Vocal Karaoke Party House (Kayseri Karaoke & Party House) | Kocasinan (Sanayi, Çimen Sk.) | other (karaoke) | [@karaokevocalkayseri](https://www.instagram.com/karaokevocalkayseri/) | 0545 104 06 05 | [kayserietkinlik.com](https://www.kayserietkinlik.com/hizmetdetay/vocal-karaoke), Instagram, [mappa](https://mt.maptons.com/p/12797731747) | Orta | VIP oda kiralama, özel etkinlik hizmeti |
| Piano Karaoke Party House | İlçe bulunamadı (Yıldırım Beyazıt Mah. Sivas Bulvarı, Optimal AVM No:230) | other (karaoke) | [@karaokepianokayseri](https://www.instagram.com/karaokepianokayseri/) | 0554 496 06 05 | [kayserietkinlik.com](https://www.kayserietkinlik.com/hizmetdetay/piano-karaoke), [Yandex Haritalar](https://yandex.com.tr/maps/org/kayseri_karaoke_piano_party/21588095287/), Instagram | Orta | Vocal Karaoke ile aynı işletme grubu (Truva Grup) olabilir — kurucu doğrulamalı |
| WİNX Karaoke Salonu | Kocasinan (Fevzi Çakmak, Çoruh Cad. 38/A) | other (karaoke) | [@winxclupkaraoke](https://www.instagram.com/winxclupkaraoke/) | 0530 086 01 38 | Instagram, arama sonuçları (denizpostasi.com listesi) | Orta | Adres/telefon tek kaynaktan (yalnız arama snippet'i), doğrulama önerilir |
| Çamlıca Cafe & Bistro (Canlı Müzik) | Talas (Tablakaya) | stage_cafe | [@camlicacafebistro](https://www.instagram.com/camlicacafebistro/) | bulunamadı | [restaurantguru.com](https://restaurantguru.com/Camlica-Cafe-Bistro-Canli-Muzik-Kayseri), [Foursquare](https://tr.foursquare.com/camlcaca5457462) | Orta | Akşamları canlı müzik; Manisa'da aynı isimli farklı bir şube de var, karıştırılmamalı |
| Erciyes Kültür Merkezi (EKM) | Melikgazi (Köşk, Talas Blv. No:65) | concert_hall | bulunamadı | +90 352 438 28 28 | [Resmi site](https://erciyeskulturmerkezi.com/), [Bubilet](https://www.bubilet.com.tr/mekan/ekm-erciyes-kultur-merkezi), [biletinial](https://biletinial.com/tr-tr/kino/kayseri-erciyes-kultur-merkezi) | Yüksek | ~1600 kişilik ana salon; kongre merkezi niteliğinde kamu/özel karma tesis — görev tanımına göre düşük öncelikli ama geçerli |

---

## Doğrulanmalı — Düşük Güven veya Kapanmış Olabilir

Bu satırlar SQL seed'e DAHİL EDİLMEDİ. Ya tek kaynaktan geliyor, ya adres/telefon/instagram
doğrulanamadı, ya da canlı müzik/DJ kapsamı şüpheli.

| Ad | Semt/İlçe | Tür (tahmini) | Kaynak(lar) | Not |
|---|---|---|---|---|
| Kale Roof Bar (Hilton) | Merkez/Melikgazi (Cumhuriyet Meydanı, İstasyon Cad. 1) | bar | [TripAdvisor](https://www.tripadvisor.com.tr/Restaurant_Review-g297984-d10431952-Reviews-Kale_Roof_Bar_Restaurant-Kayseri_Kayseri_Province.html), [Yelp](https://www.yelp.com/biz/kale-roof-restaurant-kayseri) | **KAPANMIŞ OLABİLİR** — bir kaynak "may be permanently closed" notu düşüyor; canlı müzik geçmişte vardı (2018 Instagram gönderisi). Kurucu telefonla teyit etmeli: +90 352 207 50 00 |
| Trafo Bar | Kocasinan (Yıldızevler) | bar | [mekanlar.com](https://mekanlar.com/kayseri/bar) | Yalnız bir dizin listesinde; Instagram/telefon bulunamadı, canlı müzik/DJ olup olmadığı teyit edilemedi |
| Yeşilgöl Night Club | Kocasinan (Cırgalan Mah. Küme Evler No.333) | club | [Facebook](https://www.facebook.com/emreorakyesilgol/), [turkeyturism.com](https://entertainment.turkeyturism.com/en/yesil-gol-night-club-90-352-243-17-70.html) | Bir dizin sitesi bu mekanı "Adult Entertainment" kategorisinde listeliyor — NOQT kapsamına (canlı müzik/DJ) uyup uymadığı belirsiz, kurucu doğrulamalı |
| Mest-i Mekan Karaoke | Bulunamadı | other (karaoke) | [Facebook](https://www.facebook.com/125236914221498/) | "Kayseri'nin ilk karaoke barı" iddiası var ama adres/telefon bulunamadı |
| Jimmy Joker (Coffee's) | Kocasinan (Şeker) | stage_cafe (tahmini) | [mekanlar.com](https://mekanlar.com/kayseri/gece-hayati), [Facebook](https://www.facebook.com/coffe38/) | Canlı müzik iddiası var ama tek kaynak, adres net değil |
| JADE LOUNGE by mrJADE | Kocasinan (Oymaağaç) | other (nargile lounge) | [mekanlar.com](https://mekanlar.com/kayseri/gece-hayati), [Facebook](https://www.facebook.com/jadeloungee/) | Steakhouse/nargile lounge konsepti — canlı müzik/DJ kapsamı şüpheli |
| Green Paradise | Kocasinan (Cumhuriyet) | other | [mekanlar.com](https://mekanlar.com/kayseri/gece-hayati) | Yalnız dizin listesinde adı geçiyor |
| Deep Lounge | Melikgazi (Alpaslan) | bar/lounge | [mekanlar.com](https://mekanlar.com/kayseri/gece-hayati) | Aynı isimli İstanbul (Ümraniye) mekanıyla karıştırılabilir; Kayseri'deki hesabı bulunamadı |
| Heaven Cafe & Bistro | Melikgazi (Alpaslan) | other | [mekanlar.com](https://mekanlar.com/kayseri/gece-hayati) | Canlı müzik/DJ kapsamı teyit edilemedi |
| Cihan Bakeryhouse & Cafe | Melikgazi (Alpaslan) | other | [mekanlar.com](https://mekanlar.com/kayseri/gece-hayati) | Fırın/kafe konsepti — sahne/canlı müzik şüpheli, muhtemelen kapsam dışı |
| Retro Cuisine | Melikgazi (Alpaslan) | other | [mekanlar.com](https://mekanlar.com/kayseri/gece-hayati) | Canlı müzik/DJ kapsamı teyit edilemedi |
| Karizma Bar | Erciyes bölgesi | bar | [gezimanya.com](https://gezimanya.com/turkiye/kayseride-gece-hayati-0) | Adres/telefon/instagram bulunamadı |
| Ozzy Club | Erciyes bölgesi | club | [gezimanya.com](https://gezimanya.com/turkiye/kayseride-gece-hayati-0) | Adres/telefon/instagram bulunamadı |
| Urfa Fıçı Bira | Melikgazi (Gökdelen İş Hanı civarı) | bar (pub) | [restaurantguru.com](https://restaurantguru.com/Urfa-Fici-Bira-Kayseri) | Instagram/telefon bulunamadı, canlı müzik/DJ kapsamı teyit edilemedi |
| SineMasal Bistro | Merkez | other | [ohgeceler.com üzerinden ikincil arama sonucu](https://gezimanya.com/turkiye/kayseride-gece-hayati-0) | Adres bulunamadı |
| Kaşık-La Restaurant | Merkez | restoran (muhtemelen kapsam dışı) | Genel arama snippet'leri | Restoran ağırlıklı — sahne/canlı müzik teyit edilmedi, kapsam dışı olabilir |
| Mills Cafe (Cafe Mills) | Merkez (Cumhuriyet Meydanı) | other | [gezimanya.com](https://gezimanya.com/turkiye/kayseride-gece-hayati-0) | "Kaliteli akşam eğlencesi" deniyor ama canlı müzik/DJ net değil |
| Gönül Kahvesi | Melikgazi (Alpaslan) | other | [gezimanya.com](https://gezimanya.com/turkiye/kayseride-gece-hayati-0) | Kahvehane konsepti — muhtemelen kapsam dışı |
| 5X Karaoke Cafe Bistro | Bulunamadı | other (karaoke) | [Foursquare](https://tr.foursquare.com/v/5x-karaoke-cafe/54d4fe5c498e189aaea1318c), [dugun.com](https://dugun.com/kina-ve-bekarliga-veda-mekan/kayseri/5x-karaoke-cafe-bistro) | Adres/telefon net değil; düğün/kına organizasyon mekanı olarak da pazarlanıyor |
| Club Armoni | Bulunamadı | club (tahmini) | [Facebook snippet](https://www.facebook.com/hanifi.erkul/posts/) | "Piyano eğlence merkezi disko taverna restorant canlı müzik" iddiası, tek kaynak, adres yok |

---

## Kapsama Değerlendirmesi (Dürüst Özet)

**Ne kadarı bulunabildi:** Web araması ile toplam ~36 aday mekan tespit edildi; bunlardan 17'si
(9 yüksek + 8 orta güven) SQL seed'e uygun görüldü. Kayseri merkez (Melikgazi/Kocasinan) ve Talas
bölgesindeki büyük/orta ölçekli, dijital varlığı (Instagram/resmi site/dizin kaydı) olan mekanlar
makul ölçüde yakalandı. Talas özellikle iyi kapsandı (Godfather, Bigboss, MM Black Rose, Mavera,
Seyir, Çamlıca) — bu bölge zaten "öğrenci/gece hayatı yoğun" olarak biliniyor ve arama sonuçları
bunu doğruladı.

**Muhtemelen eksik kalan türler:**
1. **Yalnızca Instagram'da var olan küçük/orta mekanlar** — kendi web sitesi veya dizin kaydı
   olmayan, tanıtımını sadece Instagram Reels/Story üzerinden yapan yeni açılan barlar/kafeler.
   Web araması bunları büyük ölçüde göremez (arama motorları Instagram içeriğini sınırlı indeksliyor).
2. **Öğrenci mahallelerindeki küçük "türkü barlar" ve pub'lar** — Erciyes Üniversitesi kampüsü
   çevresi (Talas/Melikgazi) muhtemelen yalnız Google Maps/Yandex Haritalar'da kayıtlı, isim bazlı
   arama yapılmadan bulunamayan onlarca küçük mekan barındırıyor.
3. **DJ gecesi yapan ama "bar/club" olarak kendini tanımlamayan mekanlar** (örn. bazı nargile
   kafeler, bazı restoran-bar hibritleri) — kategori etiketleme dizinlerde tutarsız, bu yüzden
   arama sorgularıyla sistematik olarak taranamadı.
4. **Kayseri'nin dışa kapalı/davetiye usulü çalışan gece kulüpleri** — varsa, web'de neredeyse hiç
   iz bırakmıyorlar (bilinçli düşük profil).
5. **Quiz night / tema gecesi** — Kayseri'ye özgü düzenli bir quiz night kültürü web aramasında
   hiç çıkmadı; bu format şehirde henüz yaygın olmayabilir ya da tamamen sosyal medya/ağızdan ağıza
   yürüyor.
6. **Erciyes kayak merkezi çevresindeki after-ski barlar** (Karizma Bar, Ozzy Club gibi) — sezonluk
   çalıştıkları ve genelde otel bünyesinde oldukları için detaylı bilgiye ulaşmak zor oldu.

**Kurucunun saha bilgisiyle doldurması gereken boşluklar:**
- Yukarıdaki "Doğrulanmalı" listesindeki 19 mekanın hangilerinin hâlâ açık ve kapsam içi
  (canlı müzik/DJ) olduğu.
- Talas/Melikgazi'de Instagram-only küçük mekanların bir "sokak taraması" (yürüyerek/araçla) ile
  tespiti — bu, web aramasının yapısal olarak yapamadığı bir iş.
- Her mekanın gerçek instagram_handle'ı (bazı satırlarda "bulunamadı" — kurucu telefonla arayıp
  ya da yerinde ziyaret ederek teyit edebilir).
- Telefon numaralarının çoğu cep telefonu (0530/0552 vb.) formatında bulundu; bunların hâlâ aktif
  işletme numarası olup olmadığı teyit edilmeli.
- Seyir Teras & Cafe / Seyir Cafe & Restaurant'ın tek mi iki ayrı mekan mı olduğu netleştirilmeli.
- Erciyes Kültür Merkezi dışında Kayseri'de başka özel sektör "performans sahnesi/konser salonu"
  var mı (görev tanımı düşük öncelikli dedi ama tamamen atlanmış olabilir).
