import { createServiceClient } from "@/lib/supabase";
import type { ArtistProfileRow, ClaimRow, InviteRow, SupplyEventRow, VenueDetailsRow } from "@/lib/panel/types";

// Admin okuma yardımcıları — çağrılmadan önce requirePanelAdminUser() ile
// kapı kontrolü YAPILMIŞ olmalı (bu dosya kendi içinde kontrol etmez).

export async function getPendingClaims(): Promise<ClaimRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("claims")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPendingSupplyEvents(): Promise<SupplyEventRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("supply_events")
    .select("*")
    .eq("status", "pending_counterparty")
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getRecentInvites(limit = 100): Promise<InviteRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("invites")
    .select("*")
    .order("sent_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface AdminCounts {
  venues: number;
  artists: number;
  confirmedEvents: number;
  pendingEvents: number;
  pendingClaims: number;
  invitesSent: number;
  unpublishedVenues: number;
  unpublishedArtists: number;
  potentialVenues: number;
  potentialArtists: number;
}

export async function getAdminCounts(): Promise<AdminCounts> {
  const supabase = createServiceClient();
  const [
    venues,
    artists,
    confirmedEvents,
    pendingEvents,
    pendingClaims,
    invitesSent,
    unpublishedVenues,
    unpublishedArtists,
    potentialVenues,
    potentialArtists,
  ] = await Promise.all([
    supabase.from("venue_details").select("*", { count: "exact", head: true }),
    supabase.from("artist_profiles").select("*", { count: "exact", head: true }),
    supabase.from("supply_events").select("*", { count: "exact", head: true }).eq("status", "confirmed"),
    supabase.from("supply_events").select("*", { count: "exact", head: true }).eq("status", "pending_counterparty"),
    supabase.from("claims").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("invites").select("*", { count: "exact", head: true }),
    supabase.from("venue_details").select("*", { count: "exact", head: true }).eq("is_published", false),
    supabase.from("artist_profiles").select("*", { count: "exact", head: true }).eq("is_published", false),
    supabase.from("venue_details").select("*", { count: "exact", head: true }).eq("review_status", "potential"),
    supabase.from("artist_profiles").select("*", { count: "exact", head: true }).eq("review_status", "potential"),
  ]);
  return {
    venues: venues.count ?? 0,
    artists: artists.count ?? 0,
    confirmedEvents: confirmedEvents.count ?? 0,
    pendingEvents: pendingEvents.count ?? 0,
    pendingClaims: pendingClaims.count ?? 0,
    invitesSent: invitesSent.count ?? 0,
    unpublishedVenues: unpublishedVenues.count ?? 0,
    unpublishedArtists: unpublishedArtists.count ?? 0,
    potentialVenues: potentialVenues.count ?? 0,
    potentialArtists: potentialArtists.count ?? 0,
  };
}

// ── Mekan yönetimi (/panel/admin/mekanlar) ──────────────────────────────────
// requirePanelAdminUser() çağrıldıktan SONRA kullanılmalı — bu dosya kendi
// içinde kapı kontrolü yapmaz (bkz. dosya başındaki not).
//
// review_status (20260801160000_add_supply_review_status.sql) üç sekmeyi
// belirler: potential (kurucunun iş kuyruğu) / approved (yayın adayı havuzu) /
// archived. is_published YALNIZ approved sekmesinde anlamlı — DB CHECK
// (NOT is_published OR review_status = 'approved') diğer sekmelerde yayın
// denemesini zaten reddeder; UI de bu yüzden toggle'ı yalnız approved'ta gösterir.

export interface VenueAdminFilters {
  reviewStatus: "potential" | "approved" | "archived";
  published?: "all" | "published" | "hidden"; // yalnız approved sekmesinde anlamlı
  claimStatus?: "all" | VenueDetailsRow["claim_status"];
  district?: string; // "all" veya tam eşleşme
}

export async function getAllVenuesAdmin(filters: VenueAdminFilters): Promise<VenueDetailsRow[]> {
  const supabase = createServiceClient();
  let q = supabase.from("venue_details").select("*").eq("review_status", filters.reviewStatus).order("name", { ascending: true });

  if (filters.published === "published") q = q.eq("is_published", true);
  if (filters.published === "hidden") q = q.eq("is_published", false);
  if (filters.claimStatus && filters.claimStatus !== "all") q = q.eq("claim_status", filters.claimStatus);
  if (filters.district && filters.district !== "all") q = q.eq("district", filters.district);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export interface ReviewStatusCounts {
  potential: number;
  approved: number;
  archived: number;
}

export async function getVenueReviewStatusCounts(): Promise<ReviewStatusCounts> {
  const supabase = createServiceClient();
  const [potential, approved, archived] = await Promise.all([
    supabase.from("venue_details").select("*", { count: "exact", head: true }).eq("review_status", "potential"),
    supabase.from("venue_details").select("*", { count: "exact", head: true }).eq("review_status", "approved"),
    supabase.from("venue_details").select("*", { count: "exact", head: true }).eq("review_status", "archived"),
  ]);
  return { potential: potential.count ?? 0, approved: approved.count ?? 0, archived: archived.count ?? 0 };
}

// Filtre dropdown'u için: veritabanında fiilen kullanılan ilçe değerleri
// (sabit bir liste tutmak yerine — seed verisiyle birlikte otomatik güncel kalır).
export async function getDistinctVenueDistricts(): Promise<string[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("venue_details").select("district").not("district", "is", null);
  if (error) throw new Error(error.message);
  const set = new Set((data ?? []).map((r) => r.district as string).filter(Boolean));
  return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
}

// ── Sanatçı yönetimi (/panel/admin/sanatcilar) ──────────────────────────────

export interface ArtistAdminFilters {
  reviewStatus: "potential" | "approved" | "archived";
  published?: "all" | "published" | "hidden"; // yalnız approved sekmesinde anlamlı
  claimStatus?: "all" | ArtistProfileRow["claim_status"];
}

export async function getAllArtistsAdmin(filters: ArtistAdminFilters): Promise<ArtistProfileRow[]> {
  const supabase = createServiceClient();
  let q = supabase
    .from("artist_profiles")
    .select("*")
    .eq("review_status", filters.reviewStatus)
    .order("display_name", { ascending: true });

  if (filters.published === "published") q = q.eq("is_published", true);
  if (filters.published === "hidden") q = q.eq("is_published", false);
  if (filters.claimStatus && filters.claimStatus !== "all") q = q.eq("claim_status", filters.claimStatus);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getArtistReviewStatusCounts(): Promise<ReviewStatusCounts> {
  const supabase = createServiceClient();
  const [potential, approved, archived] = await Promise.all([
    supabase.from("artist_profiles").select("*", { count: "exact", head: true }).eq("review_status", "potential"),
    supabase.from("artist_profiles").select("*", { count: "exact", head: true }).eq("review_status", "approved"),
    supabase.from("artist_profiles").select("*", { count: "exact", head: true }).eq("review_status", "archived"),
  ]);
  return { potential: potential.count ?? 0, approved: approved.count ?? 0, archived: archived.count ?? 0 };
}
