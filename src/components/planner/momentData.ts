"use client";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type MomentSong = {
  id: string;
  title: string;
  artist: string;
  spotifyUrl?: string;
  youtubeUrl?: string;
  category: string;
  moodTags: string[];
  eventMoment: string;
  language: "tr" | "en" | "other";
  energy: "slow" | "medium" | "energetic";
};

export type EventMoment = {
  id: string;
  label: string;
  emoji: string;
  description?: string;
  hasSongDatabase: boolean;
};

export type MomentSelection = {
  important: boolean;
  moods: string[];
  musicPref: "local" | "international" | "mixed" | "";
  energy: "slow" | "medium" | "energetic" | "";
  selectedSongId?: string;
  customSong?: {
    name?: string;
    spotifyUrl?: string;
    youtubeUrl?: string;
  };
};

// ─── IMPORTANT MOMENTS PER EVENT TYPE ────────────────────────────────────────

export const EVENT_MOMENTS: Record<string, EventMoment[]> = {
  wedding: [
    {
      id: "salon-giris",
      label: "Salona Giriş",
      emoji: "🚪",
      description: "Gelin ve damadın salona ilk adımı — tüm gözler sizde.",
      hasSongDatabase: true,
    },
    {
      id: "ilk-dans",
      label: "İlk Dans",
      emoji: "💃",
      description: "Birlikte paylaştığınız ilk dans anı.",
      hasSongDatabase: true,
    },
    {
      id: "pasta-kesimi",
      label: "Pasta Kesimi",
      emoji: "🎂",
      description: "Pastanın kesildiği neşeli kutlama anı.",
      hasSongDatabase: true,
    },
    {
      id: "cicek-atma",
      label: "Çiçek Atma",
      emoji: "💐",
      description: "Gelinin buketi eğlenceli bir anla yeni adaya.",
      hasSongDatabase: true,
    },
  ],

  "kina-gecesi": [
    {
      id: "karsilama",
      label: "Karşılama",
      emoji: "🌹",
      description: "Misafirlerin gelişi ve ilk atmosfer.",
      hasSongDatabase: true,
    },
    {
      id: "kina-girisi",
      label: "Kına Girişi",
      emoji: "🔥",
      description: "Gelinin kına törenine girişi.",
      hasSongDatabase: true,
    },
    {
      id: "kina-yakma",
      label: "Kına Yakma",
      emoji: "✋",
      description: "Kınanın yakılması ve duygusal an.",
      hasSongDatabase: true,
    },
    {
      id: "bindalli",
      label: "Bindallı Bölümü",
      emoji: "👗",
      description: "Geleneksel bindallı kıyafeti ile özel sahne.",
      hasSongDatabase: true,
    },
    {
      id: "oyun-havalari-kina",
      label: "Oyun Havaları",
      emoji: "🎵",
      description: "Misafirleri ayağa kaldıran oyun havaları.",
      hasSongDatabase: true,
    },
    {
      id: "roman-havalari",
      label: "Roman Havaları",
      emoji: "🥁",
      description: "Roman ritmiyle coşkulu dans bölümü.",
      hasSongDatabase: true,
    },
    {
      id: "halaylar-kina",
      label: "Halaylar",
      emoji: "🙌",
      description: "El ele halayın enerjisiyle kapanış.",
      hasSongDatabase: true,
    },
    {
      id: "final-kina",
      label: "Final",
      emoji: "🎊",
      description: "Gecenin kapanış anı.",
      hasSongDatabase: true,
    },
  ],

  opening: [
    {
      id: "karsilama-opening",
      label: "Karşılama",
      emoji: "🤝",
      description: "Davetlilerin karşılanması.",
      hasSongDatabase: false,
    },
    {
      id: "kurdele-kesimi",
      label: "Kurdele Kesimi",
      emoji: "✂️",
      description: "Açılışın sembolik anı.",
      hasSongDatabase: false,
    },
    {
      id: "ilk-konusma",
      label: "İlk Konuşma",
      emoji: "🎤",
      description: "Açılış konuşması ve sahne.",
      hasSongDatabase: false,
    },
    {
      id: "marka-sunumu",
      label: "Marka Sunumu",
      emoji: "🎯",
      description: "Markanın tanıtımı.",
      hasSongDatabase: false,
    },
    {
      id: "networking-opening",
      label: "Networking",
      emoji: "💬",
      description: "Misafirlerin birbirleriyle buluşması.",
      hasSongDatabase: false,
    },
    {
      id: "kutlama-opening",
      label: "Kutlama",
      emoji: "🥂",
      description: "Açılışın kutlanması.",
      hasSongDatabase: false,
    },
  ],

  corporate: [
    {
      id: "karsilama-corp",
      label: "Karşılama",
      emoji: "🤝",
      description: "Kurumsal karşılama ve kayıt.",
      hasSongDatabase: false,
    },
    {
      id: "sunum",
      label: "Sunum",
      emoji: "📊",
      description: "Ana sunum veya panel.",
      hasSongDatabase: false,
    },
    {
      id: "odul-toreni",
      label: "Ödül Töreni",
      emoji: "🏆",
      description: "Başarıların ödüllendirilmesi.",
      hasSongDatabase: false,
    },
    {
      id: "networking-corp",
      label: "Networking",
      emoji: "💬",
      description: "Profesyonel ağ kurma bölümü.",
      hasSongDatabase: false,
    },
    {
      id: "kutlama-corp",
      label: "Kutlama",
      emoji: "🥂",
      description: "Başarının kutlanması.",
      hasSongDatabase: false,
    },
    {
      id: "after-party-corp",
      label: "After Party",
      emoji: "🌙",
      description: "Resmi programın ardından gece.",
      hasSongDatabase: false,
    },
  ],

  "brand-launch": [
    {
      id: "karsilama-brand",
      label: "Karşılama",
      emoji: "🤝",
      hasSongDatabase: false,
    },
    {
      id: "urun-tanitimi",
      label: "Ürün Tanıtımı",
      emoji: "🎯",
      hasSongDatabase: false,
    },
    {
      id: "sahne-cikisi",
      label: "Sahne Çıkışı",
      emoji: "🎤",
      hasSongDatabase: false,
    },
    {
      id: "networking-brand",
      label: "Networking",
      emoji: "💬",
      hasSongDatabase: false,
    },
    {
      id: "kutlama-brand",
      label: "Kutlama",
      emoji: "🥂",
      hasSongDatabase: false,
    },
  ],

  "private-party": [
    {
      id: "karsilama-party",
      label: "Karşılama",
      emoji: "🎉",
      hasSongDatabase: false,
    },
    {
      id: "pasta-party",
      label: "Pasta Kesimi",
      emoji: "🎂",
      hasSongDatabase: true,
    },
    {
      id: "kutlama-party",
      label: "Kutlama",
      emoji: "🥂",
      hasSongDatabase: false,
    },
    {
      id: "gece-kapanis",
      label: "Gece Kapanışı",
      emoji: "🌙",
      hasSongDatabase: false,
    },
  ],

  cocktail: [
    {
      id: "karsilama-cocktail",
      label: "Karşılama",
      emoji: "🍸",
      hasSongDatabase: false,
    },
    {
      id: "ana-kokteyl",
      label: "Ana Kokteyl Saati",
      emoji: "🥂",
      hasSongDatabase: false,
    },
    {
      id: "kapanis-cocktail",
      label: "Kapanış",
      emoji: "🌙",
      hasSongDatabase: false,
    },
  ],

  sunset: [
    {
      id: "varis-sunset",
      label: "Varış",
      emoji: "🌅",
      hasSongDatabase: false,
    },
    {
      id: "golden-hour",
      label: "Golden Hour",
      emoji: "🌇",
      hasSongDatabase: false,
    },
    {
      id: "gece-gecisi",
      label: "Gece Geçişi",
      emoji: "🌙",
      hasSongDatabase: false,
    },
  ],

  "after-party": [
    {
      id: "isinma",
      label: "Isınma",
      emoji: "🔥",
      hasSongDatabase: false,
    },
    {
      id: "pik-saat",
      label: "Pik Saat",
      emoji: "⚡",
      hasSongDatabase: false,
    },
    {
      id: "sabaha-karsi",
      label: "Sabaha Karşı",
      emoji: "🌅",
      hasSongDatabase: false,
    },
  ],
};

// ─── MOOD OPTIONS ─────────────────────────────────────────────────────────────

export const MOMENT_MOODS = [
  "Romantik",
  "Duygusal",
  "Eğlenceli",
  "Coşkulu",
  "Güçlü",
  "Modern",
  "Zamansız",
  "Epik",
  "Samimi",
  "Geleneksel",
];

// ─── SONG DATABASE ─────────────────────────────────────────────────────────────

export const MOMENT_SONGS: MomentSong[] = [

  // ── İLK DANS — YAVAŞ / TÜRKÇE ─────────────────────────────────────────────
  {
    id: "ilk-dans-tr-1",
    title: "Hep Seninle",
    artist: "Tarkan",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "FIRST_DANCE",
    moodTags: ["Romantik", "Zamansız"],
    eventMoment: "ilk-dans",
    language: "tr",
    energy: "slow",
  },
  {
    id: "ilk-dans-tr-2",
    title: "Seninle Son Yıldız",
    artist: "Feridun Düzağaç",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "FIRST_DANCE",
    moodTags: ["Romantik", "Duygusal", "Zamansız"],
    eventMoment: "ilk-dans",
    language: "tr",
    energy: "slow",
  },
  {
    id: "ilk-dans-tr-3",
    title: "Güneşin Altında",
    artist: "Teoman",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "FIRST_DANCE",
    moodTags: ["Romantik", "Duygusal"],
    eventMoment: "ilk-dans",
    language: "tr",
    energy: "slow",
  },
  {
    id: "ilk-dans-tr-4",
    title: "Yüreğim",
    artist: "Sıla",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "FIRST_DANCE",
    moodTags: ["Romantik", "Samimi"],
    eventMoment: "ilk-dans",
    language: "tr",
    energy: "slow",
  },
  {
    id: "ilk-dans-tr-5",
    title: "Ne Kadar Güzel",
    artist: "MFÖ",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "FIRST_DANCE",
    moodTags: ["Romantik", "Samimi", "Zamansız"],
    eventMoment: "ilk-dans",
    language: "tr",
    energy: "medium",
  },
  {
    id: "ilk-dans-tr-6",
    title: "Sana Dair",
    artist: "Yüksek Sadakat",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "FIRST_DANCE",
    moodTags: ["Duygusal", "Modern"],
    eventMoment: "ilk-dans",
    language: "tr",
    energy: "slow",
  },

  // ── İLK DANS — YAVAŞ / YABANCI ────────────────────────────────────────────
  {
    id: "ilk-dans-en-1",
    title: "Perfect",
    artist: "Ed Sheeran",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "FIRST_DANCE",
    moodTags: ["Romantik", "Zamansız", "Modern"],
    eventMoment: "ilk-dans",
    language: "en",
    energy: "slow",
  },
  {
    id: "ilk-dans-en-2",
    title: "All of Me",
    artist: "John Legend",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "FIRST_DANCE",
    moodTags: ["Romantik", "Duygusal"],
    eventMoment: "ilk-dans",
    language: "en",
    energy: "slow",
  },
  {
    id: "ilk-dans-en-3",
    title: "Thinking Out Loud",
    artist: "Ed Sheeran",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "FIRST_DANCE",
    moodTags: ["Romantik", "Zamansız"],
    eventMoment: "ilk-dans",
    language: "en",
    energy: "slow",
  },
  {
    id: "ilk-dans-en-4",
    title: "A Thousand Years",
    artist: "Christina Perri",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "FIRST_DANCE",
    moodTags: ["Romantik", "Duygusal", "Zamansız"],
    eventMoment: "ilk-dans",
    language: "en",
    energy: "slow",
  },
  {
    id: "ilk-dans-en-5",
    title: "Can't Help Falling in Love",
    artist: "Elvis Presley",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "FIRST_DANCE",
    moodTags: ["Romantik", "Zamansız", "Samimi"],
    eventMoment: "ilk-dans",
    language: "en",
    energy: "slow",
  },
  {
    id: "ilk-dans-en-6",
    title: "Lover",
    artist: "Taylor Swift",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "FIRST_DANCE",
    moodTags: ["Romantik", "Eğlenceli", "Modern"],
    eventMoment: "ilk-dans",
    language: "en",
    energy: "medium",
  },
  {
    id: "ilk-dans-en-7",
    title: "Make You Feel My Love",
    artist: "Adele",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "FIRST_DANCE",
    moodTags: ["Duygusal", "Romantik", "Samimi"],
    eventMoment: "ilk-dans",
    language: "en",
    energy: "slow",
  },

  // ── PASTA KESİMİ — TÜRKÇE ─────────────────────────────────────────────────
  {
    id: "pasta-tr-1",
    title: "Hayatımın Anlamı",
    artist: "Tarkan",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "CAKE_CUTTING",
    moodTags: ["Eğlenceli", "Coşkulu"],
    eventMoment: "pasta-kesimi",
    language: "tr",
    energy: "medium",
  },
  {
    id: "pasta-tr-2",
    title: "Sikidim",
    artist: "Tarkan",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "CAKE_CUTTING",
    moodTags: ["Eğlenceli", "Coşkulu"],
    eventMoment: "pasta-kesimi",
    language: "tr",
    energy: "energetic",
  },
  {
    id: "pasta-tr-3",
    title: "Bomba",
    artist: "Tarkan",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "CAKE_CUTTING",
    moodTags: ["Eğlenceli", "Coşkulu", "Modern"],
    eventMoment: "pasta-kesimi",
    language: "tr",
    energy: "energetic",
  },
  {
    id: "pasta-tr-4",
    title: "Düm Tek",
    artist: "Tarkan",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "CAKE_CUTTING",
    moodTags: ["Eğlenceli", "Coşkulu"],
    eventMoment: "pasta-kesimi",
    language: "tr",
    energy: "energetic",
  },
  {
    id: "pasta-tr-5",
    title: "Acı Aşk",
    artist: "Ajda Pekkan",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "CAKE_CUTTING",
    moodTags: ["Eğlenceli", "Zamansız"],
    eventMoment: "pasta-kesimi",
    language: "tr",
    energy: "medium",
  },

  // ── PASTA KESİMİ — YABANCI ────────────────────────────────────────────────
  {
    id: "pasta-en-1",
    title: "Happy",
    artist: "Pharrell Williams",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "CAKE_CUTTING",
    moodTags: ["Eğlenceli", "Coşkulu"],
    eventMoment: "pasta-kesimi",
    language: "en",
    energy: "energetic",
  },
  {
    id: "pasta-en-2",
    title: "Celebration",
    artist: "Kool & The Gang",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "CAKE_CUTTING",
    moodTags: ["Eğlenceli", "Zamansız", "Coşkulu"],
    eventMoment: "pasta-kesimi",
    language: "en",
    energy: "energetic",
  },
  {
    id: "pasta-en-3",
    title: "Can't Stop the Feeling",
    artist: "Justin Timberlake",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "CAKE_CUTTING",
    moodTags: ["Eğlenceli", "Coşkulu", "Modern"],
    eventMoment: "pasta-kesimi",
    language: "en",
    energy: "energetic",
  },
  {
    id: "pasta-en-4",
    title: "September",
    artist: "Earth, Wind & Fire",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "CAKE_CUTTING",
    moodTags: ["Eğlenceli", "Zamansız", "Coşkulu"],
    eventMoment: "pasta-kesimi",
    language: "en",
    energy: "energetic",
  },
  {
    id: "pasta-en-5",
    title: "Uptown Funk",
    artist: "Mark Ronson ft. Bruno Mars",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "CAKE_CUTTING",
    moodTags: ["Eğlenceli", "Coşkulu", "Modern"],
    eventMoment: "pasta-kesimi",
    language: "en",
    energy: "energetic",
  },

  // ── ÇİÇEK ATMA ───────────────────────────────────────────────────────────
  {
    id: "cicek-en-1",
    title: "Single Ladies",
    artist: "Beyoncé",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "BOUQUET_TOSS",
    moodTags: ["Eğlenceli", "Coşkulu", "Güçlü"],
    eventMoment: "cicek-atma",
    language: "en",
    energy: "energetic",
  },
  {
    id: "cicek-en-2",
    title: "Girls Just Want to Have Fun",
    artist: "Cyndi Lauper",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "BOUQUET_TOSS",
    moodTags: ["Eğlenceli", "Zamansız"],
    eventMoment: "cicek-atma",
    language: "en",
    energy: "energetic",
  },
  {
    id: "cicek-en-3",
    title: "Run the World (Girls)",
    artist: "Beyoncé",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "BOUQUET_TOSS",
    moodTags: ["Güçlü", "Coşkulu", "Eğlenceli"],
    eventMoment: "cicek-atma",
    language: "en",
    energy: "energetic",
  },
  {
    id: "cicek-en-4",
    title: "Good as Hell",
    artist: "Lizzo",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "BOUQUET_TOSS",
    moodTags: ["Güçlü", "Eğlenceli", "Modern"],
    eventMoment: "cicek-atma",
    language: "en",
    energy: "energetic",
  },
  {
    id: "cicek-tr-1",
    title: "Kış Masalı",
    artist: "Gülşen",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "BOUQUET_TOSS",
    moodTags: ["Eğlenceli", "Modern"],
    eventMoment: "cicek-atma",
    language: "tr",
    energy: "energetic",
  },
  {
    id: "cicek-tr-2",
    title: "Senden Daha Güzel",
    artist: "Hande Yener",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "BOUQUET_TOSS",
    moodTags: ["Güçlü", "Eğlenceli", "Modern"],
    eventMoment: "cicek-atma",
    language: "tr",
    energy: "energetic",
  },

  // ── SALON GİRİŞ ──────────────────────────────────────────────────────────
  {
    id: "giris-en-1",
    title: "Power",
    artist: "Kanye West",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "ENTRANCE",
    moodTags: ["Epik", "Güçlü", "Modern"],
    eventMoment: "salon-giris",
    language: "en",
    energy: "energetic",
  },
  {
    id: "giris-en-2",
    title: "Levitating",
    artist: "Dua Lipa",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "ENTRANCE",
    moodTags: ["Modern", "Coşkulu", "Eğlenceli"],
    eventMoment: "salon-giris",
    language: "en",
    energy: "energetic",
  },
  {
    id: "giris-en-3",
    title: "Crazy in Love",
    artist: "Beyoncé",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "ENTRANCE",
    moodTags: ["Epik", "Güçlü", "Romantik", "Modern"],
    eventMoment: "salon-giris",
    language: "en",
    energy: "energetic",
  },
  {
    id: "giris-en-4",
    title: "A Sky Full of Stars",
    artist: "Coldplay",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "ENTRANCE",
    moodTags: ["Romantik", "Epik", "Duygusal"],
    eventMoment: "salon-giris",
    language: "en",
    energy: "energetic",
  },
  {
    id: "giris-en-5",
    title: "All I Do Is Win",
    artist: "DJ Khaled",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "ENTRANCE",
    moodTags: ["Epik", "Coşkulu", "Güçlü"],
    eventMoment: "salon-giris",
    language: "en",
    energy: "energetic",
  },
  {
    id: "giris-tr-1",
    title: "Aşkın Her Yerde Canim",
    artist: "Tarkan",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "ENTRANCE",
    moodTags: ["Romantik", "Coşkulu"],
    eventMoment: "salon-giris",
    language: "tr",
    energy: "energetic",
  },
  {
    id: "giris-tr-2",
    title: "Kuzu Kuzu",
    artist: "Tarkan",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "ENTRANCE",
    moodTags: ["Eğlenceli", "Coşkulu"],
    eventMoment: "salon-giris",
    language: "tr",
    energy: "energetic",
  },

  // ── KINA GECESİ — KINA YAKMA ──────────────────────────────────────────────
  {
    id: "kina-yakma-1",
    title: "Kına Gecesi",
    artist: "Geleneksel",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "HENNA_CEREMONY",
    moodTags: ["Duygusal", "Geleneksel", "Samimi"],
    eventMoment: "kina-yakma",
    language: "tr",
    energy: "slow",
  },
  {
    id: "kina-yakma-2",
    title: "Ağlama Gelin",
    artist: "Geleneksel",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "HENNA_CEREMONY",
    moodTags: ["Duygusal", "Geleneksel"],
    eventMoment: "kina-yakma",
    language: "tr",
    energy: "slow",
  },
  {
    id: "kina-yakma-3",
    title: "Yüksek Yüksek Tepeler",
    artist: "Geleneksel",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "HENNA_CEREMONY",
    moodTags: ["Duygusal", "Geleneksel", "Zamansız"],
    eventMoment: "kina-yakma",
    language: "tr",
    energy: "slow",
  },

  // ── KINA GECESİ — ROMAN HAVALARI ─────────────────────────────────────────
  {
    id: "roman-1",
    title: "İki Kapılı Han",
    artist: "Geleneksel Roman",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "ROMAN_MUSIC",
    moodTags: ["Coşkulu", "Geleneksel", "Eğlenceli"],
    eventMoment: "roman-havalari",
    language: "tr",
    energy: "energetic",
  },
  {
    id: "roman-2",
    title: "Aşkın Olayım",
    artist: "Geleneksel Roman",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "ROMAN_MUSIC",
    moodTags: ["Coşkulu", "Eğlenceli"],
    eventMoment: "roman-havalari",
    language: "tr",
    energy: "energetic",
  },
  {
    id: "roman-3",
    title: "Çay Çay",
    artist: "Geleneksel Roman",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "ROMAN_MUSIC",
    moodTags: ["Eğlenceli", "Coşkulu"],
    eventMoment: "roman-havalari",
    language: "tr",
    energy: "energetic",
  },

  // ── KINA GECESİ — HALAYLAR ───────────────────────────────────────────────
  {
    id: "halay-1",
    title: "Halay Sevenler",
    artist: "Geleneksel",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "HALAY",
    moodTags: ["Coşkulu", "Geleneksel", "Eğlenceli"],
    eventMoment: "halaylar-kina",
    language: "tr",
    energy: "energetic",
  },
  {
    id: "halay-2",
    title: "Çukurova Halayı",
    artist: "Geleneksel",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "HALAY",
    moodTags: ["Coşkulu", "Geleneksel"],
    eventMoment: "halaylar-kina",
    language: "tr",
    energy: "energetic",
  },

  // ── PASTA (ÖZEL PARTİ) ───────────────────────────────────────────────────
  {
    id: "pasta-party-1",
    title: "Happy Birthday to You",
    artist: "Traditional",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "BIRTHDAY_CAKE",
    moodTags: ["Eğlenceli", "Samimi"],
    eventMoment: "pasta-party",
    language: "en",
    energy: "medium",
  },
  {
    id: "pasta-party-2",
    title: "Happy",
    artist: "Pharrell Williams",
    spotifyUrl: "",
    youtubeUrl: "",
    category: "BIRTHDAY_CAKE",
    moodTags: ["Eğlenceli", "Coşkulu"],
    eventMoment: "pasta-party",
    language: "en",
    energy: "energetic",
  },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

export function getSongsForMoment(
  momentId: string,
  options: {
    language?: "tr" | "en" | "mixed";
    energy?: "slow" | "medium" | "energetic" | "";
    moods?: string[];
  } = {}
): MomentSong[] {
  let songs = MOMENT_SONGS.filter((s) => s.eventMoment === momentId);

  if (options.language && options.language !== "mixed") {
    songs = songs.filter((s) => s.language === options.language);
  }

  if (options.energy) {
    songs = songs.filter((s) => s.energy === options.energy);
  }

  if (options.moods && options.moods.length > 0) {
    songs = songs.filter((s) =>
      options.moods!.some((m) => s.moodTags.includes(m))
    );
  }

  // Fall back to all songs for moment if filters yield nothing
  if (songs.length === 0) {
    songs = MOMENT_SONGS.filter((s) => s.eventMoment === momentId);
  }

  return songs.slice(0, 5);
}

export function getMomentsForEventType(eventType: string): EventMoment[] {
  return EVENT_MOMENTS[eventType] ?? [];
}
