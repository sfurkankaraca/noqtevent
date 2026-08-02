# Dış kaynak içe aktarım rehberi (Ticketmaster + Resident Advisor)

Script: `scripts/supply-import/import-external.mjs`

Uygulamanın (eventmatch) zaten Ticketmaster ve ra.co'dan gösterdiği Türkiye
geneli mekan/sanatçıları NOQT kürasyon sistemine (`review_status='potential'`,
`is_published=false`) aktarır. Hiçbir satırı otomatik yayınlamaz — yalnız
"Potansiyel" kuyruğuna ekler, sen `/panel/admin/mekanlar` ve
`/panel/admin/sanatcilar`'dan tek tek onaylar/arşivlersin.

**Script hiçbir zaman kendiliğinden veritabanına yazmaz.** Varsayılan mod
dry-run'dır (yalnız rapor basar). Gerçek yazım yalnız `--apply` bayrağıyla olur.

## 1. Gerekli ortam değişkenleri

| Değişken | Ne zaman gerekli | Nereden alınır |
| --- | --- | --- |
| `TICKETMASTER_API_KEY` | `--source=tm` veya `--source=both` | Aşağıya bakın |
| `SUPABASE_URL` (veya `NEXT_PUBLIC_SUPABASE_URL`) | DB karşılaştırmalı dry-run + `--apply` | Vercel proje ayarları / `vercel env pull` |
| `SUPABASE_SERVICE_ROLE_KEY` | Aynı | Vercel proje ayarları / `vercel env pull` |

**Önemli:** bu repodaki `.env.local` şu an **boş placeholder** değerlerle
duruyor (`NEXT_PUBLIC_SUPABASE_URL=""` gibi — Vercel CLI'nin çektiği dosyada
gerçek değerler yok). Script `.env.local`'i otomatik okur ama boşsa hiçbir işe
yaramaz. Gerçek değerleri ya:

```bash
vercel env pull .env.local --environment=production
```

ile çekin, ya da komut satırında doğrudan verin (aşağıdaki örneklere bakın).

### Ticketmaster API anahtarını nereden bulursun

`TICKETMASTER_API_KEY` kodda hiçbir yerde açık yazmıyor (görev gereği). İki yer var:

1. **Lokal geliştirme anahtarı**: `~/noqt/eventmatch/.env` dosyasında
   (`TICKETMASTER_API_KEY=...` satırı — bu repo eventmatch'in kendi `.env`'i,
   git'e gitmiyor). Test/keşif amaçlı kullanılabilir.
2. **Üretim anahtarı**: Firebase Functions'ta secret olarak tutuluyor
   (`functions/src/ticketmaster-proxy.ts` içinde `defineSecret("TICKETMASTER_API_KEY")`).
   Değeri görmek için:
   ```bash
   cd ~/noqt/eventmatch
   firebase functions:secrets:access TICKETMASTER_API_KEY --project eventmatch-bd8ad
   ```
   (`~/noqt/eventmatch/.env.production` içinde bu anahtar için yalnız bir
   placeholder var — `PRODUCTION_TICKETMASTER_API_KEY_BURAYA` — yani gerçek
   üretim değeri sadece Secret Manager'da.)

İki anahtar da aynı Ticketmaster Developer Portal hesabına ait olabilir; hangisini
kullanırsan kullan, günlük kotayı (~5.000 istek/gün, `ticketmasterProxy`'nin
paylaştığı bütçe budur) uygulamanın canlı trafiğiyle PAYLAŞIYORSUN. Script bir
koşuda genelde 10-15 istek yapar (bkz. §3), gündelik kotayı zorlamaz — yine de
işlem sırasında uygulamanın keşif ekranını yavaşlatmayacak bir saatte
çalıştırmak (gece, düşük trafik) daha güvenli.

## 2. Adım adım akış

```bash
cd ~/noqt/noqteventweb

# 1) Önce sadece RA ile dene (anahtar gerekmez) — script'in çalıştığını gör
node scripts/supply-import/import-external.mjs --source=ra --verbose

# 2) Supabase kimlik bilgileriyle DRY RUN — "kaç tanesi zaten DB'de, kaç tanesi
#    yeni eklenecek" rakamlarını gerçek veriyle gör
SUPABASE_URL="https://xxxx.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="ey..." \
TICKETMASTER_API_KEY="..." \
node scripts/supply-import/import-external.mjs --source=both --verbose

# 3) Rakamlar mantıklı görünüyorsa gerçek yazım
SUPABASE_URL="https://xxxx.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="ey..." \
TICKETMASTER_API_KEY="..." \
node scripts/supply-import/import-external.mjs --source=both --apply
```

Yalnız Ticketmaster veya yalnız RA çekmek için `--source=tm` / `--source=ra`.

### Kullanışlı bayraklar

| Bayrak | Varsayılan | Ne işe yarar |
| --- | --- | --- |
| `--source=tm\|ra\|both` | `both` | Hangi kaynak(lar) çekilsin |
| `--apply` | kapalı (dry-run) | Gerçek yazım — bu OLMADAN hiçbir şey yazılmaz |
| `--verbose` | kapalı | Sayfa sayfa ilerleme logu |
| `--tm-max-pages=N` | `50` (sayfa boyutu 200 → ~10.000 etkinlik) | TM güvenlik tavanı |
| `--ra-max-pages=N` | `30` (sayfa boyutu 20 → ~600 etkinlik) | RA güvenlik tavanı |
| `--sample=N` | `8` | Dry-run raporunda kaç örnek gösterilsin |

Script tüm Türkiye'yi (countryCode=TR) tarar, şehir filtresi yoktur — kurucunun
istediği "TÜM Türkiye mekan/sanatçıları" kapsamı budur.

## 3. Ne kadar veri gelir, ne kadar istek atılır

Keşif sırasında (2026-08-01, canlı TM/RA'ya salt-okunur örnekleme ile)
gözlemlenen büyüklükler — kesin sayı her koşuda değişir, TM/RA verisi
sürekli güncelleniyor:

- **Ticketmaster TR:** o an ~1.451 gelecek etkinlik, `size=200` ile **8
  sayfa**da tamamı çekilebiliyor. 300 etkinliklik örneklemde 105 benzersiz
  mekan / 213 benzersiz "attraction" (sanatçı/topluluk) çıktı — tüm kataloğa
  ölçeklendiğinde kabaca **400-700 benzersiz mekan, 800-1.500 benzersiz
  sanatçı** civarı bekleyin (kesin değil, kaba tahmin).
- **Resident Advisor (Türkiye, ileri tarihli):** o an toplam 64 etkinlik,
  `pageSize=20` ile **4 sayfa**. 39 benzersiz mekan, 103 benzersiz sanatçı
  (RA gerçek zamanlı/yakın tarihli olduğu için TM'ye göre çok daha küçük bir
  havuz — elektronik müzik odaklı).

Yani tipik bir `--source=both` koşusu toplam **~12-15 HTTP isteği** atar
(TM + RA), birkaç saniye sürer.

## 4. Veri kalitesi — bilinen sınırlamalar

- **Ticketmaster `externalLinks` (Spotify/Instagram/YouTube) TR'de neredeyse
  hep BOŞ geliyor** — büyük/global sanatçılarda dolu olabilir ama yerel
  sanatçılarda (denenen örneklerin tamamında) `null`. Script yine de varsa
  okur; genelde `links` alanı boş `{}` gelecek, kurucu panelden elle ekler.
- **TM "attraction" bazen gerçek sanatçı değil** — festival/atölye/tur adı
  attraction olarak gelebiliyor (ör. "Antalya Kum Heykel Festivali",
  "Rol Yapma / Oyun Çıkarma Atölyesi"). Örneklemde bu tür "çöp" oranı kabaca
  **%5-10** civarındaydı. Otomatik filtrelenmedi — kürasyon ekranında görüp
  arşivlemen gerekecek.
- **`district` (ilçe), `venue_type`, `capacity`, `entry_policy` HİÇBİR
  kaynaktan güvenilir gelmiyor** — script bunları TAHMİN ETMEZ, NULL bırakır
  (Kayseri seed'indeki ilkeyle aynı: bilinmeyeni tahmin etme). Onay
  sırasında elle doldurman gerekir.
- **`artist_profiles.entity_kind` her zaman `'person'` yazılır** — TM/RA bir
  sanatçının solo mu grup mu olduğunu güvenilir vermiyor (ör. "Duman" bir
  grup ama script'te person olarak girer). Panel düzenleme formu bu alanı
  değiştirmiyor; yanlışsa Supabase'den elle (`UPDATE artist_profiles SET
  entity_kind=...`) düzeltmen gerekir — nadir bir durum, şimdilik kapsam dışı
  bırakıldı.
- **`performer_type`**: TM kaynaklılarda `'other'` (segment çok geniş —
  Music/Theatre/Comedy hepsi attraction üretiyor, hepsine `'dj'` demek
  yanıltıcı olurdu), RA kaynaklılarda `'dj'` (RA tanım gereği elektronik
  müzik odaklı, bu varsayım güvenli). Onay ekranında düzeltilebilir.
- **TM ve RA aynı mekanı farklı şehir yazımıyla** (İstanbul/Istanbul gibi)
  ayrı aday olarak getirebilir — script bunu otomatik birleştirmiyor,
  kürasyon sırasında görülüp arşivlenebilir.
- **TM venue objelerinde görsel yok** — `photo_urls` her zaman boş `[]`
  gelir, mekan görselini kurucu ekler. Sanatçı görseli TM'den geldiğinde
  (attraction.images) kullanılıyor; RA kaynaklı sanatçılarda görsel yok
  (RA yalnız etkinlik görseli veriyor, sanatçı başına değil — birden fazla
  sanatçıya aynı görseli atamak yanıltıcı olacağı için boş bırakıldı).

## 5. Dedup / idempotentlik nasıl çalışıyor

`ops/kayseri-seed.sql`'deki "slug varsa dokunma" ilkesinin PostgREST
karşılığı:

1. Script her adaya Türkçe karaktersiz kebab-case bir `slug` üretir
   (`Kali Beach Club Alaçatı` → `kali-beach-club-alacati`).
2. Aynı koşu içinde iki farklı aday aynı temel slug'a çarparsa (ör. iki farklı
   şehirde aynı isimli mekan) şehir ekiyle ayrılır (`sahne` /
   `sahne-istanbul`), hâlâ çarpışıyorsa `-2`, `-3` eklenir.
3. Hesaplanan slug (ya da onun şehirsiz temel hâli) **veritabanında zaten
   varsa aday atlanır** — Kayseri seed'i dahil, elle girdiğin hiçbir satıra
   dokunulmaz, üstüne yazılmaz.
4. Ayrıca `INSERT ... ON CONFLICT (slug) DO NOTHING` (PostgREST
   `Prefer: resolution=ignore-duplicates`) ikinci bir güvenlik ağı — aynı
   komutu iki kez çalıştırmak güvenlidir, ikinci koşuda hiçbir yeni satır
   eklenmez.

Bu yüzden script'i defalarca (ör. haftada bir, yeni etkinlikler için) tekrar
çalıştırmak güvenlidir.

## 6. Sonrasında ne yapmalısın

```bash
npm run dev   # veya canlıda
```

`/panel/admin/mekanlar` ve `/panel/admin/sanatcilar` sayfalarının
"Potansiyel" sekmesinde yeni satırları göreceksin. Yüzlerce satır gelecek
diye bu sayfalara **arama kutusu** (ada göre), mekanlarda **ilçe filtresi** ve
**sayfalama** (50'şer, "Önceki/Sonraki") eklendi — tamamını tek listede
kaydırmak zorunda kalmayacaksın.

Her satırda:
- **Düzenle** → adres/ilçe/tür/kapasite/instagram gibi alanları doldur.
- **Onayla** → `review_status='approved'`'a taşır (yayınlamaz, sadece
  "onaylı" listesine alır).
- **Arşivle** → kapsam dışı/yanlış/çöp kayıtları arşive taşır (yayından da
  otomatik kaldırır).

Onaylı bir satırı **Yayınla** butonuyla ayrıca, bilinçli olarak
yayınlaman gerekiyor — onay ≠ yayın (bkz.
`supabase/migrations/20260801150000_add_supply_publish_flags.sql`).

## 7. Sonraki adım: Spotify zenginleştirme (toplu eşleştirme)

Script: `scripts/supply-import/enrich-spotify.mjs`

İçe aktarımdan gelen (veya elle girilen) sanatçılarda `spotify_artist_id`
genelde boştur — bu script `artist_profiles`'ta bu alanı boş olan **TÜM**
sanatçıları (yalnız "Potansiyel" değil, onaylı olanlar dahil) tarar, Spotify'da
arar ve **güven kuralını geçenleri otomatik uygular**: kapak fotoğrafı
(yalnız boşsa), türler (birleşim), `spotify_artist_id`, popülerlik, takipçi.
Kurucunun elle koyduğu kapak fotoğrafı **asla ezilmez**.

**Güven kuralı** (ikisi BİRDEN sağlanmalı, aksi halde otomatik yazılmaz):
1. Normalize edilmiş ad (Türkçe karaktersiz, küçük harf) Spotify'ın ilk
   sonucuyla birebir eşleşiyor.
2. İkinci bir aday yoksa yeterli; varsa 1. ile 2. adayın popülerlik farkı
   belirgin (`Δ ≥ 15`, script içinde `POPULARITY_GAP_THRESHOLD`) — aksi halde
   hangi "Ahmet Yılmaz"ın doğru olduğu belirsiz demektir, otomatik uygulanmaz.

Kuralı geçemeyen her satır **"şüpheli"** sayılır ve HİÇBİR ŞEY YAZILMAZ —
`ops/spotify-eslesme-raporu.md`'ye, panelden tek tıkla açılacak bir düzenleme
linkiyle (`https://panel.noqt.social/panel/admin/sanatcilar/{entityId}`) ve
en fazla 3 Spotify adayıyla (ad, popülerlik, takipçi, link) yazılır — panelde
formdaki "Spotify'dan doldur" arama kutusuyla 30 saniyede elle çözülür.

**İDEMPOTENT:** sorgu zaten `spotify_artist_id IS NULL` filtresiyle çalışır —
bir kez eşleştirilen satır bir daha taranmaz. Yeni sanatçılar geldikçe (ör.
her `import-external.mjs --apply` koşusundan sonra) script'i tekrar tekrar
çalıştırmak güvenlidir.

### Sıralı akış (içe aktarım → toplu zenginleştirme → şüpheli raporu)

```bash
cd ~/noqt/noqteventweb

# 1) Yeni mekan/sanatçıları içe aktar (bkz. §2)
SUPABASE_URL="https://xxxx.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="ey..." \
TICKETMASTER_API_KEY="..." \
node scripts/supply-import/import-external.mjs --source=both --apply

# 2) DRY RUN — kaç sanatçı otomatik eşleşecek, kaçı şüpheli olacak gör
SUPABASE_URL="https://xxxx.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="ey..." \
SPOTIFY_CLIENT_ID="..." \
SPOTIFY_CLIENT_SECRET="..." \
node scripts/supply-import/enrich-spotify.mjs --verbose

# 3) Rakamlar mantıklı görünüyorsa gerçek yazım
SUPABASE_URL="https://xxxx.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="ey..." \
SPOTIFY_CLIENT_ID="..." \
SPOTIFY_CLIENT_SECRET="..." \
node scripts/supply-import/enrich-spotify.mjs --apply

# 4) Şüpheli listeyi gözden geçir
cat ops/spotify-eslesme-raporu.md
```

`SPOTIFY_CLIENT_ID`/`SPOTIFY_CLIENT_SECRET` — panelin kendi Spotify
uygulamasının kimlik bilgileri (Vercel'de `SPOTIFY_CLIENT_ID`/
`SPOTIFY_CLIENT_SECRET` olarak tanımlı olmalı; aynı uygulama
`~/noqt/eventmatch/.env`'de de kullanılıyor — iki taşıyıcı da AYNI Spotify
Developer Dashboard uygulamasına ait).

### Kullanışlı bayraklar

| Bayrak | Varsayılan | Ne işe yarar |
| --- | --- | --- |
| `--apply` | kapalı (dry-run) | Gerçek yazım — bu OLMADAN hiçbir şey yazılmaz |
| `--verbose` | kapalı | Sanatçı sanatçı ilerleme + 429 backoff logu |
| `--limit=N` | sınırsız | Test için ilk N sanatçıyla sınırla |

YouTube kanalı bağlama şimdilik yalnız panelden tek tek yapılıyor (bkz. sanatçı
düzenleme sayfası "YouTube kanalı bağla" bölümü, `src/components/panel/ArtistEnrich.tsx`).
Kanal bağlıyken "Kanaldan video getir" bölümü de aynı sayfada — kanalın son
videolarını listeleyip seçilenleri tek tıkla `video_urls`'e ekler
(`search.list` KULLANMAZ, bkz. `src/lib/panel/youtube.ts`).

## 8. Mevcut sanatçı stoğu için toplu canlı/konser video eşleştirme

Script: `scripts/supply-import/enrich-youtube-videos.mjs`

Yukarıdaki panel özelliği yalnız kanalı ZATEN bağlı sanatçılar için işe yarar
ve tek tek tıklama gerektirir — yüzlerce mevcut sanatçının video listesini
elle doldurmak gerçekçi değil. Bu script `artist_profiles`'ta `video_urls`
BOŞ olan **TÜM** sanatçıları (`spotify_artist_id` dolu olanlar önce — adı
zaten Spotify'da doğrulanmış, yanlış eşleşme riski düşük) YouTube'da arar ve
**güven kuralını geçen** en fazla 3 videoyu otomatik ekler.

**Güven kuralı** (HEPSİ birden gerekli, aksi halde hiçbir şey yazılmaz):
1. Video başlığı veya kanal adı, sanatçının adını içeriyor.
2. Başlıkta canlı/live/konser/concert/akustik/performans/sahne
   kelimelerinden en az biri geçiyor.
3. Video süresi ≥ 60 saniye (Shorts ve kısa klipler elenir).

Geçemeyen sanatçılar `ops/youtube-video-raporu.md`'ye, panel linkiyle,
"uygun video bulunamadı" olarak yazılır — HİÇBİR ŞEY YAZILMAZ.

**Kota:** her sanatçı için TAM BİR `search.list` çağrısı (100 birim/gün
kotasından). Script varsayılan olarak `--limit=90` sanatçıda durur (9.000
birim) ve kalanları bir sonraki koşuya bırakır; `İDEMPOTENT`tir (video
eklenen sanatçı bir daha taranmaz), yani script'i her gün tekrar çalıştırmak
güvenlidir. `HTTP 403 quotaExceeded` gelirse script o ana kadarki işi
raporlayıp temiz durur.

```bash
cd ~/noqt/noqteventweb

# Dry run
SUPABASE_URL="https://xxxx.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="ey..." \
YOUTUBE_API_KEY="..." \
node scripts/supply-import/enrich-youtube-videos.mjs --verbose

# Gerçek yazım
SUPABASE_URL="https://xxxx.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="ey..." \
YOUTUBE_API_KEY="..." \
node scripts/supply-import/enrich-youtube-videos.mjs --apply

# Rapor
cat ops/youtube-video-raporu.md
```

`YOUTUBE_API_KEY` — panelin zaten kullandığı aynı env değişkeni (Vercel'de
tanımlı olmalı, bkz. `src/lib/panel/youtube.ts`).
