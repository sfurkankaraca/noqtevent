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

// İçe aktarım (scripts/supply-import/import-external.mjs) sonrası "potential"
// sekmesi yüzlerce satıra çıkabiliyor — tek sayfada hepsini basmak yerine
// sabit boyutlu sayfalarla getiriyoruz (bkz. AdminListResult).
export const ADMIN_LIST_PAGE_SIZE = 50;

export interface AdminListResult<T> {
  rows: T[];
  total: number;
  page: number; // 1-tabanlı
  pageSize: number;
}

export interface VenueAdminFilters {
  reviewStatus: "potential" | "approved" | "archived";
  published?: "all" | "published" | "hidden"; // yalnız approved sekmesinde anlamlı
  claimStatus?: "all" | VenueDetailsRow["claim_status"];
  // 20260802160000_add_venue_city.sql öncesi tüm içe aktarılan mekanlarda
  // district hep NULL'du (yalnız Kayseri seed'inde vardı) — bu filtre o
  // yüzden pratikte işlevsizdi. city artık AYRI ve birincil coğrafi filtre;
  // district Kayseri'nin kendi içindeki ilçeler için hâlâ kullanışlı.
  city?: string; // "all" veya tam eşleşme
  district?: string; // "all" veya tam eşleşme
  search?: string; // mekan adında serbest metin arama (ilike)
  page?: number; // 1-tabanlı, varsayılan 1
}

export async function getAllVenuesAdmin(filters: VenueAdminFilters): Promise<AdminListResult<VenueDetailsRow>> {
  const supabase = createServiceClient();
  const page = Math.max(1, Math.trunc(filters.page ?? 1));
  const from = (page - 1) * ADMIN_LIST_PAGE_SIZE;
  const to = from + ADMIN_LIST_PAGE_SIZE - 1;

  let q = supabase
    .from("venue_details")
    .select("*", { count: "exact" })
    .eq("review_status", filters.reviewStatus)
    .order("name", { ascending: true })
    .range(from, to);

  if (filters.published === "published") q = q.eq("is_published", true);
  if (filters.published === "hidden") q = q.eq("is_published", false);
  if (filters.claimStatus && filters.claimStatus !== "all") q = q.eq("claim_status", filters.claimStatus);
  if (filters.city && filters.city !== "all") q = q.eq("city", filters.city);
  if (filters.district && filters.district !== "all") q = q.eq("district", filters.district);
  if (filters.search && filters.search.trim()) q = q.ilike("name", `%${filters.search.trim()}%`);

  const { data, error, count } = await q;
  if (error) throw new Error(error.message);
  return { rows: data ?? [], total: count ?? 0, page, pageSize: ADMIN_LIST_PAGE_SIZE };
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

// 20260802160000_add_venue_city.sql — şehir bazlı filtre (import-external.mjs
// artık şehri doğru yazıyor; getDistinctVenueDistricts'in AYNISI, city için).
export async function getDistinctVenueCities(): Promise<string[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("venue_details").select("city").not("city", "is", null);
  if (error) throw new Error(error.message);
  const set = new Set((data ?? []).map((r) => r.city as string).filter(Boolean));
  return Array.from(set).sort((a, b) => a.localeCompare(b, "tr"));
}

// ── Sanatçı yönetimi (/panel/admin/sanatcilar) ──────────────────────────────

export interface ArtistAdminFilters {
  reviewStatus: "potential" | "approved" | "archived";
  published?: "all" | "published" | "hidden"; // yalnız approved sekmesinde anlamlı
  claimStatus?: "all" | ArtistProfileRow["claim_status"];
  search?: string; // sanatçı adında serbest metin arama (ilike)
  page?: number; // 1-tabanlı, varsayılan 1
}

export async function getAllArtistsAdmin(filters: ArtistAdminFilters): Promise<AdminListResult<ArtistProfileRow>> {
  const supabase = createServiceClient();
  const page = Math.max(1, Math.trunc(filters.page ?? 1));
  const from = (page - 1) * ADMIN_LIST_PAGE_SIZE;
  const to = from + ADMIN_LIST_PAGE_SIZE - 1;

  let q = supabase
    .from("artist_profiles")
    .select("*", { count: "exact" })
    .eq("review_status", filters.reviewStatus)
    .order("display_name", { ascending: true })
    .range(from, to);

  if (filters.published === "published") q = q.eq("is_published", true);
  if (filters.published === "hidden") q = q.eq("is_published", false);
  if (filters.claimStatus && filters.claimStatus !== "all") q = q.eq("claim_status", filters.claimStatus);
  if (filters.search && filters.search.trim()) q = q.ilike("display_name", `%${filters.search.trim()}%`);

  const { data, error, count } = await q;
  if (error) throw new Error(error.message);
  return { rows: data ?? [], total: count ?? 0, page, pageSize: ADMIN_LIST_PAGE_SIZE };
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
