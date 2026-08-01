import { createServiceClient } from "@/lib/supabase";
import type {
  ArtistProfileRow,
  ClaimRow,
  EntityMemberRow,
  MyEntitySummary,
  SupplyEventRow,
  VenueDetailsRow,
} from "@/lib/panel/types";

// Bu dosyadaki tüm okumalar service_role client'la yapılır (RLS bypass).
// Sebep: entity_members/artist_profiles/venue_details/supply_events'in RLS
// politikaları auth.uid() üzerinden çalışıyor ve tek tek satır bazında doğru
// olsa da, panelin ihtiyaç duyduğu çapraz-tablo birleştirmeleri (hangi
// entity'nin adı ne, hangi supply_event'in karşı tarafı kim) PostgREST embed
// güvenilirliği yerine kodda açık filtre + service client ile daha sağlam
// kuruluyor. Yetki kontrolü BURADA, kod içinde, çağıran taraf her fonksiyona
// yalnız kendi doğrulanmış user id'sini geçirerek yapılıyor — bkz.
// src/lib/panel/supabaseServer.ts getPanelUser() (Supabase Auth'a doğrulatır).
// Herkese açık aramalar (searchVenues/searchArtists) zaten public RLS
// politikasına sahip; service client burada yalnız kod tekdüzeliği için.

export async function getMyEntityMemberships(userId: string): Promise<EntityMemberRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("entity_members")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Kullanıcının üyesi olduğu entity'lerin görünen adı + türü + claim durumuyla
// birlikte özet listesi.
export async function getMyEntities(userId: string): Promise<MyEntitySummary[]> {
  const memberships = await getMyEntityMemberships(userId);
  if (memberships.length === 0) return [];

  const supabase = createServiceClient();
  const entityIds = memberships.map((m) => m.entity_id);

  const [{ data: entities }, { data: venues }, { data: artists }] = await Promise.all([
    supabase.from("entities").select("id, kind").in("id", entityIds),
    supabase.from("venue_details").select("entity_id, name, claim_status").in("entity_id", entityIds),
    supabase.from("artist_profiles").select("entity_id, display_name, claim_status").in("entity_id", entityIds),
  ]);

  const kindById = new Map((entities ?? []).map((e) => [e.id, e.kind as "person" | "organization" | "venue"]));
  const venueById = new Map((venues ?? []).map((v) => [v.entity_id, v]));
  const artistById = new Map((artists ?? []).map((a) => [a.entity_id, a]));

  return memberships.map((m) => {
    const kind = kindById.get(m.entity_id) ?? "venue";
    const venue = venueById.get(m.entity_id);
    const artist = artistById.get(m.entity_id);
    return {
      entityId: m.entity_id,
      kind,
      memberRole: m.member_role,
      displayName: venue?.name ?? artist?.display_name ?? "(isimsiz profil)",
      claimStatus: venue?.claim_status ?? artist?.claim_status ?? "unclaimed",
    };
  });
}

export async function isEntityMember(
  userId: string,
  entityId: string,
  roles: EntityMemberRow["member_role"][] = ["owner", "manager", "staff"]
): Promise<boolean> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("entity_members")
    .select("member_role")
    .eq("user_id", userId)
    .eq("entity_id", entityId)
    .in("member_role", roles)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return !!data;
}

export async function getEntityKind(entityId: string): Promise<"person" | "organization" | "venue" | null> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("entities").select("kind").eq("id", entityId).maybeSingle();
  return (data?.kind as "person" | "organization" | "venue" | undefined) ?? null;
}

export async function getEntityDisplayName(entityId: string, kind: "person" | "organization" | "venue"): Promise<string> {
  const supabase = createServiceClient();
  if (kind === "venue") {
    const { data } = await supabase.from("venue_details").select("name").eq("entity_id", entityId).maybeSingle();
    return data?.name ?? "(isimsiz mekan)";
  }
  const { data } = await supabase.from("artist_profiles").select("display_name").eq("entity_id", entityId).maybeSingle();
  return data?.display_name ?? "(isimsiz sanatçı)";
}

export async function getSupplyEventsForEntities(entityIds: string[]): Promise<SupplyEventRow[]> {
  if (entityIds.length === 0) return [];
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("supply_events")
    .select("*")
    .or(
      `created_by_entity_id.in.(${entityIds.join(",")}),counterparty_entity_id.in.(${entityIds.join(",")})`
    )
    .order("start_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPendingApprovalsForEntities(entityIds: string[]): Promise<SupplyEventRow[]> {
  if (entityIds.length === 0) return [];
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("supply_events")
    .select("*")
    .in("counterparty_entity_id", entityIds)
    .eq("status", "pending_counterparty")
    .order("start_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getSupplyEventById(id: string): Promise<SupplyEventRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("supply_events").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function searchVenues(query: string, limit = 25): Promise<VenueDetailsRow[]> {
  const supabase = createServiceClient();
  let q = supabase.from("venue_details").select("*").order("name", { ascending: true }).limit(limit);
  if (query.trim()) q = q.ilike("name", `%${query.trim()}%`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function searchArtists(query: string, limit = 25): Promise<ArtistProfileRow[]> {
  const supabase = createServiceClient();
  let q = supabase.from("artist_profiles").select("*").order("display_name", { ascending: true }).limit(limit);
  if (query.trim()) q = q.ilike("display_name", `%${query.trim()}%`);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getLatestClaimForUserEntity(userId: string, entityId: string): Promise<ClaimRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("claims")
    .select("*")
    .eq("claimant_user_id", userId)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getVenueByEntityId(entityId: string): Promise<VenueDetailsRow | null> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("venue_details").select("*").eq("entity_id", entityId).maybeSingle();
  return data;
}

export async function getArtistByEntityId(entityId: string): Promise<ArtistProfileRow | null> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("artist_profiles").select("*").eq("entity_id", entityId).maybeSingle();
  return data;
}
