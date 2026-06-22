import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const posts = [
  {
    slug: "kayseri-dugun-dj-rehberi-2026",
    title: "Kayseri'de Düğün DJ'i Nasıl Seçilir? 2026 Rehberi",
    category: "Düğün Müziği",
    excerpt:
      "Kayseri'de düğün DJ'i ararken nelere dikkat etmeli? Mekan akustiğinden repertuvara, ekipmandan fiyatlandırmaya kadar bilmeniz gereken her şey.",
    content: `Kayseri'de düğün hazırlığı yapan çiftlerin en çok zorlandığı konulardan biri doğru DJ'i seçmek. Müzik, bir düğünün enerjisini belirleyen en kritik unsur; doğru DJ pisti hiç boşaltmazken, yanlış tercih gecenin akışını bozabilir. Bu rehberde Kayseri'de düğün DJ'i seçerken dikkat etmeniz gereken her şeyi topladık.

## Kayseri'de Düğün Müziği Neden Önemli?

Kayseri düğünleri genellikle kalabalık, çok nesilli ve hem geleneksel hem modern beklentilerin bir arada olduğu organizasyonlardır. Aynı gecede halay isteyen misafirleri ile modern dans seti bekleyen genç misafirleri memnun etmek, ancak deneyimli bir DJ ve iyi planlanmış bir müzik akışıyla mümkündür.

## DJ Seçerken Dikkat Edilmesi Gerekenler

### 1. Repertuvar Genişliği
İyi bir düğün DJ'i Türkçe pop, oyun havaları, halay, slow ve yabancı dans müziğini akıcı şekilde harmanlayabilmelidir. Kayseri düğünlerinde geleneksel parçaların ağırlığı yüksektir; DJ'in bu repertuvara hakim olması şarttır.

### 2. Mekan Akustiği ve Ekipman
Salon mu, açık alan mı, bağ-çiftlik mi? Her mekanın akustiği farklıdır. Profesyonel DJ, mekana uygun ses sistemi ve yedek ekipmanla gelir. Açık hava düğünlerinde ses gücü ve rüzgar faktörü ayrıca önemlidir.

### 3. Canlı Müzik ve Ekip Uyumu
Pek çok Kayseri düğününde DJ'in yanında darbuka, klarnet veya solist gibi canlı performanslar yer alır. DJ'in bu sanatçılarla uyumlu çalışabilmesi geçişlerin pürüzsüz olmasını sağlar.

### 4. Referans ve Deneyim
DJ'in daha önce Kayseri'de yaptığı düğünlere ait referansları mutlaka isteyin. Yerel mekanlara ve kitleye hakim olmak, deneyimin kalitesini doğrudan etkiler.

## Müzik Akışını Doğru Planlamak

Bir düğün gecesi genelde şu bölümlerden oluşur: misafir karşılama ve kokteyl, gelin-damat girişi, ilk dans, yemek arası, oyun havaları ve halaylar, ardından modern dans seti ve after party. Her bölüm için doğru enerji seviyesini ayarlamak, DJ'in en önemli görevidir.

## Kayseri'de Popüler Düğün Mekanları ve Müzik Uyumu

Kayseri'deki düğün salonlarının büyük bölümü 300-800 kişilik kapasiteye sahiptir. Bu ölçekteki mekanlarda profesyonel ses sistemi şarttır. Bağ evleri ve açık alan organizasyonlarında ise taşınabilir ve güçlü ses donanımı gerekir.

## Kayseri'de DJ Fiyatları Hakkında

Fiyatlar; etkinlik süresi, ekipman, canlı sanatçı desteği ve mekana göre değişir. En doğru yaklaşım, etkinliğinizin detaylarını paylaşıp kişiye özel teklif almaktır. NOQT deneyim planlayıcısı ile birkaç dakikada konseptinizi oluşturup size uygun sanatçı önerilerini ve teklifi alabilirsiniz.

## Özetle

Kayseri'de unutulmaz bir düğün için DJ seçimini son dakikaya bırakmayın. Repertuvarı geniş, mekana hakim ve ekiple uyumlu çalışan bir profesyonelle ilerleyin. NOQT olarak Kayseri ve çevresinde düğün, kına ve after party organizasyonlarında size en uygun sanatçıları eşleştiriyoruz.`,
    color: "bg-[oklch(0.88_0.05_75)]",
    read_time: "6 dk",
    is_featured: true,
    is_published: true,
    published_at: "2026-01-15T10:00:00Z",
  },
  {
    slug: "nevsehir-kapadokya-acik-hava-dugun-muzik",
    title: "Nevşehir ve Kapadokya'da Açık Hava Düğünü İçin Müzik Rehberi",
    category: "Etkinlik Tasarımı",
    excerpt:
      "Kapadokya'nın eşsiz manzarasında düğün yapacaklar için açık hava müzik planlaması, ses sistemi ve atmosfer önerileri.",
    content: `Peri bacaları, balonlar ve gün batımı… Nevşehir ve Kapadokya, Türkiye'nin en büyüleyici düğün destinasyonlarından biri. Ancak açık hava düğünleri, kapalı mekanlardan farklı bir müzik ve ses planlaması gerektirir. İşte Kapadokya'da kusursuz bir müzik deneyimi için bilmeniz gerekenler.

## Açık Hava Düğününde Ses Sistemi

Açık alanda ses dağılır; bu yüzden yeterli güçte ve doğru konumlandırılmış hoparlörler şarttır. Rüzgar, misafir sayısı ve alanın büyüklüğü ses planını doğrudan etkiler. Profesyonel bir ekip, alanın akustiğini önceden değerlendirir ve jeneratör desteğiyle elektrik kesintisi riskini ortadan kaldırır.

## Kapadokya'nın Eşsiz Atmosferine Uygun Müzik Konseptleri

Kapadokya düğünleri için birkaç popüler müzik konsepti öne çıkıyor:

### Kokteyl Saati: Ambient ve Chill-Out
Gün batımı saatinde peri bacaları önünde bir aperatif seremonisi için acoustic chill-out veya hafif elektronik müzik, fotoğraf çekimlerini ve sohbetleri destekleyen mükemmel bir atmosfer yaratır.

### Akşam Yemeği: Lounge ve Türkçe Kültür
Yemek saatlerinde sakin lounge müzik veya akustik Türkçe parçalar, konukların rahatlıkla sohbet edebildiği ortam sağlar.

### Gece: Dans ve Kutlama
Hava kararınca müzik enerjisi yükselir. Modern dans müziği, Türkçe pop ve halay geçişleri geceyi taçlandırır.

## Nevşehir Bölgesinde Dikkat Edilmesi Gereken Unsurlar

Nevşehir'deki bazı alanlarda geç saate kadar yüksek sesle müzik çalmak yerel düzenlemelerle sınırlı olabilir. Etkinlik planlamasında izin süreçlerini erkenden başlatmak önemlidir. NOQT ekibi, organizasyonunuzda bu süreçlerde de yol gösterir.

## Rüzgar ve Hava Durumu Planlaması

Kapadokya'da akşam saatlerinde rüzgar güçlenebilir. Ses ekipmanlarının korunması ve müzik kalitesinin sürekliliği için her zaman yedek plan hazırlanmalıdır.

## Sonuç

Nevşehir ve Kapadokya'da açık hava düğünü, doğru müzik planlamasıyla ömür boyu hatırlanacak bir deneyime dönüşür. NOQT olarak Kapadokya bölgesindeki bağ evi, otel ve özel alan düğünlerinde ses sistemi, DJ ve canlı müzik hizmetleri sunuyoruz.`,
    color: "bg-[oklch(0.92_0.02_320)]",
    read_time: "5 dk",
    is_featured: false,
    is_published: true,
    published_at: "2026-01-22T10:00:00Z",
  },
  {
    slug: "kayseri-kina-gecesi-muzik-rehberi",
    title: "Kayseri'de Kına Gecesi Müziği: Geleneksel ve Modern Seçenekler",
    category: "Kına Gecesi",
    excerpt:
      "Kayseri kına gecelerinde müzik nasıl planlanmalı? Geleneksel türküleri modern aranjmanlarla buluşturan konseptler ve uzman önerileri.",
    content: `Kına gecesi, düğün öncesinin en duygusal ve bir o kadar da eğlenceli anıdır. Kayseri'de kına geceleri hem gelin hem misafirlere özgün bir deneyim sunar. Müzik seçimi bu deneyimi ya taçlandırır ya da unutulur kılar.

## Kayseri Kına Gecelerinde Müzik Geleneği

Kayseri'de kına geceleri geleneksel olarak türküler ve oyun havalarıyla başlar, genç neslin enerji kattığı modern müzikle devam eder. Bu geçişi doğal ve pürüzsüz yapan bir DJ veya canlı müzisyen, geceyi unutulmaz kılar.

## Kına Gecesi İçin Müzik Akışı

### Karşılama ve Hazırlık (İlk 1 Saat)
Misafirler toplandıkça hafif Türkçe pop veya akustik türküler ortamı ısıtır. Ağlama türküleri yerine neşeli geleneksel ezgiler tercih edilir.

### Kına Töreni (30-45 Dakika)
Gelinin ellerine kına yakılırken geleneksel kına türküleri çalınır. Bu bölümde canlı davul-zurna veya klarnet, atmosferi tamamlar.

### Eğlence Bölümü (2-3 Saat)
Kına töreninin ardından oyun havaları, modern düğün şarkıları ve sürpriz eğlencelerle gece doruk noktasına ulaşır.

## Kayseri'de Popüler Kına Müzik Seçenekleri

**Geleneksel:** Kayseri türküleri, Anadolu oyun havaları, çiftetelli
**Karma:** Türkçe pop ile geleneksel geçişler
**Modern:** Güncel Türkçe pop, disco ve dans müziği

## Dekorasyon ve Müzik Uyumu

Müzik teması mekan dekorasyonuyla uyumlu olmalıdır. Bohem tarzı bir kına gecesinde akustik ve folklorik müzik, modern konsept kına için ise çağdaş aranjmanlar daha uygun düşer.

## Kına Gecesi DJ'i ile Canlı Müzisyen Farkı

Kına geceleri için her iki seçenek de idealdir. DJ, geniş repertuvarla anlık taleplere yanıt verebilirken, canlı klarnet veya kemençe nostaljik bir atmosfer yaratır. En iyi sonucu, ikisini birlikte kullanmak verir.

## NOQT Kına Gecesi Paketi

NOQT olarak Kayseri'deki kına geceleriniz için DJ, canlı müzisyen ve ses sistemi kombinasyonlarıyla kişiye özel paketler sunuyoruz. Deneyim planlayıcımızı kullanarak birkaç dakikada konseptinizi oluşturun ve size özel teklifi alın.`,
    color: "bg-[oklch(0.94_0.01_200)]",
    read_time: "5 dk",
    is_featured: false,
    is_published: true,
    published_at: "2026-02-01T10:00:00Z",
  },
  {
    slug: "dugunde-ilk-dans-sarkisi-secimi",
    title: "Düğünde İlk Dans Şarkısı Nasıl Seçilir? 100 Öneri",
    category: "Düğün Müziği",
    excerpt:
      "İlk dans şarkısı seçimi zor geliyorsa bu rehber tam size göre. Türkçe ve yabancı seçenekler, tempo ipuçları ve DJ önerileri.",
    content: `Düğünün en romantik anı olan ilk dans, doğru şarkı seçimiyle kalıcı bir anıya dönüşür. Ancak onlarca seçenek arasından "o" şarkıyı bulmak çiftlere zaman zaman zor gelebilir. İşte en sık sorulan soruları ve pratik önerileri bir araya getirdik.

## İlk Dans Şarkısı Seçerken Dikkat Edilmesi Gerekenler

### Tempo
Şarkının temposu dans seviyenizle uyuşmalı. Yavaş tempo için waltz veya basit adımlar yeterliyken, orta tempolu şarkılar daha dinamik görünüm sağlar.

### Anlam
Sözler sizin için anlam taşımalı. İlk kez buluştuğunuz yerde çalan şarkı, evlenme teklifinde eşliğiniz olan melodi veya sadece birlikte seçtiğiniz bir parça olabilir.

### Süre
İdeal ilk dans 2,5-3,5 dakikadır. Daha uzun parçalar DJ tarafından kısaltılabilir; bu isteği önceden belirtmek yeterli.

## Türkçe İlk Dans Şarkısı Önerileri

Duman, Teoman, Sertab Erener, Sezen Aksu gibi sanatçıların lento ve ballad parçaları Türkçe ilk danslar için en çok tercih edilenlerin başında gelir. Kayseri ve çevre illerdeki çiftlerin özellikle anadolu pop ağırlıklı parçalara yöneldiği gözlemlenmektedir.

## Yabancı İlk Dans Şarkısı Önerileri

Klasikler hiç eskimez: Ed Sheeran, John Legend, Elvis Presley'in evergreen parçaları veya sinema müzikleri sık tercih edilir. Caz standartları ise şıklık arayanlar için idealdir.

## DJ ile Önceden Konuşun

Seçtiğiniz şarkının düğün sürümünü (uzunluğu, varsa fade-in/out noktasını) DJ'inize önceden bildirin. Gerekirse şarkı düzenlenerek tam siz piste çıktığınızda başlayacak şekilde ayarlanabilir.

## Sürpriz Koreografi İçin İpuçları

Birçok çift, yavaş şarkıyla başlayan ve ardından dans versiyonuna geçen sürpriz koreografilerle misafirlerini şaşırtıyor. Bu tür geçişler DJ ile detaylıca planlanmalı ve en az 2-3 prova yapılmalıdır.

## NOQT'un Önerisi

İlk dans, düğünün en çok fotoğraflanan anlarından biridir. Bu nedenle müzik seçiminin yanı sıra ışık tasarımı da kritiktir. NOQT olarak DJ, ışık efekti ve koreografi danışmanlığını bir arada sunarak bu anı mükemmel kılıyoruz.`,
    color: "bg-[oklch(0.91_0.025_160)]",
    read_time: "6 dk",
    is_featured: false,
    is_published: true,
    published_at: "2026-02-10T10:00:00Z",
  },
  {
    slug: "kayseri-after-party-dj-etkinlik",
    title: "Kayseri'de After Party Nasıl Organize Edilir?",
    category: "After Party",
    excerpt:
      "Düğünün ardından gelen after party, geceyi doruğa taşıyan özel bir deneyimdir. Kayseri'de after party organizasyonu için ipuçları.",
    content: `Düğün resmi programı bitince eğlence çoğu zaman yeni bir forma bürünür: after party. Yakın arkadaşlar ve aile fertleriyle sabahın ilk saatlerine kadar süren bu özel bölüm, doğru planlanırsa düğünün en çok konuşulan anlarından birine dönüşür.

## After Party Nedir?

After party, düğünün resmi programının ardından genellikle daha küçük bir katılımcı grubuyla düzenlenen özel bir eğlencedir. Dekor daha minimal, müzik daha enerjik ve atmosfer çok daha samimi olur.

## Kayseri'de After Party İçin Doğru Mekan

After party için düğün salonunun bir bölümü, otel lobisi, teras ya da bağ evi idealdir. Mekanın kapasitesi, son kalan misafir sayısına göre hesaplanmalıdır. Kayseri'nin merkezi ve çevresindeki boutiqueoteller bu tür organizasyonlar için oldukça uygun alanlara sahiptir.

## After Party Müzik Konseptleri

### Club & Electronic
DJ'in enerjisi zirveye çıkar. Derin bas ve yüksek tempo, pistin boş kalmamasını sağlar.

### Türkçe Pop ve R&B
Daha geniş bir kitlenin keyif alacağı karma bir set; modern Türkçe hitler ve uluslararası R&B klasikleri.

### Lounge & Chill
Sabaha karşı veya daha küçük gruplar için sakin bir kapanış seti. Konuşmaları engellemeyen arka plan müziği.

## Dikkat Edilmesi Gerekenler

After party organizasyonunda en sık yapılan hatalar: müzik geçişlerini önceden planmamak, ses düzeyini yetersiz ayarlamak ve mekanın kapanış saatini göz ardı etmek. Bu detaylar DJ ile birlikte erkenden netleştirilmelidir.

## Kayseri After Party Paketleri

NOQT olarak Kayseri'deki after party organizasyonlarınız için DJ, ses sistemi, ışık efekti ve içecek servisi koordinasyonu konusunda komple çözümler sunuyoruz. Deneyim planlayıcımız aracılığıyla birkaç adımda kişiye özel teklif alabilirsiniz.`,
    color: "bg-[oklch(0.90_0.04_55)]",
    read_time: "5 dk",
    is_featured: false,
    is_published: true,
    published_at: "2026-02-18T10:00:00Z",
  },
  {
    slug: "kapadokya-bag-evi-dugun-organizasyonu",
    title: "Kapadokya Bağ Evi Düğünü: Müzik ve Deneyim Planlaması",
    category: "Etkinlik Tasarımı",
    excerpt:
      "Kapadokya'nın tarihi bağ evlerinde düğün organize etmek isteyenler için müzik konseptleri, ses sistemi ve atmosfer önerileri.",
    content: `Kapadokya'daki bağ evleri, ahşap tonları, taş duvarları ve bahçeleriyle doğal bir düğün sahnesi sunar. Ancak bu mekanların kendine özgü ses akustiği ve kapasitesi, organizasyonun müzik planlamasını farklı kılar.

## Bağ Evi Düğünlerinin Kendine Özgü Atmosferi

Kapadokya bağ evlerinde düğün yapmak, doğallığı ve özgünlüğü ön plana çıkarır. Standart salon düğünlerinden farklı olarak burada müzik mekanın ruhuna uyum sağlamalıdır. Sert elektronik veya kulüp müziği yerine, akustik ve folklorik unsurları modern dokunuşlarla harmanlayan bir yaklaşım önerilir.

## Bağ Evi Ses Sistemi

Bağ evlerinin akustiği salona göre çok farklıdır. Taş yüzeyler yankı yaratabilir. Bu nedenle yönlendirilebilir hoparlör sistemleri ve mekan öncesi ses testi oldukça önemlidir. Elektrik altyapısı yetersizse jeneratör mutlaka planlanmalıdır.

## Önerilen Müzik Konseptleri

### Güneş Batımı Kokteyli
Canlı akustik gitar veya bağlama ile ambient müzik, Kapadokya silueti önünde büyüleyici bir giriş yaratır.

### Yemek Servisi
Sakin Türk sanat müziği veya lounge jazz, yemek boyunca konuşmaları destekleyen bir zemin oluşturur.

### Gece Eğlencesi
Dans ve eğlence bölümünde Türkçe pop, oyun havaları ve seçilmiş uluslararası hitler pistin dolmasını sağlar.

## Kapadokya'daki Bağ Evleri İçin İzin ve Gürültü Kuralları

Nevşehir iline bağlı bağ evlerinde gece 23:00-00:00 sonrası açık hava müzik yayını yerel yönetim kurallarına tabidir. NOQT organizasyon ekibi, gerekli izin süreçleri konusunda destek sağlar.

## NOQT Kapadokya Bağ Evi Paketi

Kapadokya'daki bağ evi düğününüz için DJ, canlı müzisyen, ses sistemi ve ışık tasarımı konusunda komple hizmet sunuyoruz. Deneyim planlayıcımızı kullanarak müzik konseptinizi oluşturun ve size özel teklif alın.`,
    color: "bg-[oklch(0.93_0.008_280)]",
    read_time: "5 dk",
    is_featured: false,
    is_published: true,
    published_at: "2026-03-01T10:00:00Z",
  },
  {
    slug: "kayseri-mezuniyet-partisi-organizasyonu",
    title: "Kayseri'de Mezuniyet Partisi Organizasyonu: Müzik ve Etkinlik Rehberi",
    category: "Etkinlik Tasarımı",
    excerpt:
      "Kayseri'de mezuniyet partisi planlıyorsanız doğru DJ, ses sistemi ve müzik konsepti seçimi için bu rehberi okuyun.",
    content: `Mezuniyet, hayatın en önemli dönüm noktalarından biri. Bu kutlamayı unutulmaz kılmak için doğru müzik ve organizasyon planlaması şart. Kayseri'de mezuniyet partisi organizasyonu için bilmeniz gerekenleri bir araya getirdik.

## Mezuniyet Partisi İçin Mekan Seçimi

Kayseri'deki mezuniyet partileri genellikle düğün salonları, boutiqueoteller veya bağ evlerinde düzenlenir. Katılımcı sayısı 100 ile 500 arasında değişebilir. Mekan kapasitesi, ses sistemi altyapısı ve parklanma imkânı değerlendirilmelidir.

## Mezuniyet Partisi Müzik Akışı

Mezuniyet partilerinde müzik genellikle şu şekilde akar: Açılış kokteylinde hafif lounge veya akustik set, ardından resmi tören süresinde saygın arka plan müziği, törenden sonra serbest dans ve eğlence bölümü. Eğlence bölümünde güncel Türkçe pop, uluslararası hitler ve dans floor klasikleri tercih edilir.

## Kayseri'de Mezuniyet DJ'i Seçerken

Mezuniyet kutlamalarında katılımcılar genellikle 18-25 yaş arasındadır. Güncel müzik trendlerine ve özel şarkı taleplerine hızlı yanıt verebilen bir DJ, geceyi zirveye taşır. Önceden istek listesi hazırlanması hem DJ'e hem de katılımcılara büyük kolaylık sağlar.

## Teknik Gereksinimler

Ses sistemi güç bakımından katılımcı sayısına uygun olmalı. 200+ kişilik organizasyonlarda subwoofer destekli sistem, ışık efektleri ve fog machine geceyi kulüp atmosferine taşır.

## Fiyatlandırma ve Bütçe

Kayseri'de mezuniyet partisi organizasyonu, DJ, ses sistemi ve ışık ekipmanı dahil olmak üzere bütçenize göre çeşitli paket seçeneklerine sahiptir. NOQT deneyim planlayıcısıyla etkinliğinizin detaylarını girin, size özel bir teklif oluşturalım.`,
    color: "bg-[oklch(0.88_0.05_75)]",
    read_time: "4 dk",
    is_featured: false,
    is_published: true,
    published_at: "2026-03-10T10:00:00Z",
  },
  {
    slug: "dugun-canli-muzik-mi-dj-mi",
    title: "Düğünde Canlı Müzik mi, DJ mi? Artıları ve Eksileri",
    category: "Düğün Müziği",
    excerpt:
      "Düğününüz için canlı müzik mi yoksa DJ mi doğru tercih? İkisi arasındaki farkları, avantajları ve Kayseri'deki gerçek maliyetleri karşılaştırdık.",
    content: `Düğün organizasyonunda en sık sorulan sorulardan biri şudur: Canlı müzik mi tercih etmeli, yoksa DJ mi? Her iki seçeneğin de kendine özgü avantajları ve kısıtlamaları var. Kayseri ve Nevşehir özelinde bu iki seçeneği detaylıca ele aldık.

## Canlı Müziğin Avantajları

Canlı performanslar, düğüne özgün ve unutulmaz bir atmosfer katar. Misafirler bir şovun parçası olduğunu hisseder. Özellikle kokteyl saati, yemek arası ve ilk dans için canlı müzik tercih, duygusal derinliği artırır.

Popüler seçenekler arasında akustik gitar ve vokal duo, keman ve piyano ikilisi, caz quartet ya da davul-zurna ekibi sayılabilir.

## Canlı Müziğin Dezavantajları

Canlı sanatçıların repertuvarı sınırlıdır; anlık şarkı taleplerini karşılamak her zaman mümkün olmayabilir. Maliyet genellikle DJ'e kıyasla daha yüksektir ve mola süreleri hesaba katılmalıdır.

## DJ'in Avantajları

Profesyonel bir DJ, binlerce şarkıya anında erişebilir. Enerji seviyesini pistin durumuna göre ayarlayabilir, anlık taleplere kolayca yanıt verebilir. Genellikle daha uygun maliyetlidir ve kesintisiz müzik sunabilir.

## DJ'in Dezavantajları

Bazı misafirler canlı performansın özgünlüğünü ve sahne enerjisini özler. DJ kalitesi büyük ölçüde deneyime ve kullandığı ekipmana bağlıdır.

## Karma Seçenek: En İyi Dünya

Kayseri ve Nevşehir'deki birçok düğünde en popüler çözüm, karma modeldir: kokteyl saatinde canlı müzisyen, yemek süresince arka plan müziği için DJ seti, dans ve eğlence bölümünde tam kapasiteli DJ performansı. Bu model, bütçeyi dengelerken her iki dünyanın en iyisini sunar.

## Kayseri ve Nevşehir'de Maliyetler

Her iki seçeneğin de fiyatları; süre, ekipman, sanatçı deneyimi ve etkinlik büyüklüğüne göre değişir. NOQT olarak ihtiyacınıza özel paket hazırlıyor, hem canlı müzisyen hem DJ koordinasyonunu tek çatı altında yönetiyoruz.`,
    color: "bg-[oklch(0.94_0.01_200)]",
    read_time: "6 dk",
    is_featured: false,
    is_published: true,
    published_at: "2026-03-18T10:00:00Z",
  },
  {
    slug: "kayseri-kurumsal-etkinlik-muzik-organizasyonu",
    title: "Kayseri'de Kurumsal Etkinlik Müzik Organizasyonu",
    category: "Kurumsal Etkinlik",
    excerpt:
      "Kayseri'deki kurumsal etkinlikler için profesyonel müzik ve DJ organizasyonu. Ürün lansmanından yıl sonu galasına kadar tüm detaylar.",
    content: `Kayseri, son yıllarda büyüyen sanayi ve ticaret altyapısıyla kurumsal etkinlik organizasyonları için de önemli bir merkeze dönüştü. Şirket yıl sonu partileri, ürün lansmanları, bayilik toplantıları ve kurumsal galalar için doğru müzik organizasyonu, etkinliğin profesyonelliğini yansıtır.

## Kurumsal Etkinlik Türleri ve Müzik İhtiyaçları

### Yıl Sonu Gala ve Kutlamaları
Şirketin kurumsal kimliğini yansıtan şık bir lounge set, ardından enerjik bir dans programı. Çalışanların rahatlaması ve kutlama ruhuna girmesi için müzik kritik rol oynar.

### Ürün Lansmanı ve Tanıtım Etkinlikleri
Marka sesini yansıtan özel bir müzik kurgu, etkinliğin atmosferini belirler. Genellikle arka planda akustik veya ambient set tercih edilir.

### Bayilik ve İş Ortağı Toplantıları
Yüksek ses yerine sohbeti destekleyen fon müziği önerilir. Yemek saatlerinde canlı akustik performans şık bir dokunuş katar.

### Açılış Törenleri
Ses tasarımı ve enerji yönetimi kritiktir. Doğru müzik geçişleri, konuşmacılar arasındaki boşlukları doldurur ve katılımcıları sahneye odaklar.

## Kayseri'de Kurumsal Etkinlik Mekanları

Kayseri Kongre Merkezi, büyük otel toplantı salonları ve OSB bölgesindeki özel etkinlik alanları kurumsal organizasyonların sık kullandığı mekanlardır. Bu alanların teknik altyapıları genellikle gelişmiş olsa da her mekanın akustiği farklıdır.

## Teknik Ekipman

Kurumsal etkinliklerde yalnızca müzik değil, sunum sesi de (mikrofon, tur rehber sistemleri, translation ekipmanı) yönetilmelidir. NOQT ekibi, ses teknikeri ve DJ koordinasyonunu birlikte sunar.

## NOQT Kurumsal Çözümleri

Kayseri merkezli firmalara yıl sonu partisi, lansman ve gala organizasyonlarında komple müzik ve ses çözümleri sunuyoruz. Kurumsal etkinlikleriniz için özel teklif almak için deneyim planlayıcımızı kullanabilirsiniz.`,
    color: "bg-[oklch(0.91_0.025_160)]",
    read_time: "5 dk",
    is_featured: false,
    is_published: true,
    published_at: "2026-04-01T10:00:00Z",
  },
  {
    slug: "nevsehir-dugun-organizasyonu-rehberi",
    title: "Nevşehir'de Düğün Organizasyonu: Müzik, Mekan ve DJ Rehberi",
    category: "Düğün Müziği",
    excerpt:
      "Nevşehir'de düğün planlamak isteyenler için kapsamlı bir rehber: DJ seçimi, mekan önerileri, müzik konseptleri ve dikkat edilmesi gerekenler.",
    content: `Nevşehir, Kapadokya'nın efsanevi manzarasına ev sahipliği yapmasıyla hem yerel halkın hem de destination wedding çiftlerinin gözdesi haline gelmiştir. Şehirde ve çevresinde düğün planlayanlar için müzik ve organizasyon rehberini hazırladık.

## Nevşehir'de Düğün Mekan Seçenekleri

Nevşehir ve çevresi oldukça çeşitli mekan alternatifleri sunar:

**Kapadokya cave otel ve butik oteller:** UNESCO miras alanına yakın konumlarıyla uluslararası çiftlerin gözdesi. Kapasiteleri genellikle 50-200 kişidir.

**Bağ evleri ve çiftlikler:** Özgün atmosfer ve doğayla iç içe deneyim. Ses sistemi kurulumu ekstra planlama gerektirir.

**Nevşehir şehir merkezi düğün salonları:** Daha geniş kapasiteli ve teknik altyapısı hazır mekanlar. Kalabalık düğünler için idealdir.

## Nevşehir'de DJ Seçerken

Nevşehir'deki düğünlerde hem yerel müzik kültürü hem de uluslararası misafir profili göz önünde bulundurulmalıdır. DJ'in çok dilli playlist hazırlayabilmesi ve farklı kültürlerden misafirlere hitap edecek esneklikte olması beklenir.

## Kapadokya'da Gün Batımı Töreni Müziği

Kapadokya'da gün batımı vakti yapılan nikah törenleri için orkestral veya akustik düzenlemeler büyüleyici bir atmosfer yaratır. Bu özel an için keman, çello veya akustik gitar solist tercih edilebilir.

## Kültürel Geçişler

Nevşehir düğünlerinde Türk misafirler için geleneksel oyun havaları ve halay, uluslararası misafirler için ise modern dans müziği gerektirir. DJ'in bu iki dünyayı sorunsuzca birleştirebilmesi kritiktir.

## Nevşehir'de Müzik Organizasyonu İçin Pratik Bilgiler

Açık hava etkinliklerinde gürültü sınırlamalarına, mekan sahibiyle koordinasyona ve yedek elektrik planlamasına dikkat edilmelidir. NOQT ekibi tüm bu teknik detayları sahaya yansıtır.

## NOQT ile Nevşehir Düğünü

NOQT olarak Nevşehir ve Kapadokya bölgesindeki düğünlerde DJ, canlı müzisyen, ses sistemi ve ışık tasarımı hizmetleri sunuyoruz. Deneyim planlayıcımızı kullanarak hayalinizdeki düğüne giden yolu birlikte planlayalım.`,
    color: "bg-[oklch(0.90_0.04_55)]",
    read_time: "6 dk",
    is_featured: false,
    is_published: true,
    published_at: "2026-04-10T10:00:00Z",
  },
];

async function seed() {
  console.log(`Seeding ${posts.length} journal posts...`);

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

seed().catch(console.error);
