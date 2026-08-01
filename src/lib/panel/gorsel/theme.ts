import type { EventKind } from "@/lib/panel/types";

// Story/post görsel route'larının paylaştığı görsel dil: boyutlar, tema
// (dark/light), vurgu rengi (whitelist — bkz. aşağıdaki güvenlik notu) ve
// event_kind'e göre fotoğrafsız fallback gradyanları. Tek etkinlik
// (src/app/panel/etkinlik/[id]/gorsel) ve haftalık/aylık takvim
// (src/app/panel/takvim/gorsel) route'ları AYNI paleti kullanır — "aynı
// görsel dil" kararı (kurucu talebi).

export const SIZES = {
  story: { width: 1080, height: 1920 },
  post: { width: 1080, height: 1080 },
} as const;

export type ImageFormat = keyof typeof SIZES;

export type ImageTheme = "dark" | "light";

export type ImageAccentName = "amber" | "mor" | "turkuaz" | "kirmizi" | "yesil" | "mavi";

// GÜVENLİK: accent değeri doğrudan CSS'e (background/border/color) enjekte
// ediliyor. Kullanıcıdan serbest hex ASLA kabul edilmiyor — yalnız bu
// whitelist'teki isimler geçerli, aksi halde "amber" varsayılanına düşülüyor
// (bkz. resolveGorselOptions). Böylece query string üzerinden CSS/HTML
// injection riski yok.
export const ACCENT_HEX: Record<ImageAccentName, string> = {
  amber: "#c59c6d", // marka varsayılanı — globals.css --accent-amber
  mor: "#8b5cf6",
  turkuaz: "#06b6d4",
  kirmizi: "#ef4444",
  yesil: "#22c55e",
  mavi: "#3b82f6",
};

export const ACCENT_OPTIONS = Object.keys(ACCENT_HEX) as ImageAccentName[];

export const ACCENT_LABEL: Record<ImageAccentName, string> = {
  amber: "Amber",
  mor: "Mor",
  turkuaz: "Turkuaz",
  kirmizi: "Kırmızı",
  yesil: "Yeşil",
  mavi: "Mavi",
};

export interface GorselOptions {
  format: ImageFormat;
  theme: ImageTheme;
  accent: ImageAccentName;
  showPhoto: boolean;
  showHandle: boolean;
}

export const DEFAULT_GORSEL_OPTIONS: GorselOptions = {
  format: "story",
  theme: "dark",
  accent: "amber",
  showPhoto: true,
  showHandle: false,
};

// Query string'i doğrulayıp varsayılanlarla birleştirir — geçersiz/eksik
// değerler sessizce varsayılana düşer (route hiçbir zaman kötü değerle patlamaz).
export function resolveGorselOptions(sp: URLSearchParams): GorselOptions {
  const format: ImageFormat = sp.get("format") === "post" ? "post" : "story";
  const theme: ImageTheme = sp.get("theme") === "light" ? "light" : "dark";
  const accentRaw = sp.get("accent");
  const accent: ImageAccentName =
    accentRaw && (ACCENT_OPTIONS as string[]).includes(accentRaw) ? (accentRaw as ImageAccentName) : "amber";
  const showPhoto = sp.get("showPhoto") !== "0";
  const showHandle = sp.get("showHandle") === "1";
  return { format, theme, accent, showPhoto, showHandle };
}

export interface ImagePalette {
  theme: ImageTheme;
  bg: string;
  scrimRgb: string;
  ink: string;
  inkSecondary: string;
  inkTertiary: string;
  pillBg: string;
  cardBorder: string;
  accent: string;
  onAccent: string;
  gradientMid: string;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = hex.replace("#", "");
  return { r: parseInt(n.slice(0, 2), 16), g: parseInt(n.slice(2, 4), 16), b: parseInt(n.slice(4, 6), 16) };
}

function mixHex(hexA: string, hexB: string, t: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `#${[r, g, bl].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`;
}

// oklch() → sRGB dönüşümleri (globals.css .dark / :root token'ları, Björn
// Ottosson'ın OKLab formülüyle elle hesaplandı) — satori'nin CSS renderer'ı
// oklch()'i güvenilir desteklemiyor, bu yüzden sabit hex kullanılıyor.
export function getPalette(theme: ImageTheme, accentName: ImageAccentName): ImagePalette {
  const accent = ACCENT_HEX[accentName];
  if (theme === "light") {
    return {
      theme,
      bg: "#f9f6f2", // --warm-cream
      scrimRgb: "249, 246, 242",
      ink: "#1c1712", // ~ --foreground (light)
      inkSecondary: "#4a4038",
      inkTertiary: "#6b6058", // ~ --muted-foreground (light)
      pillBg: "rgba(28, 23, 18, 0.08)",
      cardBorder: "rgba(28, 23, 18, 0.16)",
      accent,
      onAccent: "#1c1712",
      gradientMid: "#c0b5aa", // --warm-stone
    };
  }
  return {
    theme,
    bg: "#040303", // --background (.dark)
    scrimRgb: "4, 3, 3",
    ink: "#f9f6f2",
    inkSecondary: "#e4ddd3",
    inkTertiary: "#c0b5aa",
    pillBg: "rgba(249, 246, 242, 0.16)",
    cardBorder: "rgba(249, 246, 242, 0.2)",
    accent,
    onAccent: "#0b0807",
    gradientMid: "#291f18",
  };
}

// Fotoğrafsız fallback (ve takvim görselinin arka planı): event_kind yapıyı
// (açı + duraklar) belirler, seçilen accent + tema rengi tonu belirler —
// böylece hem "türe göre gradyan" hem "vurgu rengi özelleştirmesi" aynı anda
// karşılanıyor.
export function kindGradient(palette: ImagePalette, kind: EventKind): string {
  const strong = mixHex(palette.accent, palette.gradientMid, 0.3);
  const soft = mixHex(palette.accent, palette.gradientMid, 0.7);
  switch (kind) {
    case "dj":
      return `linear-gradient(158deg, ${strong} 0%, ${palette.bg} 62%)`;
    case "live_music":
      return `linear-gradient(200deg, ${soft} 0%, ${palette.bg} 58%)`;
    case "karaoke":
      return `linear-gradient(135deg, ${strong} 0%, ${palette.gradientMid} 42%, ${palette.bg} 100%)`;
    case "quiz":
      return `linear-gradient(180deg, ${soft} 0%, ${palette.bg} 68%)`;
    case "theme_night":
      return `linear-gradient(120deg, ${palette.accent} 0%, ${palette.gradientMid} 38%, ${palette.bg} 100%)`;
    case "other":
    default:
      return `linear-gradient(160deg, ${strong} 0%, ${palette.bg} 65%)`;
  }
}

// Takvim (haftalık/aylık) görseli için tek bir event_kind yok — nötr/imza
// gradyan olarak "other" kompozisyonu kullanılıyor.
export function defaultGradient(palette: ImagePalette): string {
  return kindGradient(palette, "other");
}

// Tek etkinlik görselinde metin bloğu yalnız alt üçte birde — örtü orada koyulaşır.
export function scrimGradient(palette: ImagePalette): string {
  return `linear-gradient(180deg, rgba(${palette.scrimRgb}, 0.18) 0%, rgba(${palette.scrimRgb}, 0.08) 26%, rgba(${palette.scrimRgb}, 0.6) 60%, rgba(${palette.scrimRgb}, 0.96) 100%)`;
}

// Takvim (haftalık/aylık) görselinde liste neredeyse tüm yüksekliği kaplıyor
// — okunabilirlik için örtü baştan itibaren daha güçlü.
export function fullScrimGradient(palette: ImagePalette): string {
  return `linear-gradient(180deg, rgba(${palette.scrimRgb}, 0.4) 0%, rgba(${palette.scrimRgb}, 0.62) 18%, rgba(${palette.scrimRgb}, 0.86) 50%, rgba(${palette.scrimRgb}, 0.97) 100%)`;
}
