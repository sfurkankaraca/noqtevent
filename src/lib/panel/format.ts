import type { ClaimRowStatus, ClaimStatus, EntryPolicy, EventKind, ReviewStatus, SupplyEventStatus } from "@/lib/panel/types";

export const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
  potential: "Potansiyel",
  approved: "Onaylı",
  archived: "Arşiv",
};

export const REVIEW_STATUS_BADGE: Record<ReviewStatus, "default" | "secondary" | "destructive" | "outline"> = {
  potential: "secondary",
  approved: "default",
  archived: "outline",
};

// venue_details.venue_type CHECK listesi (20260801130000_create_event_discovery_supply_schema.sql).
export const VENUE_TYPE_OPTIONS = ["bar", "club", "stage_cafe", "concert_hall", "other"] as const;
export type VenueType = (typeof VENUE_TYPE_OPTIONS)[number];

export const VENUE_TYPE_LABEL: Record<VenueType, string> = {
  bar: "Bar",
  club: "Kulüp",
  stage_cafe: "Sahneli kafe",
  concert_hall: "Konser salonu",
  other: "Diğer",
};

export const ENTRY_POLICY_OPTIONS = ["free", "door_fee", "reservation"] as const satisfies readonly EntryPolicy[];

export const ENTRY_POLICY_LABEL: Record<EntryPolicy, string> = {
  free: "Ücretsiz giriş",
  door_fee: "Kapıda ücret",
  reservation: "Rezervasyonla",
};

// artist_profiles.performer_type CHECK listesi.
export const PERFORMER_TYPE_OPTIONS = ["dj", "band", "solo", "acoustic", "other"] as const;
export type PerformerType = (typeof PERFORMER_TYPE_OPTIONS)[number];

export const PERFORMER_TYPE_LABEL: Record<PerformerType, string> = {
  dj: "DJ",
  band: "Grup",
  solo: "Solist",
  acoustic: "Akustik",
  other: "Diğer",
};

export const SUPPLY_EVENT_STATUS_LABEL: Record<SupplyEventStatus, string> = {
  draft: "Taslak",
  pending_counterparty: "Onay bekliyor",
  confirmed: "Onaylı",
  rejected: "Reddedildi",
  expired: "Süresi doldu",
  cancelled: "İptal edildi",
};

export const SUPPLY_EVENT_STATUS_BADGE: Record<SupplyEventStatus, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "outline",
  pending_counterparty: "secondary",
  confirmed: "default",
  rejected: "destructive",
  expired: "outline",
  cancelled: "destructive",
};

export const EVENT_KIND_LABEL: Record<EventKind, string> = {
  live_music: "Canlı müzik",
  dj: "DJ",
  karaoke: "Karaoke",
  quiz: "Quiz gecesi",
  theme_night: "Tema gecesi",
  other: "Diğer",
};

export const CLAIM_STATUS_LABEL: Record<ClaimStatus, string> = {
  unclaimed: "Sahiplenilmemiş",
  pending: "İnceleme bekliyor",
  claimed: "Sahiplenildi",
  verified: "Doğrulandı",
};

export const CLAIM_ROW_STATUS_LABEL: Record<ClaimRowStatus, string> = {
  pending: "Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
};

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Europe/Istanbul",
});

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return dateFormatter.format(new Date(iso));
  } catch {
    return iso;
  }
}
