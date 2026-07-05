export type EventPage = {
  slug: string;
  emoji: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  hero: {
    eyebrow: string;
    headline: string;
    sub: string;
  };
  about: {
    heading: string;
    body: string;
  };
  features: { icon: string; title: string; desc: string }[];
  faq: { q: string; a: string }[];
};

export const EVENT_PAGES: EventPage[] = [
  {
    slug: "dugun-dj",
    emoji: "💍",
    title: "Düğün",
    metaTitle: "Düğün DJ & Müzik Organizasyonu — NOQT",
    metaDescription:
      "Düğününüzün müziğini profesyonelce tasarlayın. Karşılamadan halaya, first dance'den after party'ye kadar eksiksiz müzik deneyimi. Kayseri, Nevşehir ve Kapadokya bölgesinde profesyonel hizmet.",
    keywords: [
      "düğün dj",
      "düğün müziği",
      "düğün organizasyonu müzik",
      "wedding dj türkiye",
      "kayseri düğün dj",
      "düğün dj fiyatları",
      "düğün sahnesi müzik",
      "nikah müziği",
      "ilk dans müziği",
      "düğün dj izmir",
      "düğün dj ankara",
    ],
    hero: {
      eyebrow: "Düğün Müziği",
      headline: "Düğününüzün soundtrack'ini birlikte yazalım.",
      sub: "Karşılamadan son dansa, kokteyl saatinden halaya kadar her anı doğru müzikle tasarlıyoruz.",
    },
    about: {
      heading: "Neden düğün müziği bu kadar önemli?",
      body: "Misafirleriniz yıllar sonra düğününüzü anlatırken iki şeyi hatırlayacak: yemek ve müzik. Doğru DJ doğru anda doğru şarkıyı çaldığında salon bir anda dönüşüyor. Biz bunu tesadüfe bırakmıyoruz — her geceyi sizinle birlikte planlıyor, her anı önceden tasarlıyoruz.",
    },
    features: [
      { icon: "🎵", title: "Kişiselleştirilmiş Setlist", desc: "Sizin müzik zevkinize göre hazırlanan, hiçbir düğünde tekrarlanmayan program" },
      { icon: "🎤", title: "MC & Koordinasyon", desc: "Salon koordinasyonu ve geçişlerin yönetimi tek elden" },
      { icon: "🔊", title: "Profesyonel Ses Ekipmanı", desc: "Mekanınıza uygun kurulum ve ses kalibrasyonu" },
      { icon: "📋", title: "Detaylı Planlama", desc: "Müzik akış planı, istek listesi ve timeline önceden netleştirilir" },
    ],
    faq: [
      { q: "Düğün öncesinde görüşme yapıyor musunuz?", a: "Evet, her çift ile en az bir ön görüşme yapıyoruz. Müzik zevkinizi, olmazsa olmazlarınızı ve kaçınmanız gerekenleri konuşuyoruz." },
      { q: "İstek şarkı alıyor musunuz?", a: "Kesinlikle. Hem sizden hem de misafirlerinizden istek alabiliyor, bunu akışı bozmadan programa entegre ediyoruz." },
      { q: "Hangi bölgelerde hizmet veriyorsunuz?", a: "Kayseri ve Nevşehir merkez olmak üzere Kapadokya bölgesi ve çevre illerde hizmet veriyoruz. Bölge dışı etkinlikler için de bizimle iletişime geçebilirsiniz." },
      { q: "Fiyatlandırma nasıl işliyor?", a: "Fiyat; mekan, süre ve ekipman gereksinimine göre değişiyor. Planla aracımızla taslak oluşturduktan sonra size özel teklif sunuyoruz." },
    ],
  },
  {
    slug: "kina-gecesi",
    emoji: "🔥",
    title: "Kına Gecesi",
    metaTitle: "Kına Gecesi Müziği & DJ — NOQT",
    metaDescription:
      "Kına gecenizi unutulmaz kılan müzik programı. Roman havası, halay, geleneksel ve modern karışım. Profesyonel DJ ve ses sistemi ile kına organizasyonu.",
    keywords: [
      "kına gecesi müziği",
      "kına gecesi dj",
      "kına organizasyonu",
      "kına gecesi roman havası",
      "kına müzik programı",
      "halay müziği",
      "kına gecesi sanatçı",
      "kına gecesi kayseri",
    ],
    hero: {
      eyebrow: "Kına Gecesi",
      headline: "Gelenekle modernin buluştuğu bir kına gecesi.",
      sub: "Roman havalarından halaylara, modern ritimlerden geleneksel ezgilere — kına gecenizin her anı için doğru müzik.",
    },
    about: {
      heading: "Kına gecesinde müzik nasıl olmalı?",
      body: "Kına gecesi hem duygusal hem de enerjik bir gece. Başlangıçta nostaljik ve geleneksel bir atmosfer kurmak, törenden sonra salonu dans pistine çevirmek için akışı iyi yönetmek gerekiyor. Biz bu geçişleri sizinle planlıyor, gelinin ve ailesinin isteklerini programın merkezine koyuyoruz.",
    },
    features: [
      { icon: "🎶", title: "Geleneksel & Modern Karışım", desc: "Türk sanat müziğinden roman havalarına, arabeskten modern pop'a geniş repertuar" },
      { icon: "🥁", title: "Halay & Ritim Yönetimi", desc: "Halayların doğru anda açılması ve enerji yönetimi" },
      { icon: "🎤", title: "Canlı Performans Seçeneği", desc: "DJ'e ek olarak davul zurna veya canlı müzisyen seçeneği" },
      { icon: "📋", title: "Tören Koordinasyonu", desc: "Kına yakma anı ve geçiş müziklerinin önceden planlanması" },
    ],
    faq: [
      { q: "Kına gecesi için hangi müzik türlerini çalıyorsunuz?", a: "Roman havaları, türküler, halay müziği, arabeskten modern Türkçe pop'a kadar geniş bir repertuarımız var. Ailenin isteklerine göre kişiselleştiriyoruz." },
      { q: "Davul zurna ayarlıyor musunuz?", a: "Evet, talep halinde yerel ekiplerle koordineli çalışabiliyor veya canlı müzisyen sağlayabiliriz." },
      { q: "Kına töreni ile eğlence kısmını nasıl yönetiyorsunuz?", a: "Tören sırasında duygusal ve geleneksel bir atmosfer kurulur, tören bitince enerji kademeli olarak yükseltilir. Bu geçişi sizinle önceden planlıyoruz." },
    ],
  },
  {
    slug: "mezuniyet-partisi",
    emoji: "🎓",
    title: "Mezuniyet Partisi",
    metaTitle: "Mezuniyet Partisi DJ & Organizasyonu — NOQT",
    metaDescription:
      "Mezuniyet gecenizi unutulmaz kılın. Okul balo organizasyonu, mezuniyet partisi DJ, öğrenci gecesi müziği. Kayseri ve Nevşehir bölgesinde profesyonel hizmet.",
    keywords: [
      "mezuniyet partisi",
      "mezuniyet gecesi dj",
      "okul balosu organizasyonu",
      "mezuniyet balo müziği",
      "mezuniyet dj",
      "üniversite mezuniyet partisi",
      "lise mezuniyet gecesi",
      "mezuniyet organizasyonu kayseri",
      "öğrenci gecesi organizasyonu",
    ],
    hero: {
      eyebrow: "Mezuniyet Partisi",
      headline: "Yılların emeğini tek bir gecede kutlayın.",
      sub: "Mezuniyet geceniz için müzik, atmosfer ve deneyim — sınıfınızın karakterine göre tamamen özelleştirilmiş.",
    },
    about: {
      heading: "Mezuniyet gecesi neden özel bir planlama gerektirir?",
      body: "Mezuniyet partisi hem nostaljik hem de kutlama odaklı bir gece. Sınıfın ortak şarkıları, yıllar içinde biriktirilen anılar ve coşkulu bir kapanış — bunların hepsini doğru müzikle bir araya getirmek deneyim ister. Biz sınıfınızla konuşuyor, dönemin hit şarkılarını ve sınıfın favorilerini programın merkezine koyuyoruz.",
    },
    features: [
      { icon: "🎵", title: "Neslin Müziği", desc: "Sınıfın büyüdüğü dönemin hitlerini ve güncel parçaları harmanlıyoruz" },
      { icon: "📸", title: "Memory Drive Entegrasyonu", desc: "Misafirler QR ile fotoğraf yükler, gece boyunca anlar toplanır" },
      { icon: "🎤", title: "Özel Anons & Törenler", desc: "Diploma töreni ve özel anların müzik koordinasyonu" },
      { icon: "🌙", title: "Uzun Gece Programı", desc: "Akşam başlangıçtan sabaha kadar enerji yönetimi" },
    ],
    faq: [
      { q: "Sınıfın favori şarkıları programa dahil edilebilir mi?", a: "Kesinlikle. Görüşme sırasında sınıf temsilcisinden istek listesi alıyoruz ve programın bel kemiğini bu liste oluşturuyor." },
      { q: "Okul veya mekan ile koordineli çalışabilir misiniz?", a: "Evet. Mekan teknik gereksinimleri, ses limitleri ve zaman kısıtlamalarını önceden netleştiriyoruz." },
      { q: "Kaç kişilik etkinlikler için hizmet veriyorsunuz?", a: "50 kişilik sınıf buluşmalarından 500+ kişilik balo organizasyonlarına kadar her ölçekte çalışıyoruz." },
    ],
  },
  {
    slug: "dogum-gunu-partisi",
    emoji: "🎂",
    title: "Doğum Günü Partisi",
    metaTitle: "Doğum Günü Partisi DJ & Organizasyonu — NOQT",
    metaDescription:
      "Doğum günü partinizi unutulmaz kılın. Özel doğum günü DJ, kişiselleştirilmiş müzik programı. 18, 21, 30, 40, 50 yaş doğum günleri için profesyonel organizasyon.",
    keywords: [
      "doğum günü partisi organizasyonu",
      "doğum günü dj",
      "özel doğum günü organizasyonu",
      "doğum günü müziği",
      "doğum günü dj kayseri",
      "doğum günü partisi kayseri",
      "surprise party organizasyonu",
      "30 yaş doğum günü partisi",
      "40 yaş kutlaması",
      "50 yaş partisi",
    ],
    hero: {
      eyebrow: "Doğum Günü Partisi",
      headline: "Bir yıl daha geçti. Kutlamayı hak ediyorsunuz.",
      sub: "18'den 50'ye, sürprizden büyük partiye — doğum günü gecenizi sizin kişiliğinize göre tasarlıyoruz.",
    },
    about: {
      heading: "Doğum günü partisinde müzik nasıl kişiselleştirilir?",
      body: "Her doğum günü farklı. Kimileri sürpriz istiyor, kimileri küçük ve samimi bir gece, kimileri büyük bir parti. Ortak nokta: müziğin o kişiye özel hissettirmesi. Favori sanatçılar, anı dolu şarkılar, yaşın getirdiği dönemin hitlerini bir araya getirerek o geceyi anlatmaya değer kılıyoruz.",
    },
    features: [
      { icon: "🎂", title: "Yaşa Özel Müzik Seçimi", desc: "Doğum yılından bu yana biriken favori şarkılar ve dönem hitleri" },
      { icon: "🎊", title: "Sürpriz Koordinasyonu", desc: "Sürpriz giriş, pasta anı ve özel anonsların müzik planlaması" },
      { icon: "🎵", title: "Geniş Müzik Yelpazesi", desc: "Pop, R&B, dance, Türkçe — misafir kitlesine göre akıllı karışım" },
      { icon: "📸", title: "Anı Galerisi", desc: "Geceye özel QR ile misafir fotoğraf yükleme ve anlık galeri" },
    ],
    faq: [
      { q: "Pasta anı ve sürpriz girişler için müzik koordinasyonu yapıyor musunuz?", a: "Evet. Bu özel anları önceden planlıyor, hangi şarkının nerede çalınacağını birlikte kuruyoruz." },
      { q: "Ev partileri için de hizmet veriyor musunuz?", a: "Evet. Küçük ev ortamlarına uygun daha kompakt sistemlerle hizmet verebiliyoruz." },
      { q: "Minimum kaç kişilik için hizmet alınabilir?", a: "25 kişilik samimi partilerden büyük kutlamalara kadar çalışıyoruz. Detayları konuşarak size özel çözüm sunuyoruz." },
    ],
  },
  {
    slug: "bekarliga-veda-bride",
    emoji: "👰",
    title: "Bekarlığa Veda / Bride Party",
    metaTitle: "Bekarlığa Veda & Bride Party Organizasyonu — NOQT",
    metaDescription:
      "Bekarlığa veda partisi ve bride party organizasyonu. Özel müzik programı, kişiselleştirilmiş atmosfer. Kayseri, Nevşehir ve Kapadokya bölgesinde hen party ve bachelorette party.",
    keywords: [
      "bekarlığa veda partisi",
      "bride party organizasyonu",
      "hen party kapadokya",
      "bachelorette party türkiye",
      "bekarlığa veda müziği",
      "gelin partisi organizasyonu",
      "bride party dj",
      "bekarlığa veda kayseri",
    ],
    hero: {
      eyebrow: "Bekarlığa Veda / Bride Party",
      headline: "Son özgür gecenizi unutulmaz kılın.",
      sub: "Sadece sizin ve yakınlarınıza özel, sıfırdan tasarlanmış bir gece — müziği, atmosferi ve anları ile.",
    },
    about: {
      heading: "Bride party nasıl planlanır?",
      body: "Bekarlığa veda geceleri artık çok daha kişisel ve özel. Tek tip bir program değil — gelinin kişiliğini yansıtan, yakın arkadaşlar için tasarlanmış, enerji dolu ya da samimi ve huzurlu bir gece isteyebilirsiniz. Biz her iki versiyona da hazırız.",
    },
    features: [
      { icon: "💕", title: "Geline Özel Müzik", desc: "Gelinin favori şarkıları ve anı dolu parçalar programın merkezinde" },
      { icon: "✨", title: "Atmosfer Tasarımı", desc: "Müziği mekana ve grubun enerjisine göre kalibre ediyoruz" },
      { icon: "🎤", title: "Özel Sürprizler", desc: "Şarkı ithafları, özel anonslar ve sürpriz anların koordinasyonu" },
      { icon: "🌙", title: "Gece Boyunca Enerji Yönetimi", desc: "Akşam başlangıçtan gece geç saatlere kadar akıllı tempo yönetimi" },
    ],
    faq: [
      { q: "Sadece müzik mi sağlıyorsunuz, yoksa tüm organizasyon mu?", a: "Müzik ve deneyim odağımız. Mekan, dekorasyon gibi konularda partner ağımızdan destek sunabiliriz." },
      { q: "Küçük gruplar için de hizmet veriyor musunuz?", a: "Evet. 10-15 kişilik özel akşam yemekleri ve küçük gece buluşmaları için de çalışıyoruz." },
    ],
  },
  {
    slug: "morning-party",
    emoji: "☕",
    title: "Morning Party / Caffeine Club",
    metaTitle: "Morning Party & Brunch Party DJ — NOQT",
    metaDescription:
      "Morning party, brunch party ve sabah etkinlikleri için DJ ve müzik organizasyonu. Afrobeat, organic house, latin vibes ile güne enerjik başlayın.",
    keywords: [
      "morning party organizasyonu",
      "brunch party dj",
      "sabah partisi kapadokya",
      "brunch etkinliği",
      "morning rave",
      "caffeine club",
      "day party dj",
      "brunch müziği",
      "organic house dj kapadokya",
    ],
    hero: {
      eyebrow: "Morning Party / Caffeine Club",
      headline: "Sabah başlar. Enerji hiç bitmez.",
      sub: "Gün ışığında dans, kahve ve iyi müzik — morning party'nin kendine has atmosferini doğru setlerle kuruyoruz.",
    },
    about: {
      heading: "Morning party neden farklı bir yaklaşım gerektirir?",
      body: "Sabah etkinlikleri gece kulübü değil. Işık var, insanlar uyanık ve bilinçli, müzik daha çok ön plana çıkıyor. Bu yüzden set seçimi kritik: Afrobeat, Organic House, Latin ve Nu-Disco karışımı; ne çok ağır ne çok hafif. Biz bu dengeyi kurmayı seviyoruz.",
    },
    features: [
      { icon: "☀️", title: "Gündüz Müzik Kurgusu", desc: "Afrobeat, Organic House, Latin, Nu-Disco karışımı — gün boyu enerji" },
      { icon: "☕", title: "Brunch Atmosferi", desc: "Yemek, sohbet ve müziğin birlikte aktığı dengeli ses seviyesi" },
      { icon: "🎵", title: "Progressive Enerji", desc: "Sakin başlangıçtan peak saatine doğru akıllı enerji yönetimi" },
      { icon: "📍", title: "Outdoor & Indoor", desc: "Bahçe, rooftop, çadır veya kapalı mekan kurulumlarına uyum" },
    ],
    faq: [
      { q: "Kaçta başlıyor, kaçta bitiyor?", a: "Tipik morning party 10:00-15:00 veya 11:00-16:00 arası çalışıyor. Süreye göre fiyatlandırma yapıyoruz." },
      { q: "Outdoor etkinlikler için ses sistemi sağlıyor musunuz?", a: "Evet. Açık alan kurulumlarına uygun sistemlerle çalışabiliyoruz." },
      { q: "Brunch menüsü için öneri verebilir misiniz?", a: "F&B konusunda partner restoranlarımız ve catering firmalarımız var, koordineli paket önerebiliriz." },
    ],
  },
  {
    slug: "kurumsal-etkinlik",
    emoji: "🏢",
    title: "Kurumsal Etkinlik",
    metaTitle: "Kurumsal Etkinlik DJ & Müzik Organizasyonu — NOQT",
    metaDescription:
      "Kurumsal etkinlik, şirket partisi ve iş yemeği müzik organizasyonu. Profesyonel DJ, ambiyans müzik, şirket gecesi planlaması. Kayseri ve Nevşehir bölgesinde hizmet.",
    keywords: [
      "kurumsal etkinlik organizasyonu",
      "şirket partisi dj",
      "kurumsal dj",
      "iş yemeği müziği",
      "şirket gecesi organizasyonu",
      "kurumsal etkinlik dj kayseri",
      "yılbaşı gecesi kurumsal",
      "şirket lansmanı müzik",
      "ofis partisi organizasyonu",
    ],
    hero: {
      eyebrow: "Kurumsal Etkinlik",
      headline: "Kurumsal olmak sıkıcı olmak zorunda değil.",
      sub: "Şirket gecelerinizi, lansmanlarınızı ve iş yemeklerinizi doğru müzikle bambaşka bir deneyime dönüştürüyoruz.",
    },
    about: {
      heading: "Kurumsal etkinliklerde müzik neden kritik?",
      body: "Kurumsal etkinliklerde müzik çoğu zaman bir detay gibi görülür. Oysa doğru ambiyans müziği networking'i kolaylaştırır, şirket kültürünü yansıtır, çalışanların kendini özel hissettirmesini sağlar. Kokteyl saati, yemek, ödül töreni ve kutlama bölümlerinin hepsi farklı müzik dili gerektirir.",
    },
    features: [
      { icon: "🎵", title: "Ambiyans & Background Müzik", desc: "Networking ve yemek anları için sohbete uyum sağlayan ses seviyesi ve seçim" },
      { icon: "🏆", title: "Tören & Ödül Anları", desc: "Ödül töreni, sahne geçişleri ve özel anonsların müzik koordinasyonu" },
      { icon: "🎊", title: "Kutlama Bölümü", desc: "Resmi kısımdan sonra partiye geçişin akıllı kurgusu" },
      { icon: "🔊", title: "Teknik Altyapı", desc: "Konferans sistemi ile entegre veya bağımsız ses kurulumu" },
    ],
    faq: [
      { q: "Sunucu veya MC desteği sağlıyor musunuz?", a: "Evet, talep halinde deneyimli MC ile çalışabiliyor veya sadece müzik yönetimi yapabiliyoruz." },
      { q: "Marka kimliğine uygun müzik seçimi yapıyor musunuz?", a: "Kesinlikle. Markanızın enerjisini ve hedef kitlenizi anlayarak müzik dilini belirliyoruz." },
      { q: "Uluslararası şirket etkinlikleri için de hizmet veriyor musunuz?", a: "Evet. İngilizce koordinasyon ve uluslararası repertuarla çalışabiliyoruz." },
    ],
  },
  {
    slug: "after-party",
    emoji: "🌙",
    title: "After Party",
    metaTitle: "After Party DJ & Organizasyonu — NOQT",
    metaDescription:
      "After party organizasyonu ve DJ hizmeti. Düğün sonrası, etkinlik sonrası after party müziği. Deep house, techno, electronic — gece geç saatlere kadar.",
    keywords: [
      "after party dj",
      "after party organizasyonu",
      "düğün after party",
      "after party kayseri",
      "gece kulübü alternatifi",
      "özel after party",
      "after party müziği",
      "deep house dj kayseri",
      "electronic music party",
    ],
    hero: {
      eyebrow: "After Party",
      headline: "Asıl parti şimdi başlıyor.",
      sub: "Gece geç saatlerde, sadece kalmaya devam etmek isteyenler için — enerjinin doruk noktasında bir after party.",
    },
    about: {
      heading: "After party neden ayrı planlanmalı?",
      body: "After party, gecenin geri kalanından farklı bir ruh hali ister. Kalabalık azalmış, kalan misafirler daha özgür ve enerjik. Bu an için müzik dili değişmeli — daha derin, daha sürükleyici, daha cesur. Biz bu geçişi yönetmeyi ve geceyi doğru noktalarda zirveye taşımayı seviyoruz.",
    },
    features: [
      { icon: "🎵", title: "Deep & Sürükleyici Setler", desc: "Deep House, Tech House, Minimal Techno ve Electronic karışımı" },
      { icon: "🌙", title: "Gece Yarısı Enerji Yönetimi", desc: "Peak saati kurgusu ve enerjinin geceye yayılması" },
      { icon: "🔊", title: "Yüksek Kalite Ses", desc: "Gece kulübü kalitesinde ses sistemi kurulumu" },
      { icon: "✨", title: "Atmosfer & Işık", desc: "Işık koordinasyonu ile müziğin görsel tamamlayıcısı" },
    ],
    faq: [
      { q: "After party, düğün veya başka etkinlikle birlikte paket alınabilir mi?", a: "Evet, çoğunlukla ana etkinlikle birlikte planlanıyor. Paket fiyatlandırması için görüşme yapıyoruz." },
      { q: "Sabaha kadar devam edebilir mi?", a: "Mekan izinleri ve yerel düzenlemelere bağlı olarak sabah erken saatlere kadar devam edebiliyoruz." },
      { q: "After party için minimum süre var mı?", a: "Genellikle en az 3 saat. Kısa süreli after party'ler için de görüşebiliriz." },
    ],
  },
  {
    slug: "acilis-lansman",
    emoji: "🎉",
    title: "Açılış & Lansman",
    metaTitle: "Açılış & Lansman Organizasyonu DJ ve Müzik — NOQT",
    metaDescription:
      "Mağaza açılışı, ürün lansmanı ve marka etkinliği için profesyonel DJ, ses sistemi ve atmosfer yönetimi. Kayseri, Nevşehir ve Kapadokya bölgesinde kurumsal etkinlik organizasyonu.",
    keywords: [
      "açılış organizasyonu",
      "lansman organizasyonu",
      "açılış dj kayseri",
      "mağaza açılışı müzik",
      "ürün lansmanı etkinlik",
      "marka etkinliği dj",
      "kurumsal açılış organizasyonu",
      "açılış töreni ses sistemi",
      "lansman etkinliği kayseri",
    ],
    hero: {
      eyebrow: "Açılış & Lansman",
      headline: "İlk izlenim bir kez yaratılır.",
      sub: "Mağaza açılışı, ürün lansmanı veya marka etkinliği — doğru atmosfer, doğru müzik ve kusursuz teknik koordinasyonla.",
    },
    about: {
      heading: "Açılış ve lansmanda müzik neden kritik?",
      body: "Bir açılış ya da lansman, markanızın sahne aldığı andır. Misafirler mekana adım attığı saniyede hissettikleri şey markanız hakkında bir izlenim bırakır. Doğru müzik ve akıcı bir program, davetlilerin daha uzun kalmasını, markayla daha güçlü bir bağ kurmasını sağlar. Biz açılışın enerjisini kurgular, konuşma-müzik geçişlerini ve basın anlarını kusursuz yönetiriz.",
    },
    features: [
      { icon: "🎧", title: "Ambiyans & DJ Performansı", desc: "Karşılamadan zirveye markanızın tonuna uygun müzik akışı" },
      { icon: "🎤", title: "MC & Program Yönetimi", desc: "Konuşma, kurdele kesimi ve basın anlarının zamanlaması tek elden" },
      { icon: "🔊", title: "Profesyonel Ses & Sahne", desc: "Mekan keşfi, ses sistemi kurulumu ve teknik koordinasyon" },
      { icon: "🏢", title: "Kurumsal Süreç", desc: "Fatura, sözleşme ve kurumsal beklentilere uygun çalışma" },
    ],
    faq: [
      { q: "Açılış programını sizinle birlikte kurgulayabilir miyiz?", a: "Kesinlikle. Konuşma, kurdele kesimi, ikram ve müzik geçişlerini içeren detaylı bir akış planını birlikte hazırlıyoruz." },
      { q: "Fatura ve kurumsal sözleşme sağlıyor musunuz?", a: "Evet. Kurumsal etkinliklerde hizmet faturalı ve sözleşmeli olarak yürütülür." },
      { q: "Gündüz açılışları için de hizmet veriyor musunuz?", a: "Evet, gündüz ve akşam açılışları için uygun ambiyans müziği ve teknik kurulumu sağlıyoruz." },
    ],
  },
  {
    slug: "ozel-parti",
    emoji: "🥳",
    title: "Özel Parti",
    metaTitle: "Özel Parti Organizasyonu ve DJ — NOQT",
    metaDescription:
      "Doğum günü, yıldönümü, ev partisi ve özel kutlamalar için DJ ve müzik organizasyonu. Kayseri, Nevşehir ve Kapadokya bölgesinde bütçenize göre özel parti çözümleri.",
    keywords: [
      "özel parti organizasyonu",
      "özel parti dj",
      "ev partisi dj kayseri",
      "yıldönümü partisi organizasyonu",
      "kutlama organizasyonu",
      "özel kutlama dj",
      "parti müziği kayseri",
      "bahçe partisi dj",
      "özel davet organizasyonu",
    ],
    hero: {
      eyebrow: "Özel Parti",
      headline: "Sebep sizde, atmosfer bizde.",
      sub: "Doğum günü, yıldönümü, ev partisi ya da sadece iyi bir gece — hayal ettiğiniz kutlamayı birlikte tasarlayalım.",
    },
    about: {
      heading: "Küçük ama unutulmaz bir gece",
      body: "Özel partiler büyük olmak zorunda değil — ama en az düğün kadar özenle planlanmayı hak ediyor. Yakın çevrenizle, samimi bir ortamda, tamamen size özel bir müzik seçkisiyle. Küçük konuk listesi kişiselleştirme için büyük bir fırsat: her misafirin enerjisini okuyup geceyi anlık kurgulayan bir DJ deneyimi sunuyoruz.",
    },
    features: [
      { icon: "🎵", title: "Size Özel Seçki", desc: "Favori şarkılarınız ve grubunuzun enerjisine göre kurgulanan set" },
      { icon: "🎉", title: "Sürpriz Koordinasyonu", desc: "Pasta anı, özel anonslar ve sürpriz girişlerin müzik planlaması" },
      { icon: "🔊", title: "Kompakt Ses Sistemi", desc: "Ev, bahçe ve küçük mekanlara uygun esnek ses kurulumu" },
      { icon: "💫", title: "Esnek Bütçe", desc: "Mekan, süre ve grup büyüklüğüne göre şekillenen çözümler" },
    ],
    faq: [
      { q: "Ev ve bahçe partileri için de hizmet veriyor musunuz?", a: "Evet. Küçük ve orta ölçekli ortamlara uygun kompakt ses sistemleriyle ev ve bahçe partilerinde çalışıyoruz." },
      { q: "Minimum kaç kişilik etkinliğe geliyorsunuz?", a: "25 kişilik samimi kutlamalardan büyük partilere kadar hizmet veriyoruz." },
      { q: "Sürpriz anları için müzik koordinasyonu yapıyor musunuz?", a: "Evet. Pasta anı, sürpriz giriş ve özel anonsları önceden planlayıp doğru anda devreye alıyoruz." },
    ],
  },
];

export function getEventPage(slug: string): EventPage | undefined {
  return EVENT_PAGES.find((p) => p.slug === slug);
}
