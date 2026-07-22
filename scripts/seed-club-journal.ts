import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

// noqta.club magazine launch batch — see docs/CONTENT_PLAN.md
export const posts = [
  {
    slug: "dj-nasil-olunur-2026-rehberi",
    title: "DJ Nasıl Olunur? Sıfırdan Başlayanlar İçin 2026 Rehberi",
    category: "DJ'lik",
    excerpt:
      "Ekipman seçiminden ilk setine, pratik rutininden sahneye çıkmaya kadar DJ'liğe başlamak için bilmen gereken her şey — gerçekçi bir yol haritası.",
    content: `DJ olmak istiyorsun ama nereden başlayacağını bilmiyorsun. YouTube'da yüzlerce video var, herkes farklı bir şey söylüyor, ekipman fiyatları kafa karıştırıcı. Bu rehberde işi sadeleştiriyoruz: sıfırdan sahneye çıkana kadar izleyeceğin gerçekçi bir yol haritası.

## DJ'lik Gerçekte Nedir?

DJ'lik iki parçayı üst üste bindirmekten ibaret değildir. İyi bir DJ, bir gecenin enerjisini okuyan ve müzikle yöneten kişidir. Teknik beceri (beatmatching, geçişler, EQ kullanımı) işin öğrenilebilir kısmıdır; asıl fark, müzik bilgisi ve seçkidir. Bu yüzden ilk günden itibaren iki şeyi paralel geliştireceksin: elini ve kulağını.

## 1. Adım: Dinlemeyi Öğren

Kulağa klişe geliyor ama en çok atlanan adım bu. Sevdiğin türü (house, techno, melodic, disco...) belirle ve o türün iyi DJ'lerinin setlerini analiz ederek dinle: Parçalar nerede değişiyor? Enerji nasıl yükseliyor? Geçişler ne kadar sürüyor? Boiler Room, HÖR ve Cercle kayıtları bunun için harika birer okul.

## 2. Adım: Yazılım ve Ekipman

Başlangıç için pahalı ekipmana ihtiyacın yok. İki yol var:

### Sadece yazılımla başla
Rekordbox, Serato ve Traktor'un ücretsiz sürümleriyle bilgisayarında pratik yapabilirsin. Klavyeyle miks yapmak ideal değil ama temel kavramları (BPM, grid, cue noktaları) öğrenmek için yeterli.

### Giriş seviyesi controller al
5.000–15.000 TL bandındaki bir controller (ör. Pioneer DDJ-FLX2/FLX4, Numark Mixtrack serisi) uzun süre yetecektir. Jog wheel hissiyatı, gerçek fader ve EQ kullanımı, yazılımdan çok daha hızlı öğrenmeni sağlar. Detaylı öneriler için başlangıç controller rehberimize göz at.

## 3. Adım: Temel Teknikler

Sırasıyla şunları öğren:

### Beatmatching
İki parçanın tempolarını ve vuruşlarını hizalamak. Sync tuşu bunu senin yerine yapar; yine de kulaktan beatmatching öğrenmelisin, çünkü sync'in yanlış çalıştığı anları ancak kulağın kurtarır.

### Faz ve yapı
Elektronik müzik çoğunlukla 8-16-32 barlık bloklar halinde ilerler. Parçaların intro, breakdown, drop ve outro bölümlerini tanımayı öğren; geçişlerini bu bloklara göre planla.

### EQ ile geçiş
İki parçanın bası aynı anda çalarsa miks çamurlaşır. Gelen parçanın basını kapalı tut, geçiş anında değiştir. Bu tek alışkanlık, mikslerini bir anda profesyonelleştirir.

## 4. Adım: Müzik Kütüphaneni Kur

DJ'in asıl serveti müzik arşividir. Beatport, Bandcamp ve label takibiyle kendi seçkini oluştur. Her parçayı etiketle: enerji seviyesi, tonalite, hangi anda çalınır. Düzenli bir kütüphane, sahnede panik yaşamamanın sigortasıdır.

## 5. Adım: Kayıt Al ve Paylaş

Haftada en az bir kez 30-60 dakikalık set kaydet. Kaydını geri dinle: geçişlerde enerji düşüyor mu, parça seçimleri tutarlı mı? İyi olduğunu düşündüğün setleri SoundCloud veya Mixcloud'a yükle. Bu arşiv, ileride booking almanın kapısıdır.

## 6. Adım: Sahneye Çık

İlk gig'in büyük bir kulüpte olmayacak — ve olmamalı. Ev partileri, arkadaş etkinlikleri, açık mikrofon geceleri ve yerel mekanların warm-up saatleri ilk sahne deneyimlerin olacak. Warm-up çalmak ayrı bir ustalıktır: amaç kendini göstermek değil, geceyi doğru sıcaklığa getirmektir. Bunu iyi yapan DJ'ler her zaman tekrar çağrılır.

## Ne Kadar Sürer?

Düzenli pratikle (haftada 4-5 saat) temel teknikleri 2-3 ayda oturtursun. Sahneye çıkacak özgüvene çoğu insan 6-12 ayda ulaşır. Asıl yolculuk — kendi sesini bulmak — yıllar sürer ve işin en keyifli kısmı da budur.

## Özetle

Dinle, küçük başla, her hafta kaydet, kütüphaneni ciddiye al ve ilk fırsatta insanların önünde çal. DJ'lik sahnede öğrenilen bir zanaattır. NOQT olarak Türkiye'de elektronik müzik sahnesini büyütmek için içerik, eğitim ve sahne fırsatlarını tek çatı altında topluyoruz — yolculuğunun her adımında yanındayız.`,
    color: "bg-[oklch(0.88_0.06_300)]",
    read_time: "8 dk",
    is_featured: true,
    is_published: true,
    published_at: "2026-07-22T09:00:00Z",
  },
  {
    slug: "baslangic-icin-dj-controller-onerileri",
    title: "Başlangıç İçin DJ Controller Önerileri (2026)",
    category: "DJ'lik",
    excerpt:
      "İlk DJ controller'ını alırken nelere bakmalısın? Bütçe bantlarına göre öneriler, yazılım uyumu ve 'büyüyünce ne olacak' sorusunun cevabı.",
    content: `İlk controller'ını almak, DJ yolculuğunun en heyecanlı ve en kafa karıştırıcı adımı. Onlarca model, üç farklı yazılım ekosistemi ve geniş bir fiyat aralığı var. Bu rehber, 2026 itibarıyla başlangıç için mantıklı seçenekleri ve karar verirken bakman gereken kriterleri özetliyor.

## Karar Vermeden Önce: 3 Soru

### 1. Hangi yazılım ekosistemine gireceksin?
Controller'lar belirli yazılımlarla çalışır: Pioneer DJ ağırlıklı olarak rekordbox (ve çoğu modelde Serato), Native Instruments Traktor, Numark/Rane çoğunlukla Serato. Kulüp standardı Pioneer/rekordbox olduğu için ileride sahne hedefliyorsan rekordbox uyumlu başlamak geçişini kolaylaştırır. Detaylı karşılaştırma için rekordbox–Serato–Traktor yazımıza bakabilirsin.

### 2. Bütçen ne kadar?
Türkiye fiyatları kurla oynasa da bantlar kabaca şöyle: giriş seviyesi 5.000–15.000 TL, orta seviye 15.000–35.000 TL, üstü profesyonel. İlk yıl için giriş seviyesi fazlasıyla yeterli.

### 3. Nerede çalacaksın?
Sadece evde pratik mi, yoksa ev partileri ve küçük etkinlikler mi? İkincisiyse, çıkışları (booth/master) ve dayanıklılığı bir tık daha iyi olan modellere bakmak mantıklı.

## Giriş Seviyesi Öneriler

### Pioneer DJ DDJ-FLX2 / DDJ-FLX4
Başlangıç segmentinin açık ara en popüler tercihi. rekordbox ve Serato ile uyumlu, hafif, akıllı telefonla bile çalışabiliyor. Jog wheel'ler küçük ama öğrenim için yeterli. İkinci elde de kolay alınıp satılır — bu, büyüdüğünde üst modele geçişi ucuzlatır.

### Numark Mixtrack Platinum FX
Serato tarafının güçlü giriş modeli. Jog wheel içindeki ekranlar (BPM, pozisyon) öğrenirken gerçekten işe yarar. Fiyat/özellik dengesi iyi.

### Hercules Inpulse serisi
En dar bütçenin seçeneği. Beatmatch rehberi gibi öğretici özellikleri var; ciddi sınırlamaları da var ama "bu iş bana göre mi?" sorusunu cevaplamak için yeterli.

## Orta Seviye: Bir Adım Sonrası

İlk 6-12 ayı geride bırakıp ciddileştiğinde bakacağın segment: Pioneer DDJ-FLX6, Roland DJ-505, Traktor Kontrol S3. Dört kanal, daha iyi jog wheel ve performans pad'leri bu seviyede geliyor. Baştan orta seviye almak da bir strateji — ama motivasyonun sürüp sürmeyeceğinden emin değilsen küçük başla.

## İkinci El Almak Mantıklı mı?

Evet — controller'lar doğru kullanıldığında dayanıklıdır. Bakacağın şeyler: fader'larda çıtırtı, jog wheel hassasiyeti, USB portunun sağlamlığı. Buluşup mutlaka test ederek al.

## Controller Dışında Neye İhtiyacın Var?

Kulaklık (kapalı tip, ör. Audio-Technica M40x, Sennheiser HD 25 hedefin olsun), en azından hoparlör ya da monitör çifti, ve müzik bütçesi. Ekipmana verdiğin paranın en az yarısı kadarını ilk yıl müziğe ayıracağını hesaba kat — kütüphanesi zayıf bir DJ'i hiçbir controller kurtarmaz.

## Özetle

Başlangıç için DDJ-FLX4 bandındaki bir controller + kapalı kulaklık + düzenli müzik bütçesi ideal formül. Ekipman seni DJ yapmaz; pratik yapar. Aldığın gün 30 dakikalık ilk kaydını al — bir yıl sonra dinlediğinde yolun ne kadarını geldiğini görmek paha biçilmez.`,
    color: "bg-[oklch(0.9_0.05_220)]",
    read_time: "7 dk",
    is_featured: false,
    is_published: true,
    published_at: "2026-07-22T09:05:00Z",
  },
  {
    slug: "rekordbox-serato-traktor-karsilastirmasi",
    title: "rekordbox mu, Serato mu, Traktor mu? DJ Yazılımı Karşılaştırması",
    category: "DJ'lik",
    excerpt:
      "Üç büyük DJ yazılımının güçlü ve zayıf yönleri, hangi DJ profiline hangisinin uyduğu ve kulüp standardı gerçeği.",
    content: `DJ yazılımı seçimi, ekipman seçiminden daha kalıcı bir karardır: kütüphanen, cue noktaların ve kas hafızan seçtiğin ekosistemde birikir. Üç büyük oyuncuyu — rekordbox, Serato ve Traktor — dürüstçe karşılaştıralım.

## rekordbox (Pioneer DJ / AlphaTheta)

### Güçlü yönleri
En önemli avantajı kulüp standardı olması: dünyadaki kulüplerin ve festivallerin büyük çoğunluğunda Pioneer CDJ/XDJ setup'ı bulunur. rekordbox'ta hazırladığın kütüphaneyi USB'ye aktarır, herhangi bir kulüpte bilgisayarsız çalarsın. Bu akış (export mode) sahne hedefleyen herkes için kritik.

Kütüphane yönetimi güçlü: akıllı çalma listeleri, bulut senkronizasyonu (CloudDirectPlay), ilgili parça önerileri. Ücretsiz sürümüyle controller'a bağlı performans da mümkün.

### Zayıf yönleri
Arayüzü yeni başlayanlara kalabalık gelebilir. Abonelik modeli (bazı özellikler Core/Creative planlarda) can sıkabilir. Pioneer dışı donanım desteği sınırlı.

### Kime göre?
Kulüpte çalmayı hedefleyen, USB ile sahneye çıkmak isteyen herkes. Türkiye'deki mekanların standardı da Pioneer olduğu için sahne hedefi olan başlangıç DJ'lerine varsayılan önerimiz bu.

## Serato DJ

### Güçlü yönleri
Sektörün en akıcı ve stabil arayüzlerinden biri. Özellikle açık format / hip-hop / scratch dünyasının standardı. Geniş donanım desteği: Pioneer'dan Rane'e, Numark'tan Denon'a çok sayıda controller Serato ile çalışır. Stems (parçayı vokal/bas/davul olarak ayırma) uygulaması çok başarılı.

### Zayıf yönleri
Kulüp CDJ'lerinde USB ile doğrudan çalma akışı yok — bilgisayarını sahneye taşıman gerekir. Kütüphane yönetimi rekordbox kadar derin değil.

### Kime göre?
Bilgisayarla çalmaktan rahatsız olmayan, scratch ve açık format seven, ev/etkinlik DJ'liği yapanlar.

## Traktor Pro

### Güçlü yönleri
En yaratıcı yazılım: remix deck'ler, güçlü efekt motoru, loop ve modülasyon imkanları. Native Instruments ekosistemiyle (Maschine, Komplete) entegrasyonu, prodüksiyonla DJ'liği harmanlayanlar için ilginç. Tek seferlik lisans ücreti (abonelik yok) hâlâ bir artı.

### Zayıf yönleri
Donanım seçeneği dar, pazar payı küçülüyor, kulüp standartlarıyla uyum zayıf. Topluluk ve eğitim içeriği diğer ikisine göre az.

### Kime göre?
Deneysel setler kuran, canlı performans ve prodüksiyon arasında gezinen teknik meraklılar.

## Karar Tablosu

Kulüp/festival hedefi → rekordbox. Scratch, açık format, mobil etkinlik → Serato. Deneysel/hibrit performans → Traktor.

## Geçiş Yapmak Zor mu?

Kütüphane taşıma araçları (ör. Lexicon, Rekord Buddy benzeri çözümler) cue ve playlist'leri ekosistemler arasında taşıyabiliyor; yani ilk seçimin ömürlük değil. Ama kas hafızası ve iş akışı alışkanlıkları taşınmaz — bu yüzden hedefin neresi olduğuna ilk yıldan karar vermek zaman kazandırır.

## Özetle

Yanlış cevap yok, profil var. Türkiye'de sahne hedefleyen bir başlangıç DJ'i için en güvenli varsayılan rekordbox; Serato güçlü ve meşru bir alternatif; Traktor ise bilinçli bir niş tercih. Hangisini seçersen seç, kütüphaneni ilk günden düzenli tut — yazılıştan bağımsız, en değerli varlığın o.`,
    color: "bg-[oklch(0.9_0.04_150)]",
    read_time: "7 dk",
    is_featured: false,
    is_published: true,
    published_at: "2026-07-22T09:10:00Z",
  },
  {
    slug: "beatmatching-nedir-nasil-ogrenilir",
    title: "Beatmatching Nedir? Kulaktan Miks Yapmayı Öğrenme Rehberi",
    category: "DJ'lik",
    excerpt:
      "Sync tuşu varken beatmatching öğrenmeye değer mi? Evet — işte nedeni ve adım adım kulaktan beatmatching çalışma yöntemi.",
    content: `Beatmatching, iki parçanın tempo (BPM) ve vuruşlarını hizalayarak aynı anda uyumlu çalmasını sağlamaktır. DJ'liğin en temel tekniğidir ve sync tuşunun her yerde olduğu bir çağda "hâlâ gerekli mi?" tartışması hiç bitmez. Kısa cevap: evet, gerekli. Uzun cevap bu yazıda.

## Sync Varken Neden Öğrenmeli?

Sync tuşu iki parçanın BPM'ini ve grid'ini eşitler — çoğu zaman doğru çalışır. Ama:

İlk olarak, grid'ler her zaman doğru değildir. Özellikle eski kayıtlar, canlı çalınmış parçalar ve bazı vinyl rip'lerde beat grid kayıktır; sync bu durumda mixi feci şekilde bozar ve bunu ancak kulağın yakalar. İkincisi, her setup'ta sync yoktur — kulüpteki eski CDJ'lerde, plakta, arızalı link bağlantısında kendi başınasın. Üçüncüsü ve en önemlisi: beatmatching öğrenirken kazandığın "vuruş duyma" becerisi, geçiş kalitenin tamamını yükseltir. Sync kullanmaya devam edebilirsin; ama artık bilinçli kullanırsın.

## Temel Kavramlar

### BPM
Dakikadaki vuruş sayısı. House genelde 120-128, techno 128-140, drum and bass 170+ bandındadır.

### Faz (Phase)
İki parçanın BPM'i aynı olsa bile vuruşları üst üste binmiyorsa faz kayıktır. "Tempo doğru ama bir gariplik var" hissinin nedeni budur.

### Bar ve Frase
4 vuruş = 1 bar; elektronik müzik çoğunlukla 8/16/32 barlık cümlelerle ilerler. Beatmatching sadece vuruşları değil, cümleleri de hizalamaktır.

## Adım Adım Çalışma Yöntemi

### 1. Hafta: Tek elle tempo yakalama
Aynı parçanın iki kopyasını iki deck'e yükle. Birini çal, diğerinin pitch fader'ıyla tempoyu kulaktan eşitlemeye çalış. BPM göstergesine bakma — bantla kapat gerekirse. Kulağın "hızlı mı yavaş mı?" sorusuna cevap vermeyi öğrenecek: gelen parça öndeyse yavaşlat, geridey​se hızlandır.

### 2. Hafta: Farklı parçalarla
Aynı türden, BPM'i yakın iki farklı parçayla aynı egzersizi yap. Kulaklıkta cue'daki parçayı dinlerken ana çıkışı da duymayı (split cueing) öğren.

### 3. Hafta: Jog ile faz düzeltme
Tempo eşit ama vuruşlar kayıksa jog wheel'e küçük dokunuşlarla fazı hizala. "Galloping" (at koşusu gibi çift vuruş sesi) duyuyorsan faz kayık demektir — bu sesi tanımak en önemli kilometre taşı.

### 4. Hafta ve sonrası: Geçişin tamamı
Beatmatch + EQ + fader'ı birleştir: gelen parçanın basını kapat, 16-32 bar boyunca iki parçayı birlikte çal, basları değiştir, çıkan parçayı azalt. Her pratik seansının sonunda 20 dakikalık kayıt al ve geri dinle.

## Sık Yapılan Hatalar

Pitch fader'ı büyük hamlelerle oynatmak (küçük düzeltmeler yap), BPM ekranına kilitlenmek (ekran faz kaymasını göstermez), ve sadece intro/outro'da pratik yapmak (breakdown üstünden geçiş de çalış).

## Özetle

Beatmatching bisiklet sürmek gibidir: birkaç hafta sancılıdır, sonra ömür boyu unutmazsın. Günde 30 dakika, dört hafta — bu yatırımın karşılığı, hangi ekipmanın başına geçersen geç kendine güvenen bir DJ olmaktır.`,
    color: "bg-[oklch(0.92_0.05_60)]",
    read_time: "6 dk",
    is_featured: false,
    is_published: true,
    published_at: "2026-07-22T09:15:00Z",
  },
  {
    slug: "ilk-dj-setini-hazirlama-rehberi",
    title: "İlk DJ Setini Hazırlama Rehberi: Seçkiden Kayda",
    category: "DJ'lik",
    excerpt:
      "İyi bir DJ seti rastgele iyi parçalar dizmek değildir. Enerji eğrisi, parça seçimi, geçiş planı ve kayıt için pratik bir çerçeve.",
    content: `Teknikleri öğrendin, sıra geldi asıl işe: bir bütün olarak anlam taşıyan bir set kurmak. İyi bir set, tek tek iyi parçalardan değil, doğru sırayla anlatılan bir hikayeden oluşur. Bu rehber ilk 60 dakikalık setini kurman için pratik bir çerçeve sunuyor.

## Önce Bağlamı Belirle

"Kim, nerede, saat kaçta dinliyor?" — her set bu sorunun cevabına göre kurulur. Ev dinlemesi için mi (podcast/mixtape), hayali bir kulüp warm-up'ı mı, peak time mı? İlk setin için önerimiz: 60 dakikalık, orta enerjili bir "bar/warm-up" seti. Peak time enerjisini taşımak ilk set için zordur; orta tempo sana nefes alanı bırakır.

## Enerji Eğrisini Çiz

Setini üç perdeye böl:

### Açılış (0-15 dk)
Dinleyiciyi içeri al. Görece sade, atmosferik, vokali az parçalar. BPM bandının alt ucundan başla.

### Gelişme (15-45 dk)
Enerjiyi kademeli yükselt — ama düz bir çizgide değil. İki-üç parçada bir küçük bir nefes (daha derin, daha az yoğun bir parça) ver; sürekli yükselen set yorar. Setin en güçlü parçasını 40. dakika civarına koy.

### Kapanış (45-60 dk)
Zirveden yumuşak iniş. Melodik, duygusal ya da klasikleşmiş bir kapanış parçası, setin akılda kalan son cümlesidir.

## Parça Seçimi: 90/10 Kuralı

60 dakikalık set için 15-20 parça seç (kullanacağının yaklaşık iki katı). Seçkinin %90'ı birbiriyle uyumlu, "güvenli" parçalar olsun; %10'u seni heyecanlandıran risk parçaları. Tamamı risk olan set dağılır, tamamı güvenli olan set unutulur.

Tonalite uyumuna da bak: Camelot wheel üzerinde komşu tonlardaki parçalar (ör. 8A→7A/9A/8B) birlikte iyi tınlar. Buna harmonic mixing denir; kural değil pusula olarak kullan.

## Geçiş Planı

Her ardışık parça çifti için kabaca nerede geçeceğini işaretle: hangi parçanın outro'su, hangisinin intro'suyla buluşacak? Cue noktalarını buna göre koy. İlk sette 2-3 "planlı geçiş anı" belirlemek özgüven verir; geri kalanında akışa güven.

## Kaydet, Dinle, Tekrarla

Seti tek seferde, durmadan kaydet. Hata yaparsan durma — sahnede de duramazsın; toparlamayı öğrenmek işin parçası. Kaydı ertesi gün, başka bir işle uğraşırken dinle: sıkıldığın an var mı? O an, düzeltilecek yerdir. Üçüncü-dördüncü denemede yayınlanabilir bir kayıt çıkar.

## Yayınlarken

SoundCloud/Mixcloud'a yüklerken tracklist'i yaz — hem dinleyiciye saygıdır hem de prodüktörlere görünürlük kazandırır. Kapak görseli ve tutarlı bir isimlendirme (ör. "Ad — Warm Up Mix 001") küçük ama profesyonel bir izlenim farkı yaratır.

## Özetle

Bağlam belirle, enerji eğrisi çiz, iki kat parça seç, geçişleri kabaca planla, tek seferde kaydet. İlk setin mükemmel olmayacak — olmaması gerekiyor. 001 numaralı mix'in görevi mükemmellik değil, 002'nin önünü açmaktır.`,
    color: "bg-[oklch(0.9_0.06_20)]",
    read_time: "6 dk",
    is_featured: false,
    is_published: true,
    published_at: "2026-07-22T09:20:00Z",
  },
  {
    slug: "muzik-produksiyonuna-nereden-baslanir",
    title: "Müzik Prodüksiyonuna Nereden Başlanır? İlk Adım Rehberi",
    category: "Prodüksiyon",
    excerpt:
      "DAW seçimi, minimum ekipman, ilk parçanı bitirmenin yolu ve yeni başlayanların en sık düştüğü tuzaklar.",
    content: `Kendi müziğini üretmek istiyorsun — belki DJ setlerinde kendi parçalarını çalmak, belki sadece içindekini dışarı çıkarmak için. İyi haber: müzik prodüksiyonuna başlamak hiç bu kadar ucuz ve erişilebilir olmamıştı. Kötü haber: seçenek bolluğu, başlamayı zorlaştırıyor. Bu rehber ilk adımları sadeleştiriyor.

## İhtiyacın Olan Minimum Setup

Bilgisayar (son 5-6 yılın herhangi bir bilgisayarı yeter), bir DAW (aşağıda), ve kulaklık. Bu kadar. Ses kartı, MIDI klavye, stüdyo monitörleri — hepsi güzel ama hiçbiri ilk altı ay için şart değil. En sık yapılan hata, üretmeye başlamadan ekipmana para gömmek.

## DAW Seçimi

DAW (Digital Audio Workstation), müzik ürettiğin yazılım. Elektronik müzik için öne çıkanlar: Ableton Live (canlı performans ve elektronik müziğin fiili standardı), FL Studio (hızlı melodi/loop akışı, ömür boyu ücretsiz güncelleme), Logic Pro (Mac'te en iyi fiyat/kapsam). Ayrıntılı karşılaştırma için Ableton–FL Studio yazımıza bak.

Hangisini seçersen seç, ilk yıl değiştirme. DAW değiştirmek ilerleme gibi hissettirir ama çoğu zaman kaçıştır — sorun araçta değil, bitirme alışkanlığındadır.

## İlk Hedef: Kötü Bir Parçayı Bitirmek

Bu cümle rehberin en önemli cümlesi. Yeni başlayanların %90'ı 8 barlık mükemmel loop'lar üretip hiçbir parçayı bitirmez. İlk hedefin iyi bir parça yapmak değil; baştan sona — intro, gelişme, breakdown, drop, outro — bitmiş bir parça yapmak. Kötü olacak. Sorun değil. Bitirme kası, prodüksiyonun en değerli kasıdır ve sadece bitirerek gelişir.

### Pratik yöntem: Kopyala-öğren
Sevdiğin basit bir parçayı seç ve yapısını birebir taklit et: kaç bar intro, drop nerede, kaç eleman çalıyor? Bu "cover mühendisliği", müzik teorisinden önce aranjman sezgisi kazandırır.

## Temel Kavramlar (İlk 3 Ayın Müfredatı)

### Ses tasarımı yerine hazır sesler
Başlangıçta sample pack'ler (Splice vb.) ve DAW'ın hazır enstrümanlarıyla çalış. Synth programlamayı sonra öğrenirsin; önce aranjman.

### Davul programlama
Kick-clap-hat üçlüsüyle groove kurmayı öğren. Elektronik müziğin bel kemiği budur.

### Basit miks
Her elemanın duyulabildiği, hiçbirinin bağırmadığı denge. Volume fader ve EQ ile başla; kompresör, reverb ve sidechain sonraki adım. Mastering'i şimdilik hiç dert etme.

## Haftalık Rutin Önerisi

Haftada 3 seans × 1 saat, tek kurala bağlı: her ay 1 bitmiş parça. İlk yılın sonunda 12 bitmiş parçan olur — ve 12. parça, 1.'siyle kıyaslanamayacak kadar iyi olacak. Parçalarını SoundCloud'a "works in progress" olarak at; utanma eşiğini erken aş.

## Sık Düşülen Tuzaklar

Plugin biriktirmek (DAW'ın kendi araçları ilk yıl fazlasıyla yeter), tutorial izleyip üretmemek (izlediğin her 1 saate karşı 2 saat üret), ve ilk parçayı "release" için saklamak (ilk 20 parça antrenmandır).

## Özetle

Bilgisayar + DAW + kulaklık ile bugün başla. Küçük hedef: bu ay bir parçayı — kötü de olsa — bitir. Prodüksiyon bir maraton ve tek rakibin dünkü halin.`,
    color: "bg-[oklch(0.9_0.05_260)]",
    read_time: "7 dk",
    is_featured: false,
    is_published: true,
    published_at: "2026-07-22T09:25:00Z",
  },
  {
    slug: "ableton-mu-fl-studio-mu",
    title: "Ableton mu, FL Studio mu? Elektronik Müzik İçin DAW Karşılaştırması",
    category: "Prodüksiyon",
    excerpt:
      "İki dev DAW'ın iş akışı farkları, güçlü yönleri, fiyatlandırması ve hangi üretici profiline hangisinin uyduğu.",
    content: `"Ableton mu FL mi?" — muhtemelen elektronik müzik prodüksiyonunun en çok sorulan sorusu. İkisi de dünya çapında hit üretmiş, ikisi de fazlasıyla yetenekli. Fark kalitede değil, iş akışında. Bu yazıda ikisini dürüstçe karşılaştırıp hangi profile hangisinin uyduğunu netleştiriyoruz.

## Ableton Live

### İş akışı
Ableton'un iki görünümü var: Session View (fikirleri clip'ler halinde deneyip jam yapabildiğin ızgara) ve Arrangement View (klasik zaman çizgisi). Session View, elektronik müzik için devrim niteliğinde: parçayı "yazmadan" önce fikirleri canlı deneyebilirsin. DJ kökenli üreticilere bu akış çok doğal gelir.

### Güçlü yönleri
Canlı performans standardı (adı üstünde: Live). Warp motoru — audio'yu esnetme, kesme, yeniden şekillendirme — sektörün en iyisi. Sample manipülasyonu, ses tasarımı ve deneysel üretim için ideal. Max for Live ile sınırsız genişletilebilirlik. Push donanımıyla entegrasyonu benzersiz.

### Zayıf yönleri
Fiyatı yüksek (Standard/Suite kademeleri), güncellemeler ücretli. Piano roll'ü FL'inki kadar hızlı değil. İlk açılışta arayüzü soğuk bulunabilir.

## FL Studio

### İş akışı
FL, pattern tabanlı çalışır: step sequencer ve piano roll'de küçük pattern'ler kurar, bunları playlist'e dizersin. Melodi ve loop üretiminde inanılmaz hızlıdır — akıldaki fikri sese dökme süresi kısadır.

### Güçlü yönleri
Sektörün en iyi piano roll'ü — melodik üretimde rakipsiz. Ömür boyu ücretsiz güncelleme (bir kez al, hep güncel). Hip-hop, trap ve melodik türlerde devasa topluluk ve eğitim içeriği. Giriş fiyatı daha erişilebilir.

### Zayıf yönleri
Audio kayıt ve düzenleme tarafı Ableton'dan zayıf. Canlı performans araçları sınırlı. Karmaşık aranjmanlarda playlist dağınıklaşabilir.

## Doğrudan Karşılaştırma

Melodi/loop hızı → FL. Audio manipülasyonu ve sample işleme → Ableton. Canlı performans → Ableton, açık farkla. Fiyat/uzun vade → FL (ömür boyu güncelleme). Öğrenme kaynağı bolluğu → ikisi de çok zengin. Tür eğilimi: house/techno/deneysel sahne Ableton'a, trap/melodik/pop sahne FL'e yakın durur — ama bu bir kural değil, istatistiksel eğilim.

## Karar İçin Pratik Test

İkisinin de deneme sürümünü indir ve aynı görevi yap: 8 barlık bir drum groove + bassline kur. Hangisinde "yazılımla değil müzikle uğraştığını" hissettiysen, cevabın o. DAW seçimi klavye düzeni seçmek gibidir — doğrusu yanlışı yok, alışkanlığı var.

## Ya İkisi de Değilse?

Mac kullanıyorsan Logic Pro (tek seferlik makul fiyat, devasa içerik kütüphanesi) ciddi bir üçüncü seçenek. Bitwig, Ableton'a benzer akışıyla teknik meraklıların radarında. Ücretsiz başlamak istersen: Ableton Live Lite (çoğu ekipmanla bedava gelir) veya web tabanlı araçlar.

## Özetle

DJ kökenliysen, sample'la oynamayı ve canlı denemeyi seviyorsan: Ableton. Melodi odaklıysan, hızlı fikir dökmek istiyorsan ve bütçe önemliyse: FL Studio. Hangisini seçersen ilk yıl sadık kal — hit yapan yazılım değil, bitirme alışkanlığıdır.`,
    color: "bg-[oklch(0.92_0.04_180)]",
    read_time: "6 dk",
    is_featured: false,
    is_published: true,
    published_at: "2026-07-22T09:30:00Z",
  },
  {
    slug: "house-techno-melodic-techno-farklari",
    title: "House, Techno, Melodic Techno: Türleri Ayırt Etme Rehberi",
    category: "Sahne & Kültür",
    excerpt:
      "\"Bu house mu techno mu?\" tartışmasına son: türlerin kökenleri, ayırt edici özellikleri ve dinleyerek öğrenme listesi.",
    content: `Elektronik müziğe yeni giren herkesin yaşadığı kafa karışıklığı: her şey "tıs tıs" mı, yoksa house, techno, melodic techno gerçekten farklı diller mi? Farklı diller. Bu rehber, üç büyük türü kökenleri ve ayırt edici özellikleriyle tanıtıyor — sonunda kulağın hangi türü duyduğunu bilecek.

## House: Sıcaklık ve Groove

### Köken
1980'ler Chicago'su. Disco'nun küllerinden, The Warehouse kulübünde (adı buradan gelir) doğdu. Frankie Knuckles gibi öncüler disco plaklarını drum machine'lerle uzatıp yeniden kurguladı.

### Nasıl tanırsın?
Tempo genelde 120-128 BPM. Vuruş yapısı four-on-the-floor (her vuruşta kick) ama hissiyat yumuşak ve salınımlıdır: swing'li hi-hat'ler, funk ve disco'dan gelen bas gitar ruhu, sıcak akorlar, gospel/soul kökenli vokaller. House gülümser; amacı seni dansa davet etmektir, ezmek değil.

### Alt dallar
Deep house (daha loş, akor odaklı), tech house (techno sertliğiyle house groove'u), afro house (perküsyon ağırlıklı, son yılların yükseleni).

## Techno: Makine ve Hipnoz

### Köken
1980'ler Detroit'i. Juan Atkins, Derrick May ve Kevin Saunderson ("Belleville Three"), Kraftwerk'in makine estetiğiyle funk'ı birleştirdi. 90'larda Berlin bu sesi sahiplendi ve bugünkü küresel merkezi oldu.

### Nasıl tanırsın?
Tempo 128-140+ BPM. Yine four-on-the-floor, ama his tamamen farklı: mekanik, tekrar eden, hipnotik. Melodiden çok doku ve ritim vardır; vokal azdır ya da yoktur. Parçalar yavaş evrilir — 7 dakikalık bir techno parçasında değişim, cümlelerle değil santimetrelerle ölçülür. Amaç trans halidir: kalabalığı tek bir ritmik organizmaya dönüştürmek.

### Alt dallar
Peak time/driving techno, hard techno (son yılların 145+ BPM dalgası), dub techno (yankılı, atmosferik), minimal.

## Melodic Techno: Duygu Katmanı

### Köken
2010'larda, progressive house ve techno'nun kesişiminde şekillendi. Tale Of Us, Afterlife etiketi, Solomun ve Anyma gibi isimlerle festival ana sahnelerine taşındı.

### Nasıl tanırsın?
Tempo 120-126 BPM — yani teknik olarak çoğu zaman techno'dan yavaştır. Techno'nun karanlık dokusunu alır, üzerine büyük melodik hikayeler ekler: sinematik synth temaları, duygusal breakdown'lar, epik drop'lar. Techno hipnoz ediyorsa, melodic techno duygulandırır. Eleştirmenleri "fazla tatlı" bulur, sevenleri için elektronik müziğin en duygusal kapısıdır.

## Pratik Ayırt Etme Testi

Kendine üç soru sor: (1) Parça beni gülümsetip salındırıyor mu? Muhtemelen house. (2) Tekrarın içinde kayboluyor, zamanı unutuyor muyum? Techno. (3) Göğsümde bir film müziği duygusu mu var? Melodic techno.

## Dinleyerek Öğren

Her türden birer kapı parçası: House için Frankie Knuckles "Your Love" ve Kerri Chandler kayıtları; techno için Jeff Mills "The Bells" ve Ben Klock setleri; melodic techno için Tale Of Us setleri ve Anyma kayıtları. Türleri en hızlı öğreten şey tanım değil, karşılaştırmalı dinlemedir.

## Özetle

House sıcaklık, techno hipnoz, melodic techno duygudur. Üçü de aynı four-on-the-floor iskeleti paylaşır; farkı yaratan tempo değil, niyettir. Kendi DJ kimliğini kurarken bu türlerden hangisinin "senin dilin" olduğunu keşfetmek, yolculuğun en keyifli kısmı.`,
    color: "bg-[oklch(0.88_0.05_330)]",
    read_time: "7 dk",
    is_featured: false,
    is_published: true,
    published_at: "2026-07-22T09:35:00Z",
  },
  {
    slug: "istanbulda-elektronik-muzik-mekanlari",
    title: "İstanbul'da Elektronik Müzik: Sahneyi Tanıma Rehberi",
    category: "Sahne & Kültür",
    excerpt:
      "İstanbul'un elektronik müzik sahnesi nasıl işliyor? Mekan tipleri, semt semt sahne haritası ve geceye çıkmadan bilmen gerekenler.",
    content: `İstanbul, Avrupa ile Orta Doğu arasında kendine özgü bir elektronik müzik sahnesine sahip. Berlin'in kurumsallaşmış kulüp kültürüne kıyasla daha genç, daha dağınık ama şaşırtıcı derecede canlı bir sahne bu. Bu rehber, sahneye yeni giren dinleyiciler ve DJ'ler için İstanbul'un elektronik müzik haritasını çıkarıyor.

## Sahnenin Yapısı: Üç Katman

### Kulüpler
Haftanın belli geceleri elektronik müziğe ayrılmış, ses sistemine yatırım yapmış mekanlar. İstanbul'da kalıcı "techno kulübü" sayısı azdır ve mekanlar sık el/isim değiştirir — bu yüzden mekandan çok organizatörü ve seriyi takip etmek daha güvenilir bir pusuladır.

### Organizatör kolektifleri
İstanbul sahnesinin asıl motoru. Belirli bir mekana bağlı olmayan, farklı venue'lerde parti serileri düzenleyen ekipler sahneyi taşır. Instagram'da aktif oldukları için sahneyi takip etmenin en pratik yolu, sevdiğin birkaç kolektifi takibe almaktır: bir gecede keşfettiğin organizatör, seni sonraki on geceye götürür.

### Festivaller ve tek seferlik büyük etkinlikler
Yaz aylarında şehir dışı festivaller, kış aylarında depo/endüstriyel mekan etkinlikleri. Uluslararası isimler çoğunlukla bu formatta geliyor.

## Semt Semt Kaba Harita

### Beyoğlu–Şişhane–Karaköy hattı
Sahnenin tarihi merkezi. Küçük ve orta ölçekli kulüpler, çatı mekanları ve bar-kulüp arası melez mekanlar bu hatta yoğunlaşır. Gece başlangıcı için doğal bölge.

### Kadıköy
Son on yılın yükselen sahnesi. Daha genç, daha alternatif, fiyat olarak daha erişilebilir. Yeldeğirmeni ve rıhtım çevresindeki mekanlar elektronik geceler düzenliyor; Anadolu yakası kitlesi kendi sahnesini kurdu.

### Sanayi bölgeleri ve depolar
Büyük techno etkinlikleri giderek daha fazla şehrin çeperindeki depo ve fabrika mekanlarına taşınıyor — küresel rave estetiğinin İstanbul yansıması.

### Boğaz hattı
Yazın açık hava, gün batımı ve melodic/afro house ağırlıklı etkinlikler. Daha yüksek bütçeli, "gündüz partisi" formatının merkezi.

## Geceye Çıkmadan: Pratik Bilgiler

Etkinlikler geç başlar — headliner çoğu zaman 02.00'den önce çıkmaz; warm-up saatinde gelmek hem ucuzdur hem de sahneye saygının göstergesidir. Biletler ağırlıkla online platformlarda ve Instagram üzerinden satılır; kapıda genelde daha pahalıdır. Kapı politikası mekana göre değişir; bazı gecelerde telefon kamerasına sticker uygulaması gibi mahremiyet kuralları görebilirsin — buna uy, bu kültürün parçası.

## DJ'ler İçin: Sahneye Nasıl Girilir?

İstanbul'da yolun tipik sırası şöyle işler: önce dinleyici ol ve sahneni tanı; sonra kayıtlarını düzenli yayınla; kolektiflerin open-deck / demo çağrılarını takip et; warm-up slotu teklif edildiğinde ciddiye al ve saatine uygun çal. Organizatörler, kendi etkinliklerine gelen ve sahne kültürünü bilen DJ'lere güvenir — networking, İstanbul sahnesinde her şeydir.

## Özetle

İstanbul sahnesi mekan odaklı değil, insan ve seri odaklıdır: kolektifleri takip et, warm-up saatinde git, Kadıköy'ü ve depo gecelerini keşfet. Sahne dağınık görünebilir ama içine girince sıkı örülmüş bir topluluk bulacaksın — ve bu topluluk, yeni gelenlere sanıldığından çok daha açık.`,
    color: "bg-[oklch(0.9_0.05_250)]",
    read_time: "7 dk",
    is_featured: false,
    is_published: true,
    published_at: "2026-07-22T09:40:00Z",
  },
  {
    slug: "turkiyede-elektronik-muzik-festivalleri",
    title: "Türkiye'de Elektronik Müzik Festivalleri Rehberi",
    category: "Sahne & Kültür",
    excerpt:
      "Türkiye'nin elektronik müzik festival haritası: formatlar, sezon takvimi, bilet stratejisi ve ilk festival deneyimi için ipuçları.",
    content: `Türkiye'nin elektronik müzik festival sahnesi son on yılda kendi kimliğini kurdu: Ege koylarında butik festivaller, şehir içi mega etkinlikler, Kapadokya gibi sahneleri dünyada eşi olmayan lokasyonlar. Bu rehber, festival sezonuna hazırlanmak isteyenler için genel haritayı çiziyor.

## Festival Formatları

### Butik doğa festivalleri
Türkiye sahnesinin en özel formatı. Ege ve Akdeniz koylarında, ormanlık alanlarda, 3-5 günlük kamplı festivaller. Line-up'tan çok atmosfer ve topluluk odaklıdır; müzik yelpazesi downtempo'dan techno'ya uzanır. Bilet ve kontenjanlar sınırlıdır, erken tükenir.

### Şehir festivalleri
İstanbul ve büyük şehirlerde, festival alanı veya arena formatında 1-2 günlük etkinlikler. Uluslararası headliner'lar çoğunlukla bu formatta gelir. Konfor yüksek, bilet fiyatı da öyle.

### Destinasyon etkinlikleri
Kapadokya, Bodrum, Alaçatı gibi lokasyonlarda, mekanın kendisinin yıldız olduğu etkinlikler. Cercle tarzı "sahne + manzara" formatının Türkiye ayağı; gün batımı ve melodic sound ağırlıklı.

### Depo ve indoor festivaller
Kış sezonunun formatı: endüstriyel mekanlarda, techno ağırlıklı, gece odaklı etkinlikler.

## Sezon Takvimi

Türkiye festival sezonu kabaca Mayıs'ta açılır, Eylül sonunda kapanır. Haziran ve Eylül, koy festivallerinin zirvesi (Temmuz-Ağustos sıcağına göre daha konforlu). Kış ayları şehir içi ve indoor etkinliklere döner. Uluslararası isimlerin Türkiye tarihleri genelde Avrupa turu rotasına bağlıdır — Avrupa festival sezonuyla paralel ilerler.

## Bilet Stratejisi

Butik festivallerde erken dönem (early bird) biletleri hem ucuzdur hem de çoğu zaman tek şanstır — kapasite dolunca kapı satışı olmaz. Şehir etkinliklerinde kademeli fiyatlandırma yaygındır; line-up açıklanmadan alınan "blind" erken biletler en ekonomik yoldur ama riski sana aittir. Bileti yalnızca resmi kanallardan ve bilinen platformlardan al; festival haftası ikinci el bilet dolandırıcılığı her yıl tekrarlanan bir hikayedir.

## İlk Festival Deneyimi İçin İpuçları

Kamplı festivalde ekipman listesi ciddiye al: sağlam çadır, mat, powerbank, kulak tıkacı ve güneş koruması. Programın tamamını görme hırsına kapılma — festivalin en iyi anları çoğu zaman plansız olanlardır. Su iç, arkadaşlarınla buluşma noktası belirle, telefon çekmeyen alanlar için önceden anlaş. Ve sahne kültürünün altın kuralı: dans pistinde alan aç, telefonu az kullan, anı yaşayan insanlara saygı göster.

## DJ'ler ve Üreticiler İçin Festival Sahnesi

Festivaller, yerel DJ'ler için sahneye çıkmanın en görünür basamağıdır. Çoğu butik festival, line-up'ının önemli bir kısmını yerel sahneden kurar ve demo/başvuru çağrıları yayınlar. Gündüz slotları ve ikincil sahneler, ilk festival performansın için gerçekçi hedeflerdir. Festival organizatörleri de tıpkı kulüp kolektifleri gibi topluluğun içinden insanlarla çalışmayı sever: festivale katılımcı olarak git, insanları tanı, sonra başvur.

## Özetle

Türkiye festival sahnesi format zenginliğiyle Avrupa'nın çoğu ülkesinden daha ilginç: koy festivalinden Kapadokya gün batımına, depo rave'inden arena etkinliğine uzanan bir yelpaze var. Erken bilet al, sezonu Mayıs-Eylül olarak planla ve ilk festivalini butik formattan seçmeyi düşün — bu sahnenin ruhu en saf halde orada.`,
    color: "bg-[oklch(0.92_0.05_120)]",
    read_time: "7 dk",
    is_featured: false,
    is_published: true,
    published_at: "2026-07-22T09:45:00Z",
  },
];

async function seed() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  console.log(`Seeding ${posts.length} club journal posts...`);

  for (const post of posts) {
    const { error } = await supabase
      .from("journal_posts")
      .upsert(post, { onConflict: "slug" });

    if (error) {
      console.error(`❌ Failed: ${post.slug}`, error.message);
    } else {
      console.log(`✅ ${post.slug}`);
    }
  }

  console.log("\nDone.");
}

if (require.main === module) seed().catch(console.error);
