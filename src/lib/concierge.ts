// AI Event Concierge — deterministik eşleştirme ve doğrulama katmanı.
// AI yalnızca serbest metinden yapılandırılmış sinyal çıkarır (bkz. aiContent.extractEventVibe);
// konsept/sanatçı seçimi ve fiyat aralığı burada, katalog verisiyle deterministik hesaplanır.
// AI çıktısı asla doğrudan güvenilmez: her alan bu dosyadaki allowlist'lere karşı doğrulanır.

import {
  MUSIC_CONCEPTS,
  EVENT_TYPES,
  PARTNER_SERVICES,
  type MusicConcept,
} from "@/components/planner/PlannerStore";
import {
  estimateFeeRangeAcrossArtists,
  formatFeeRange,
  type ArtistFeeData,
} from "@/lib/artistPricing";

// ── Chip allowlist'leri ───────────────────────────────────────────────────────

export const GUEST_RANGES = [
  { id: "0-50", label: "50'ye kadar" },
  { id: "50-100", label: "50–100" },
  { id: "100-200", label: "100–200" },
  { id: "200-400", label: "200–400" },
  { id: "400+", label: "400+" },
] as const;

export const CITIES = [
  { id: "kayseri", label: "Kayseri" },
  { id: "nevsehir", label: "Nevşehir / Kapadokya" },
  { id: "other", label: "Diğer" },
] as const;

export const VENUE_STATUS = [
  { id: "var", label: "Mekanım belli" },
  { id: "yok", label: "Mekan arıyorum" },
] as const;

export const BUDGET_LEVELS = [
  { id: "economic", label: "Bütçe dostu" },
  { id: "balanced", label: "Dengeli" },
  { id: "premium", label: "Premium" },
] as const;

// Önümüzdeki 12 ay + "belirsiz" — id formatı YYYY-MM
export function buildMonthOptions(now = new Date()): { id: string; label: string }[] {
  const months: { id: string; label: string }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    months.push({
      id,
      label: d.toLocaleDateString("tr-TR", { month: "long", year: "numeric" }),
    });
  }
  months.push({ id: "flexible", label: "Henüz belirsiz" });
  return months;
}

export type ConciergeInput = {
  eventType: string;
  month: string;
  guestRange: string;
  city: string;
  venueStatus: string;
  budgetLevel: string;
  freeText: string;
};

const MONTH_ID_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function validateConciergeInput(input: ConciergeInput): string | null {
  if (!EVENT_TYPES.some((e) => e.id === input.eventType)) return "Geçersiz etkinlik türü.";
  if (input.month !== "flexible" && !MONTH_ID_RE.test(input.month)) return "Geçersiz tarih seçimi.";
  if (!GUEST_RANGES.some((g) => g.id === input.guestRange)) return "Geçersiz misafir sayısı.";
  if (!CITIES.some((c) => c.id === input.city)) return "Geçersiz şehir seçimi.";
  if (!VENUE_STATUS.some((v) => v.id === input.venueStatus)) return "Geçersiz mekan durumu.";
  if (!BUDGET_LEVELS.some((b) => b.id === input.budgetLevel)) return "Geçersiz bütçe seçimi.";
  return null;
}

export function sanitizeFreeText(text: string): string {
  return (text ?? "").replace(/\s+/g, " ").trim().slice(0, 600);
}

// ── AI çıktısı doğrulama ──────────────────────────────────────────────────────

export type VibeExtraction = {
  keywords: string[];
  energy: number | null;
  services: string[];
  narrative: string;
};

export const EMPTY_EXTRACTION: VibeExtraction = {
  keywords: [],
  energy: null,
  services: [],
  narrative: "",
};

// Ham (parse edilmiş ama güvenilmeyen) AI çıktısını katalog allowlist'lerine indirger.
export function validateExtraction(raw: unknown): VibeExtraction {
  const obj = (raw ?? {}) as Record<string, unknown>;

  const keywords = Array.isArray(obj.keywords)
    ? obj.keywords
        .filter((k): k is string => typeof k === "string")
        .map((k) => k.trim().toLowerCase().slice(0, 30))
        .filter(Boolean)
        .slice(0, 8)
    : [];

  const energyNum = typeof obj.energy === "number" ? Math.round(obj.energy) : NaN;
  const energy = energyNum >= 1 && energyNum <= 10 ? energyNum : null;

  const serviceIds = new Set(PARTNER_SERVICES.map((s) => s.id));
  const services = Array.isArray(obj.services)
    ? obj.services
        .filter((s): s is string => typeof s === "string" && serviceIds.has(s))
        .slice(0, 6)
    : [];

  const narrative =
    typeof obj.narrative === "string"
      ? obj.narrative
          .replace(/https?:\/\/\S+/g, "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 420)
      : "";

  return { keywords, energy, services, narrative };
}

export function fallbackNarrative(eventTypeId: string): string {
  const label = EVENT_TYPES.find((e) => e.id === eventTypeId)?.label ?? "Etkinliğin";
  return `${label} için anlattıklarına ve seçimlerine göre bir deneyim taslağı hazırladık. Aşağıdaki konseptler ve sanatçılar, hayal ettiğin atmosfere en yakın eşleşmeler.`;
}

// ── Deterministik konsept eşleştirme ─────────────────────────────────────────

function fitForEventType(c: MusicConcept, eventTypeId: string): number {
  switch (eventTypeId) {
    case "wedding":
    case "engagement":
    case "kina-gecesi":
    case "bride":
      return c.weddingFit;
    case "corporate":
    case "opening":
    case "brand-launch":
      return c.corporateFit;
    case "after-party":
    case "morning-party":
      return c.afterPartyFit;
    default:
      // özel parti / doğum günü / mezuniyet: dans edilebilirlik iyi bir vekil
      return c.danceability;
  }
}

export function matchConcepts(
  input: { eventType: string },
  extraction: VibeExtraction,
  activeSlugs?: string[] | null
): MusicConcept[] {
  const pool =
    activeSlugs && activeSlugs.length > 0
      ? MUSIC_CONCEPTS.filter((c) => activeSlugs.includes(c.id))
      : MUSIC_CONCEPTS;

  const scored = pool.map((c) => {
    let score = fitForEventType(c, input.eventType);
    if (c.idealEventTypes.includes(input.eventType)) score += 3;

    if (extraction.keywords.length > 0) {
      const haystack = [
        c.name,
        c.description,
        ...c.atmosphere,
        ...c.tags,
        ...c.musicalDirection,
      ]
        .join(" ")
        .toLowerCase();
      let hits = 0;
      for (const kw of extraction.keywords) {
        if (kw.length >= 3 && haystack.includes(kw)) hits += 1;
      }
      score += Math.min(hits * 2, 8);
    }

    if (extraction.energy !== null) {
      score -= Math.abs(c.energyLevel - extraction.energy) * 0.5;
    }

    return { concept: c, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.concept);
}

// ── Deterministik sanatçı eşleştirme ─────────────────────────────────────────

export type ConciergeArtist = ArtistFeeData & {
  id: string;
  name: string;
  performer_type: string | null;
  city: string | null;
  photo_url: string | null;
  photos?: string[] | null;
  concept_tags: string[] | null;
};

export function matchArtists(
  artists: ConciergeArtist[],
  conceptIds: string[],
  cityId: string
): ConciergeArtist[] {
  const cityName = CITIES.find((c) => c.id === cityId)?.label ?? "";
  const scored = artists.map((a) => {
    let score = 0;
    for (const tag of a.concept_tags ?? []) {
      if (conceptIds.includes(tag)) score += 3;
    }
    if (a.city && cityName.toLowerCase().includes(a.city.toLowerCase())) score += 2;
    return { artist: a, score };
  });
  const withMatch = scored.filter((s) => s.score > 0).sort((a, b) => b.score - a.score);
  const picked = (withMatch.length > 0 ? withMatch : scored).slice(0, 3);
  return picked.map((s) => s.artist);
}

// ── Hizmet türetme ve fiyat aralığı ──────────────────────────────────────────

export function deriveServices(extraction: VibeExtraction, venueStatus: string): string[] {
  const ids = new Set<string>(["dj"]);
  if (venueStatus === "yok") ids.add("venue-search");
  for (const s of extraction.services) ids.add(s);
  return [...ids];
}

export function serviceLabels(ids: string[]): string[] {
  return ids
    .map((id) => PARTNER_SERVICES.find((s) => s.id === id)?.label)
    .filter((l): l is string => Boolean(l));
}

// Fiyat aralığı ASLA AI'dan gelmez — yalnızca sanatçı kaşe verisinden hesaplanır.
export function estimatePriceText(
  matched: ConciergeArtist[],
  allArtists: ConciergeArtist[],
  eventTypeId: string
): string | null {
  const range =
    estimateFeeRangeAcrossArtists(matched, eventTypeId) ??
    estimateFeeRangeAcrossArtists(allArtists, eventTypeId);
  return range ? formatFeeRange(range) : null;
}
