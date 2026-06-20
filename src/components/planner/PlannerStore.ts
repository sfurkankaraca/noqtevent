"use client";

export type ConceptCategory =
  | "cocktail"      // Kokteyl & Karşılama
  | "celebration"   // Ana Kutlama (Modern)
  | "traditional"   // Geleneksel Dokunuşlar
  | "after-party";  // After Party

export type MusicConcept = {
  id: string;
  name: string;
  emoji: string;
  category: ConceptCategory;
  description: string;
  atmosphere: string[];
  musicalDirection: string[];
  tags: string[];
  energyLevel: number;
  danceability: number;
  cocktailFit: number;
  dinnerFit: number;
  weddingFit: number;
  corporateFit: number;
  afterPartyFit: number;
  idealEventTypes: string[];
  idealAudience: string[];
  spotifyPlaylistId: string;
  suggestedArtistIds: string[];
  references: string[];
  color: string;
  dark: boolean;
  signature?: boolean; // NOQT imza konsepti
};

export type EventSections = {
  karsilama: {
    startTime: string;
    conceptIds: string[];
  };
  anaKutlama: {
    style: "modern" | "traditional" | "";
    startTime: string;
    conceptIds: string[];
  };
  afterParti: {
    musicPref: "local" | "international" | "mixed" | "";
    conceptIds: string[];
  };
};

export type PlannerData = {
  eventType: string;
  guestType: string;
  hasChildren: boolean;
  eventSections: EventSections;
  momentSelections: Record<string, import("./momentData").MomentSelection>;
  customMoments: import("./momentData").CustomMoment[];
  hasVenue: boolean | null;
  venueType: string;
  services: string[];
  name: string;
  surname: string;
  email: string;
  phone: string;
  eventDate: string;
};

export const initialData: PlannerData = {
  eventType: "",
  guestType: "",
  hasChildren: false,
  eventSections: {
    karsilama: { startTime: "", conceptIds: [] },
    anaKutlama: { style: "", startTime: "", conceptIds: [] },
    afterParti: { musicPref: "", conceptIds: [] },
  },
  momentSelections: {},
  customMoments: [],
  hasVenue: null,
  venueType: "",
  services: [],
  name: "",
  surname: "",
  email: "",
  phone: "",
  eventDate: "",
};

export const EVENT_TYPES = [
  { id: "wedding", label: "Düğün", emoji: "💍" },
  { id: "kina-gecesi", label: "Kına Gecesi", emoji: "🔥" },
  { id: "corporate", label: "Kurumsal Etkinlik", emoji: "🏢" },
  { id: "opening", label: "Açılış Etkinliği", emoji: "🎊" },
  { id: "brand-launch", label: "Marka Lansmanı", emoji: "🚀" },
  { id: "private-party", label: "Özel Parti", emoji: "🎉" },
  { id: "cocktail", label: "Mezuniyet", emoji: "🎓" },
  { id: "birthday", label: "Doğum Günü", emoji: "🎂" },
  { id: "bride", label: "Bride / Bekarlığa Veda", emoji: "👰" },
  { id: "morning-party", label: "Morning Party / Caffeine Club", emoji: "☕" },
  { id: "after-party", label: "After Party", emoji: "🌙" },
];

export const FEELINGS = [
  { id: "celebration", label: "Kutlama" },
  { id: "romance", label: "Romantizm" },
  { id: "connection", label: "Bağlantı" },
  { id: "fun", label: "Eğlence" },
  { id: "energy", label: "Enerji" },
  { id: "elegance", label: "Zarafet" },
  { id: "community", label: "Topluluk" },
  { id: "networking", label: "Network" },
  { id: "creativity", label: "Yaratıcılık" },
  { id: "storytelling", label: "Hikaye Anlatımı" },
];

export const GUEST_TYPES = [
  { id: "family", label: "Aile odaklı" },
  { id: "friends", label: "Arkadaş odaklı" },
  { id: "mixed", label: "Karma kitlesi" },
  { id: "corporate", label: "Kurumsal profesyoneller" },
  { id: "creative", label: "Yaratıcı topluluk" },
  { id: "young", label: "Genç kalabalık" },
  { id: "multigenerational", label: "Çok nesilli" },
];

// ─── MUSIC CONCEPTS ────────────────────────────────────────────────────────────

export const MUSIC_CONCEPTS: MusicConcept[] = [

  // ── KOKTEYL & KARŞILAMA ──────────────────────────────────────────────────────

  {
    id: "sohbet-arasi",
    name: "Sohbet Arası",
    emoji: "☕",
    category: "cocktail",
    description:
      "Müziğin değil sohbetin ön planda olduğu rahat ve sosyal atmosfer. Misafirlerin birbirleriyle tanışmasına, rahatlamasına ve etkinliğe yavaşça adapte olmasına yardımcı olur.",
    atmosphere: ["Sosyal", "Samimi", "Rahat", "Zamansız"],
    musicalDirection: ["Lounge", "Chill", "Downtempo", "Nu Jazz"],
    tags: ["#lounge", "#chill", "#social", "#cocktail"],
    energyLevel: 3,
    danceability: 2,
    cocktailFit: 10,
    dinnerFit: 9,
    weddingFit: 8,
    corporateFit: 10,
    afterPartyFit: 1,
    idealEventTypes: ["wedding", "corporate", "cocktail", "opening"],
    idealAudience: ["Tüm yaşlar", "Profesyoneller", "Aile grupları"],
    spotifyPlaylistId: "37i9dQZF1DX4wta20PHgwo",
    suggestedArtistIds: ["zeynep-arslan"],
    references: [],
    color: "bg-[oklch(0.95_0.012_80)]",
    dark: false,
  },

  {
    id: "sehirli-zarafet",
    name: "Şehirli Zarafet",
    emoji: "🥂",
    category: "cocktail",
    description:
      "Minimal, rafine ve modern. Müzik ortamı doldurur ama asla dikkat dağıtmaz. Şehrin en şık kokteyl barlarını andıran atmosfer.",
    atmosphere: ["Şık", "Modern", "Zarif", "Şehirli"],
    musicalDirection: ["Deep House", "Soulful House", "Elegant House"],
    tags: ["#deephouse", "#modern", "#elegant"],
    energyLevel: 4,
    danceability: 3,
    cocktailFit: 10,
    dinnerFit: 8,
    weddingFit: 9,
    corporateFit: 9,
    afterPartyFit: 2,
    idealEventTypes: ["wedding", "corporate", "brand-launch", "cocktail"],
    idealAudience: ["25-45 yaş", "Profesyoneller", "Modern çiftler"],
    spotifyPlaylistId: "37i9dQZF1DX2TRYkJECvfC",
    suggestedArtistIds: ["mert-yilmaz"],
    references: [],
    color: "bg-[oklch(0.93_0.006_240)]",
    dark: false,
  },

  {
    id: "gun-batimi",
    name: "Gün Batımı",
    emoji: "🌅",
    category: "cocktail",
    description:
      "NOQT'un imza konsepti. Anadolu esintileri, organik ritimler ve modern elektronik müziğin birleştiği sıcak ve karakterli atmosfer. Atmosfer yaratır, dikkat çekmez.",
    atmosphere: ["Sıcak", "Duygusal", "Modern", "Estetik"],
    musicalDirection: ["Organic House", "Afro House", "Ethnic House"],
    tags: ["#sunset", "#outdoor", "#anatolian", "#organic"],
    energyLevel: 5,
    danceability: 4,
    cocktailFit: 10,
    dinnerFit: 8,
    weddingFit: 10,
    corporateFit: 8,
    afterPartyFit: 3,
    idealEventTypes: ["wedding", "sunset", "private-party", "brand-launch"],
    idealAudience: ["25-45 yaş", "Yaratıcı profesyoneller", "Modern çiftler", "Seyahat severler"],
    spotifyPlaylistId: "37i9dQZF1DX2TRYkJECvfC",
    suggestedArtistIds: ["mert-yilmaz", "bora-sen"],
    references: ["Keinemusik", "Black Coffee", "Monolink", "Oceanvs Orientalis"],
    color: "bg-[oklch(0.88_0.055_65)]",
    dark: false,
    signature: true,
  },

  {
    id: "toprak-ritim",
    name: "Toprak ve Ritim",
    emoji: "🌿",
    category: "cocktail",
    description:
      "Doğal perküsyonlar ve groove odaklı sıcak bir akış. Daha ritmik ama hala sohbet dostu. Toprağı, ormanı ve ritmi aynı anda hissettiren organik enerji.",
    atmosphere: ["Organik", "Doğal", "Akışkan", "Modern"],
    musicalDirection: ["Organic House", "Afro House"],
    tags: ["#organic", "#groove", "#afro"],
    energyLevel: 6,
    danceability: 5,
    cocktailFit: 8,
    dinnerFit: 7,
    weddingFit: 8,
    corporateFit: 7,
    afterPartyFit: 4,
    idealEventTypes: ["wedding", "sunset", "private-party", "opening"],
    idealAudience: ["25-40 yaş", "Doğa severler", "Yaratıcı topluluk"],
    spotifyPlaylistId: "37i9dQZF1DX2TRYkJECvfC",
    suggestedArtistIds: ["bora-sen", "mert-yilmaz"],
    references: [],
    color: "bg-[oklch(0.88_0.035_120)]",
    dark: false,
  },

  {
    id: "anadolu-esintileri",
    name: "Anadolu Esintileri",
    emoji: "🧿",
    category: "cocktail",
    description:
      "Anadolu, Akdeniz ve Orta Doğu etkilerinin modern elektronik müzikle buluştuğu kültürel ama çağdaş atmosfer. Köklü ama asla ağır değil.",
    atmosphere: ["Kültürel", "Karakterli", "Modern", "Özgün"],
    musicalDirection: ["Anatolian House", "Ethnic House", "World Music"],
    tags: ["#anatolian", "#ethnic", "#worldmusic"],
    energyLevel: 5,
    danceability: 5,
    cocktailFit: 9,
    dinnerFit: 8,
    weddingFit: 9,
    corporateFit: 7,
    afterPartyFit: 3,
    idealEventTypes: ["wedding", "cocktail", "opening", "brand-launch"],
    idealAudience: ["Tüm yaşlar", "Kültür meraklıları", "Karma kitlesi"],
    spotifyPlaylistId: "37i9dQZF1DX2TRYkJECvfC",
    suggestedArtistIds: ["mert-yilmaz"],
    references: [],
    color: "bg-[oklch(0.87_0.045_50)]",
    dark: false,
  },

  {
    id: "caz-kulubu",
    name: "Caz Kulübü",
    emoji: "🎷",
    category: "cocktail",
    description:
      "Caz, soul ve zamansız klasiklerle karakterli ve rafine bir karşılama. Zamanın durduğu, bir hikayenin içine çekildiğin atmosfer.",
    atmosphere: ["Zamansız", "Klasik", "Zarif", "Derin"],
    musicalDirection: ["Jazz", "Soul", "Bossa Nova", "Neo Soul"],
    tags: ["#jazz", "#soul", "#classic"],
    energyLevel: 3,
    danceability: 2,
    cocktailFit: 10,
    dinnerFit: 9,
    weddingFit: 7,
    corporateFit: 9,
    afterPartyFit: 1,
    idealEventTypes: ["wedding", "corporate", "cocktail", "opening"],
    idealAudience: ["35-60 yaş", "Müzik tutkunları", "Kurumsal gruplar"],
    spotifyPlaylistId: "37i9dQZF1DXcBWIGoYBM5M",
    suggestedArtistIds: ["zeynep-arslan"],
    references: [],
    color: "bg-[oklch(0.91_0.015_70)]",
    dark: false,
  },

  // ── MODERN KUTLAMA ───────────────────────────────────────────────────────────

  {
    id: "karisik-kaset",
    name: "Karışık Kaset",
    emoji: "🎵",
    category: "celebration",
    description:
      "Türkçe pop, global hitler, nostaljik favoriler ve dans pisti klasikleri. En güvenli ve en kapsayıcı seçenek. Karma kitleler için birebir.",
    atmosphere: ["Evrensel", "Eğlenceli", "Kapsayıcı", "Sosyal"],
    musicalDirection: ["Open Format", "Mixed", "Pop"],
    tags: ["#openformat", "#mixedmusic", "#party"],
    energyLevel: 8,
    danceability: 8,
    cocktailFit: 6,
    dinnerFit: 6,
    weddingFit: 10,
    corporateFit: 9,
    afterPartyFit: 7,
    idealEventTypes: ["wedding", "corporate", "opening", "private-party"],
    idealAudience: ["Tüm yaşlar", "Karma kitlesi", "Aile grupları"],
    spotifyPlaylistId: "37i9dQZF1DXcBWIGoYBM5M",
    suggestedArtistIds: ["elif-kaya"],
    references: [],
    color: "bg-[oklch(0.93_0.012_70)]",
    dark: false,
  },

  {
    id: "disko-gecesi",
    name: "Disko Gecesi",
    emoji: "🪩",
    category: "celebration",
    description:
      "Disco, funk ve nu-disco'nun zamansız enerjisi. Dans etmeye başlamak için cesaret gerektirmez. Herkes piste çeker.",
    atmosphere: ["Eğlenceli", "Şık", "Dans Odaklı", "Nostaljik"],
    musicalDirection: ["Disco", "Funk", "Nu-Disco"],
    tags: ["#disco", "#funk", "#dancefloor"],
    energyLevel: 8,
    danceability: 9,
    cocktailFit: 5,
    dinnerFit: 3,
    weddingFit: 9,
    corporateFit: 6,
    afterPartyFit: 8,
    idealEventTypes: ["wedding", "private-party", "after-party"],
    idealAudience: ["25-50 yaş", "Dans severler", "Modern çiftler"],
    spotifyPlaylistId: "37i9dQZF1DX3rxVfibe1L0",
    suggestedArtistIds: ["elif-kaya"],
    references: ["Purple Disco Machine", "Daft Punk", "Chic"],
    color: "bg-[oklch(0.90_0.025_320)]",
    dark: false,
  },

  {
    id: "afro-ritimler",
    name: "Afro Ritimler",
    emoji: "🌍",
    category: "celebration",
    description:
      "Perküsyon odaklı, groove güçlü, modern ve enerjik. Afrika ritimlerinin elektronik müzikle buluştuğu evrensel dans dili.",
    atmosphere: ["Enerjik", "Özgür", "Dans Odaklı", "Modern"],
    musicalDirection: ["Afro House", "Afrobeat"],
    tags: ["#afrohouse", "#groove"],
    energyLevel: 8,
    danceability: 8,
    cocktailFit: 4,
    dinnerFit: 3,
    weddingFit: 8,
    corporateFit: 5,
    afterPartyFit: 7,
    idealEventTypes: ["wedding", "private-party", "after-party", "brand-launch"],
    idealAudience: ["22-40 yaş", "Dans severler", "Yaratıcı topluluk"],
    spotifyPlaylistId: "37i9dQZF1DX3rxVfibe1L0",
    suggestedArtistIds: ["bora-sen", "mert-yilmaz"],
    references: ["Black Coffee", "Shimza", "Caiiro"],
    color: "bg-[oklch(0.86_0.04_100)]",
    dark: false,
  },

  {
    id: "kiz-kiza",
    name: "Kız Kıza",
    emoji: "👑",
    category: "celebration",
    description:
      "Pop ikonları, guilty pleasures ve yüksek enerjili eşlik edilen şarkılar. Kutlama, özgürlük ve kolektif neşe için tasarlandı.",
    atmosphere: ["Güçlendirici", "Oyuncu", "Yüksek Enerji", "Kutlama"],
    musicalDirection: ["Pop", "Dance Pop"],
    tags: ["#girlsnight", "#pop", "#bridesquad"],
    energyLevel: 10,
    danceability: 10,
    cocktailFit: 6,
    dinnerFit: 2,
    weddingFit: 8,
    corporateFit: 3,
    afterPartyFit: 10,
    idealEventTypes: ["wedding", "private-party", "after-party"],
    idealAudience: ["22-40 yaş", "Kadın ağırlıklı gruplar", "Bekarlığa veda partileri"],
    spotifyPlaylistId: "37i9dQZF1DX1lVhptIYRda",
    suggestedArtistIds: ["elif-kaya", "ada-kurt"],
    references: ["Rihanna", "Beyoncé", "Dua Lipa", "Lady Gaga", "Hande Yener", "Hadise", "Nil Karaibrahimgil"],
    color: "bg-[oklch(0.90_0.04_350)]",
    dark: false,
  },

  {
    id: "kulup-modu",
    name: "Kulüp Modu",
    emoji: "⚡",
    category: "celebration",
    description:
      "Modern House ve Tech House seçkileri. Dans pistini sürekli canlı tutar. Gece ilerledikçe yükselen enerji.",
    atmosphere: ["Modern", "Enerjik", "Gece Hayatı", "Yoğun"],
    musicalDirection: ["House", "Tech House"],
    tags: ["#house", "#techhouse"],
    energyLevel: 9,
    danceability: 9,
    cocktailFit: 4,
    dinnerFit: 1,
    weddingFit: 6,
    corporateFit: 5,
    afterPartyFit: 10,
    idealEventTypes: ["after-party", "brand-launch", "opening", "private-party"],
    idealAudience: ["22-35 yaş", "Elektronik müzik tutkunları"],
    spotifyPlaylistId: "37i9dQZF1DX6J5NfMJS675",
    suggestedArtistIds: ["can-demir", "ada-kurt"],
    references: ["Fisher", "Chris Lake", "John Summit"],
    color: "bg-[oklch(0.20_0.025_260)]",
    dark: true,
  },

  {
    id: "melodik-gece",
    name: "Melodik Gece",
    emoji: "🌌",
    category: "celebration",
    description:
      "Duygusal ama dans ettiren elektronik müzik. Gece boyunca sizi hem hissettirir hem hareket ettirir.",
    atmosphere: ["Duygusal", "Akışkan", "Modern", "Derinlikli"],
    musicalDirection: ["Melodic House", "Melodic Techno"],
    tags: ["#melodic", "#house"],
    energyLevel: 7,
    danceability: 7,
    cocktailFit: 5,
    dinnerFit: 4,
    weddingFit: 7,
    corporateFit: 5,
    afterPartyFit: 8,
    idealEventTypes: ["wedding", "private-party", "after-party", "brand-launch"],
    idealAudience: ["25-40 yaş", "Müzik tutkunları"],
    spotifyPlaylistId: "37i9dQZF1DX6J5NfMJS675",
    suggestedArtistIds: ["can-demir", "ada-kurt"],
    references: ["Ben Böhmer", "Monolink", "Rüfüs Du Sol"],
    color: "bg-[oklch(0.22_0.04_280)]",
    dark: true,
  },

  {
    id: "gece-akisi",
    name: "Gece Akışı",
    emoji: "🚀",
    category: "celebration",
    description:
      "Yüksek enerjili Tech House deneyimi. Gece ilerledikçe yükselen kulüp enerjisi. Sabaha kadar devam eden ritim.",
    atmosphere: ["Yoğun", "Özgür", "Karanlık", "Güçlü"],
    musicalDirection: ["Tech House", "Minimal House"],
    tags: ["#techhouse", "#club"],
    energyLevel: 10,
    danceability: 10,
    cocktailFit: 2,
    dinnerFit: 1,
    weddingFit: 4,
    corporateFit: 3,
    afterPartyFit: 10,
    idealEventTypes: ["after-party", "brand-launch", "opening"],
    idealAudience: ["22-35 yaş", "Elektronik müzik tutkunları"],
    spotifyPlaylistId: "37i9dQZF1DX6J5NfMJS675",
    suggestedArtistIds: ["can-demir"],
    references: [],
    color: "bg-[oklch(0.12_0.008_45)]",
    dark: true,
  },

  {
    id: "kpop-party",
    name: "K-Pop Party",
    emoji: "🇰🇷",
    category: "celebration",
    description:
      "Renkli, enerjik ve genç. K-Pop'un ikonik koreografileri ve yüksek üretim değerli müzikleriyle dolu bir kutlama.",
    atmosphere: ["Renkli", "Enerjik", "Genç", "Eğlenceli"],
    musicalDirection: ["K-Pop", "Dance Pop"],
    tags: ["#kpop", "#youngcrowd"],
    energyLevel: 10,
    danceability: 10,
    cocktailFit: 4,
    dinnerFit: 2,
    weddingFit: 6,
    corporateFit: 4,
    afterPartyFit: 10,
    idealEventTypes: ["private-party", "after-party", "opening"],
    idealAudience: ["15-30 yaş", "K-Pop hayranları"],
    spotifyPlaylistId: "37i9dQZF1DX1lVhptIYRda",
    suggestedArtistIds: ["ada-kurt"],
    references: ["BTS", "BLACKPINK", "NewJeans", "TWICE"],
    color: "bg-[oklch(0.88_0.06_330)]",
    dark: false,
  },

  {
    id: "rock-klasikleri",
    name: "Rock Klasikleri",
    emoji: "🎸",
    category: "celebration",
    description:
      "Rock tarihinin en sevilen şarkıları. Herkesin bildiği, birlikte söylediği o zamansız parçalar.",
    atmosphere: ["Güçlü", "Özgür", "Enerjik", "Nostaljik"],
    musicalDirection: ["Classic Rock", "Alternative Rock"],
    tags: ["#rock", "#alternative"],
    energyLevel: 8,
    danceability: 7,
    cocktailFit: 4,
    dinnerFit: 5,
    weddingFit: 6,
    corporateFit: 5,
    afterPartyFit: 8,
    idealEventTypes: ["private-party", "after-party", "corporate"],
    idealAudience: ["30-55 yaş", "Rock müzik severler"],
    spotifyPlaylistId: "37i9dQZF1DX1rVvRgjX59F",
    suggestedArtistIds: [],
    references: ["Queen", "Bon Jovi", "The Killers", "Duman", "Mor ve Ötesi"],
    color: "bg-[oklch(0.22_0.012_60)]",
    dark: true,
  },

  // ── GELENEKSEL DOKUNUŞLAR ────────────────────────────────────────────────────

  {
    id: "halaylar",
    name: "Halaylar",
    emoji: "🔥",
    category: "traditional",
    description:
      "Türkiye'nin en güçlü kolektif kutlama formatı. Herkesin elinden tuttuğu, birlikte aktığı anlar. Bir düğünü gerçek bir kutlamaya dönüştürür.",
    atmosphere: ["Kolektif", "Neşeli", "Coşkulu", "Geleneksel"],
    musicalDirection: ["Halay", "Türk Halk Müziği"],
    tags: ["#halay"],
    energyLevel: 9,
    danceability: 9,
    cocktailFit: 2,
    dinnerFit: 2,
    weddingFit: 10,
    corporateFit: 3,
    afterPartyFit: 6,
    idealEventTypes: ["wedding"],
    idealAudience: ["Tüm yaşlar", "Aile grupları", "Karma kitlesi"],
    spotifyPlaylistId: "37i9dQZF1DX9oh43oAzkyx",
    suggestedArtistIds: [],
    references: [],
    color: "bg-[oklch(0.84_0.07_40)]",
    dark: false,
  },

  {
    id: "oyun-havalari",
    name: "Oyun Havaları",
    emoji: "🎉",
    category: "traditional",
    description:
      "Ankara ve Kırşehir ağırlıklı oyun havaları. Düğünün en enerjik anlarını yaratır.",
    atmosphere: ["Neşeli", "Hareketli", "Geleneksel", "Coşkulu"],
    musicalDirection: ["Ankara Oyun Havası", "Kırşehir"],
    tags: ["#ankara", "#kirsehir"],
    energyLevel: 9,
    danceability: 8,
    cocktailFit: 2,
    dinnerFit: 2,
    weddingFit: 10,
    corporateFit: 2,
    afterPartyFit: 5,
    idealEventTypes: ["wedding"],
    idealAudience: ["Tüm yaşlar", "Aile grupları"],
    spotifyPlaylistId: "37i9dQZF1DX9oh43oAzkyx",
    suggestedArtistIds: [],
    references: [],
    color: "bg-[oklch(0.86_0.055_60)]",
    dark: false,
  },

  {
    id: "roman-atesi",
    name: "Roman Ateşi",
    emoji: "🕺",
    category: "traditional",
    description:
      "Roman havaları ve yüksek enerji. Dans pistini ateşe verir. İsteseniz de istemeseniz de ayağa kalkarsınız.",
    atmosphere: ["Ateşli", "Spontan", "Enerjik", "Neşeli"],
    musicalDirection: ["Roman Havası"],
    tags: ["#roman"],
    energyLevel: 10,
    danceability: 10,
    cocktailFit: 1,
    dinnerFit: 1,
    weddingFit: 9,
    corporateFit: 2,
    afterPartyFit: 7,
    idealEventTypes: ["wedding", "private-party"],
    idealAudience: ["Tüm yaşlar", "Aile grupları"],
    spotifyPlaylistId: "37i9dQZF1DX9oh43oAzkyx",
    suggestedArtistIds: [],
    references: [],
    color: "bg-[oklch(0.82_0.08_35)]",
    dark: false,
  },

  {
    id: "oryantal",
    name: "Oryantal",
    emoji: "💃",
    category: "traditional",
    description:
      "Klasik düğün enerjisi. Oryantal ritimler ve dans kültürümüzün vazgeçilmez parçası.",
    atmosphere: ["Feminen", "Eğlenceli", "Geleneksel", "Canlı"],
    musicalDirection: ["Oriental", "Arabesk"],
    tags: ["#oryantal"],
    energyLevel: 8,
    danceability: 9,
    cocktailFit: 1,
    dinnerFit: 2,
    weddingFit: 9,
    corporateFit: 1,
    afterPartyFit: 6,
    idealEventTypes: ["wedding"],
    idealAudience: ["Tüm yaşlar", "Karma kitlesi"],
    spotifyPlaylistId: "37i9dQZF1DX9oh43oAzkyx",
    suggestedArtistIds: [],
    references: [],
    color: "bg-[oklch(0.88_0.04_80)]",
    dark: false,
  },

  {
    id: "arap-esintileri",
    name: "Arap Esintileri",
    emoji: "🌙",
    category: "traditional",
    description:
      "Arabic pop ve kutlama müziklerinin coşkulu havası. Orta Doğu'nun neşeli ve enerjik kutlama kültürü.",
    atmosphere: ["Coşkulu", "Egzotik", "Kutlama", "Neşeli"],
    musicalDirection: ["Arabic Pop", "Khaleeji"],
    tags: ["#arabic"],
    energyLevel: 8,
    danceability: 8,
    cocktailFit: 2,
    dinnerFit: 3,
    weddingFit: 8,
    corporateFit: 2,
    afterPartyFit: 6,
    idealEventTypes: ["wedding", "private-party"],
    idealAudience: ["Orta Doğu kültürüne yakın gruplar"],
    spotifyPlaylistId: "37i9dQZF1DX9oh43oAzkyx",
    suggestedArtistIds: [],
    references: [],
    color: "bg-[oklch(0.22_0.045_65)]",
    dark: true,
  },

  {
    id: "horon",
    name: "Horon",
    emoji: "🌊",
    category: "traditional",
    description:
      "Karadeniz'in özgün enerjisi. Hızlı ritimler, omuz omuza dans ve kolektif coşku.",
    atmosphere: ["Coşkulu", "Özgün", "Kolektif", "Hareketli"],
    musicalDirection: ["Horon", "Karadeniz Müziği"],
    tags: ["#horon"],
    energyLevel: 10,
    danceability: 9,
    cocktailFit: 1,
    dinnerFit: 1,
    weddingFit: 9,
    corporateFit: 2,
    afterPartyFit: 5,
    idealEventTypes: ["wedding"],
    idealAudience: ["Karadeniz kökenli gruplar", "Tüm yaşlar"],
    spotifyPlaylistId: "37i9dQZF1DX9oh43oAzkyx",
    suggestedArtistIds: [],
    references: [],
    color: "bg-[oklch(0.88_0.05_220)]",
    dark: false,
  },

  // ── AFTER PARTY ─────────────────────────────────────────────────────────────

  {
    id: "duezler-kaseti",
    name: "2000'ler Kaseti",
    emoji: "📼",
    category: "after-party",
    description:
      "Global 2000'ler hitleri. Anında tanınma ve maksimum katılım. Herkesin bildiği, herkesin söylediği o şarkılar.",
    atmosphere: ["Nostaljik", "Eğlenceli", "Tanıdık", "Enerjik"],
    musicalDirection: ["2000s Pop", "R&B", "Hip Hop"],
    tags: ["#2000s", "#throwback"],
    energyLevel: 10,
    danceability: 9,
    cocktailFit: 3,
    dinnerFit: 3,
    weddingFit: 7,
    corporateFit: 5,
    afterPartyFit: 10,
    idealEventTypes: ["after-party", "private-party", "corporate"],
    idealAudience: ["25-40 yaş", "Karma kitlesi"],
    spotifyPlaylistId: "37i9dQZF1DX4o1oenSJRJd",
    suggestedArtistIds: ["elif-kaya"],
    references: ["Nelly Furtado", "Rihanna", "Black Eyed Peas", "Pitbull"],
    color: "bg-[oklch(0.92_0.03_55)]",
    dark: false,
  },

  {
    id: "karisik-kaset-after",
    name: "Karışık Kaset",
    emoji: "🎵",
    category: "after-party",
    description:
      "Türkçe pop, global hitler ve sürpriz favorilerin after party versiyonu. Herkes için bir şeyler var.",
    atmosphere: ["Evrensel", "Eğlenceli", "Sürprizli"],
    musicalDirection: ["Open Format", "Mixed"],
    tags: ["#openformat"],
    energyLevel: 9,
    danceability: 9,
    cocktailFit: 3,
    dinnerFit: 2,
    weddingFit: 6,
    corporateFit: 4,
    afterPartyFit: 10,
    idealEventTypes: ["after-party"],
    idealAudience: ["Tüm yaşlar", "Karma kitlesi"],
    spotifyPlaylistId: "37i9dQZF1DXcBWIGoYBM5M",
    suggestedArtistIds: ["elif-kaya"],
    references: [],
    color: "bg-[oklch(0.93_0.01_70)]",
    dark: false,
  },

  {
    id: "duezler-turkce-pop",
    name: "2000'ler Türkçe Pop",
    emoji: "💿",
    category: "after-party",
    description:
      "2000'lerin unutulmaz Türkçe hitleri. Sing-along garantili, dans pisti dolu.",
    atmosphere: ["Nostalji", "Kutlama", "Tanıdık", "Eğlenceli"],
    musicalDirection: ["Türkçe Pop", "2000s"],
    tags: ["#turkcepop", "#2000ler"],
    energyLevel: 9,
    danceability: 9,
    cocktailFit: 3,
    dinnerFit: 3,
    weddingFit: 8,
    corporateFit: 5,
    afterPartyFit: 10,
    idealEventTypes: ["after-party", "wedding", "private-party"],
    idealAudience: ["25-45 yaş", "Türkçe pop severler"],
    spotifyPlaylistId: "37i9dQZF1DX9oh43oAzkyx",
    suggestedArtistIds: ["elif-kaya"],
    references: ["Hande Yener", "Demet Akalın", "Gülşen", "Yalın"],
    color: "bg-[oklch(0.90_0.02_140)]",
    dark: false,
  },

  {
    id: "doksanlar-turkce-pop",
    name: "90'lar Türkçe Pop",
    emoji: "🎤",
    category: "after-party",
    description:
      "Bir neslin ortak hafızası. Tarkan'dan Sertab'a. Herkesin birlikte söylediği o anlar.",
    atmosphere: ["Kolektif", "Nostaljik", "Sıcak", "Coşkulu"],
    musicalDirection: ["Türkçe Pop", "90s"],
    tags: ["#90lar", "#turkcepop"],
    energyLevel: 8,
    danceability: 8,
    cocktailFit: 4,
    dinnerFit: 4,
    weddingFit: 9,
    corporateFit: 5,
    afterPartyFit: 9,
    idealEventTypes: ["after-party", "wedding", "corporate"],
    idealAudience: ["30-55 yaş", "Aile grupları", "Karma kitlesi"],
    spotifyPlaylistId: "37i9dQZF1DX9oh43oAzkyx",
    suggestedArtistIds: ["elif-kaya"],
    references: ["Tarkan", "Levent Yüksel", "Mirkelam", "Sertab Erener"],
    color: "bg-[oklch(0.91_0.025_200)]",
    dark: false,
  },

  {
    id: "yazlik-hitler",
    name: "Yazlık Hitler",
    emoji: "🌴",
    category: "after-party",
    description:
      "Yaz akşamlarını hatırlatan iyi hissettiren şarkılar. Güneş batmış ama yaz hala devam ediyor.",
    atmosphere: ["Hafif", "Neşeli", "Özgür", "Romantik"],
    musicalDirection: ["Summer Pop", "Tropical"],
    tags: ["#summer", "#feelgood"],
    energyLevel: 7,
    danceability: 7,
    cocktailFit: 7,
    dinnerFit: 6,
    weddingFit: 7,
    corporateFit: 6,
    afterPartyFit: 8,
    idealEventTypes: ["after-party", "private-party", "sunset"],
    idealAudience: ["Tüm yaşlar"],
    spotifyPlaylistId: "37i9dQZF1DX1lVhptIYRda",
    suggestedArtistIds: [],
    references: [],
    color: "bg-[oklch(0.91_0.04_90)]",
    dark: false,
  },

  {
    id: "hiphop-rnb",
    name: "Hip Hop & R&B",
    emoji: "🎧",
    category: "after-party",
    description:
      "Sahnenin en büyük isimlerinden sofistike ve enerjik bir after party seçkisi.",
    atmosphere: ["Sofistike", "Enerjik", "Cool", "Modern"],
    musicalDirection: ["Hip Hop", "R&B"],
    tags: ["#hiphop", "#rnb"],
    energyLevel: 8,
    danceability: 8,
    cocktailFit: 4,
    dinnerFit: 3,
    weddingFit: 5,
    corporateFit: 4,
    afterPartyFit: 10,
    idealEventTypes: ["after-party", "private-party", "brand-launch"],
    idealAudience: ["20-35 yaş", "Genç profesyoneller"],
    spotifyPlaylistId: "37i9dQZF1DX1lVhptIYRda",
    suggestedArtistIds: [],
    references: ["Drake", "The Weeknd", "Kendrick Lamar"],
    color: "bg-[oklch(0.18_0.01_260)]",
    dark: true,
  },

  {
    id: "gece-kulubu",
    name: "Gece Kulübü",
    emoji: "🌃",
    category: "after-party",
    description:
      "Kulüp enerjisiyle devam eden after party. Sabaha kadar süren dans ve ritim.",
    atmosphere: ["Karanlık", "Enerjik", "Yoğun", "Özgür"],
    musicalDirection: ["House", "Tech House", "Club"],
    tags: ["#club", "#afterparty"],
    energyLevel: 10,
    danceability: 10,
    cocktailFit: 2,
    dinnerFit: 1,
    weddingFit: 3,
    corporateFit: 2,
    afterPartyFit: 10,
    idealEventTypes: ["after-party"],
    idealAudience: ["22-35 yaş"],
    spotifyPlaylistId: "37i9dQZF1DX6J5NfMJS675",
    suggestedArtistIds: ["can-demir", "ada-kurt"],
    references: [],
    color: "bg-[oklch(0.14_0.01_260)]",
    dark: true,
  },

  {
    id: "disko-sonrasi",
    name: "Disko Sonrası",
    emoji: "🪩",
    category: "after-party",
    description:
      "Disko enerjisinin geceye uzanan versiyonu. Sahadan ayrılmak istemeyenler için.",
    atmosphere: ["Dans Odaklı", "Enerjik", "Nostaljik", "Eğlenceli"],
    musicalDirection: ["Disco", "Nu-Disco", "Funk"],
    tags: ["#disco", "#afterhours"],
    energyLevel: 9,
    danceability: 10,
    cocktailFit: 2,
    dinnerFit: 1,
    weddingFit: 5,
    corporateFit: 3,
    afterPartyFit: 10,
    idealEventTypes: ["after-party"],
    idealAudience: ["25-45 yaş", "Dans severler"],
    spotifyPlaylistId: "37i9dQZF1DX3rxVfibe1L0",
    suggestedArtistIds: ["elif-kaya"],
    references: [],
    color: "bg-[oklch(0.88_0.03_310)]",
    dark: false,
  },

  {
    id: "dunya-turu",
    name: "Dünya Turu",
    emoji: "🌍",
    category: "after-party",
    description:
      "Latin, Balkan, Akdeniz ve dünya müziklerinden oluşan eğlenceli yolculuk. Her şarkı başka bir kıtaya götürür.",
    atmosphere: ["Maceraperest", "Eğlenceli", "Renkli", "Evrensel"],
    musicalDirection: ["Latin", "World Music", "Balkan", "Mediterranean"],
    tags: ["#worldmusic", "#latin", "#balkan"],
    energyLevel: 8,
    danceability: 9,
    cocktailFit: 5,
    dinnerFit: 4,
    weddingFit: 7,
    corporateFit: 5,
    afterPartyFit: 9,
    idealEventTypes: ["after-party", "private-party"],
    idealAudience: ["Seyahat severler", "Tüm yaşlar"],
    spotifyPlaylistId: "37i9dQZF1DX1lVhptIYRda",
    suggestedArtistIds: ["bora-sen"],
    references: [],
    color: "bg-[oklch(0.87_0.04_160)]",
    dark: false,
  },

  {
    id: "cocuklara-ozel",
    name: "Çocuklara Özel",
    emoji: "🧸",
    category: "after-party",
    description:
      "Çocuk misafirler için hazırlanmış eğlenceli ve güvenli müzik seçkileri. Aileyi bir arada tutan neşeli ritimler.",
    atmosphere: ["Neşeli", "Güvenli", "Eğlenceli", "Aile"],
    musicalDirection: ["Kids Pop", "Animated"],
    tags: ["#kids", "#family", "#children"],
    energyLevel: 7,
    danceability: 7,
    cocktailFit: 5,
    dinnerFit: 7,
    weddingFit: 8,
    corporateFit: 4,
    afterPartyFit: 5,
    idealEventTypes: ["wedding", "private-party", "corporate"],
    idealAudience: ["Çocuklu aileler"],
    spotifyPlaylistId: "37i9dQZF1DX1lVhptIYRda",
    suggestedArtistIds: [],
    references: [],
    color: "bg-[oklch(0.92_0.04_110)]",
    dark: false,
  },
];

// ─── CATEGORY META ──────────────────────────────────────────────────────────────

export const CONCEPT_CATEGORIES: Record<ConceptCategory, { label: string; description: string; emoji: string }> = {
  cocktail: {
    label: "Kokteyl & Karşılama",
    description: "Misafir karşılama, kokteyl saati ve yemek atmosferi için",
    emoji: "🥂",
  },
  celebration: {
    label: "Ana Kutlama",
    description: "Modern dans müzikleri ve kutlama enerjisi",
    emoji: "🎉",
  },
  traditional: {
    label: "Geleneksel",
    description: "Halaylar, oyun havaları ve kültürel dokunuşlar",
    emoji: "🔥",
  },
  "after-party": {
    label: "After Party",
    description: "Gece devam eder — sabaha kadar",
    emoji: "🌙",
  },
};

// ─── VENUE & SERVICES ──────────────────────────────────────────────────────────

export const VENUE_TYPES = [
  { id: "villa", label: "Villa" },
  { id: "hotel", label: "Otel" },
  { id: "vineyard", label: "Bağ & Çiftlik" },
  { id: "restaurant", label: "Restoran" },
  { id: "outdoor", label: "Açık Hava" },
  { id: "industrial", label: "Endüstriyel" },
  { id: "beach-club", label: "Beach Club" },
  { id: "rooftop", label: "Rooftop" },
];

export const PARTNER_SERVICES = [
  { id: "venue-search", label: "Mekan Seçimi", category: "Mekan" },
  { id: "hotel", label: "Otel", category: "Mekan" },
  { id: "vineyard", label: "Bağ & Çiftlik", category: "Mekan" },
  { id: "villa", label: "Villa", category: "Mekan" },
  { id: "restaurant", label: "Restoran", category: "Mekan" },
  { id: "dj", label: "DJ", category: "Müzik & Teknik" },
  { id: "live-music", label: "Canlı Müzik", category: "Müzik & Teknik" },
  { id: "sound", label: "Ses Sistemi", category: "Müzik & Teknik" },
  { id: "lighting", label: "Işık Tasarımı", category: "Müzik & Teknik" },
  { id: "stage", label: "Sahne Tasarımı", category: "Müzik & Teknik" },
  { id: "photography", label: "Fotoğraf", category: "Görsel" },
  { id: "videography", label: "Video", category: "Görsel" },
  { id: "content-creator", label: "Content Creator", category: "Görsel" },
  { id: "catering", label: "Catering", category: "Yeme & İçme" },
  { id: "cocktail-bar", label: "Kokteyl Bar", category: "Yeme & İçme" },
  { id: "floral", label: "Çiçek Tasarımı", category: "Dekorasyon" },
  { id: "decoration", label: "Dekorasyon", category: "Dekorasyon" },
  { id: "dance-class", label: "Dans Kursu", category: "Deneyim" },
  { id: "bridal-dress", label: "Gelinlik", category: "Stil" },
  { id: "groom-suit", label: "Damat Takımı", category: "Stil" },
  { id: "hair-makeup", label: "Saç & Makyaj", category: "Stil" },
  { id: "transportation", label: "Ulaşım", category: "Lojistik" },
  { id: "accommodation", label: "Konaklama", category: "Lojistik" },
  { id: "honeymoon", label: "Balayı Planlaması", category: "Lojistik" },
  { id: "digital-invite", label: "Dijital Davetiye", category: "Dijital" },
  { id: "memory-drive", label: "Memory Drive", category: "Dijital" },
];

export const CONCERNS = [
  { id: "bored", label: "Misafirlerin sıkılması" },
  { id: "empty-floor", label: "Boş dans pisti" },
  { id: "technical", label: "Teknik sorunlar" },
  { id: "stress", label: "Planlama stresi" },
  { id: "music", label: "Müzik seçimi" },
  { id: "budget", label: "Bütçe kontrolü" },
  { id: "nothing", label: "Hiçbiri, hazırım!" },
];

// Legacy aliases
export const SERVICES = PARTNER_SERVICES;
export const CONCEPTS = MUSIC_CONCEPTS.map((c) => ({
  id: c.id,
  title: c.name,
  mood: c.atmosphere.join(" · "),
  description: c.description,
  why: c.references.slice(0, 3).join(", ") || c.musicalDirection.join(", "),
  examples: c.idealEventTypes,
  color: c.color,
  dark: c.dark,
}));
