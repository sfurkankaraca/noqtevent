// Panel (mekan/sanatçı/admin) veri tipleri — supabase/migrations/20260801130000_create_event_discovery_supply_schema.sql
// şemasının TypeScript karşılığı. Yalnız panelin kullandığı alanlar taşınır.

export type EntityKind = "person" | "organization" | "venue";
export type ClaimStatus = "unclaimed" | "pending" | "claimed" | "verified";
// 20260801160000_add_supply_review_status.sql — kurucu kürasyon kuyruğu.
// DB CHECK: NOT is_published OR review_status = 'approved' (yalnız approved
// yayınlanabilir; arşivlerken is_published=false ile birlikte yazılmalı).
export type ReviewStatus = "potential" | "approved" | "archived";
export type MemberRole = "owner" | "manager" | "staff";
export type EventKind = "live_music" | "dj" | "karaoke" | "quiz" | "theme_night" | "other";
export type EntryPolicy = "free" | "door_fee" | "reservation";
export type SupplyEventStatus =
  | "draft"
  | "pending_counterparty"
  | "confirmed"
  | "rejected"
  | "expired"
  | "cancelled";
export type CreatedBySide = "artist" | "venue" | "organizer";
export type ClaimMethod = "ig_dm_code" | "phone_code" | "manual" | "youtube_oauth";
export type ClaimRowStatus = "pending" | "approved" | "rejected";
export type RoleSide = "venue" | "artist" | "manager";

// 20260807190000_add_native_video_assets.sql — Mux native video yaşam
// döngüsü (bkz. lib/panel/mux.ts). "ready" olan girdiler AYRICA video_urls'e
// (stream.mux.com adresiyle) yazılır — bu tip yalnız yükleme/işleme
// DURUMUNU takip eder, oynatma kaynağı DEĞİLDİR.
export interface VideoAssetRow {
  uploadId: string;
  assetId: string | null;
  playbackId: string | null;
  status: "uploading" | "processing" | "ready" | "errored" | "rejected_duration";
  durationSeconds: number | null;
  createdAt: string;
}

export interface EntityRow {
  id: string;
  kind: EntityKind;
  created_at: string;
}

export interface VenueDetailsRow {
  entity_id: string;
  entity_kind: "venue";
  name: string;
  address: string | null;
  slug: string | null;
  // 20260802160000_add_venue_city.sql — daha önce YOKTU (import-external.mjs
  // içe aktarılan mekanların şehrini sessizce düşürüyordu, bkz. migration
  // yorumu). district ondan bağımsız (Kayseri içi ilçeler için) ayrı alan.
  city: string | null;
  district: string | null;
  venue_type: string | null;
  capacity: number | null;
  entry_policy: EntryPolicy | null;
  instagram_handle: string | null;
  google_maps_phone: string | null;
  photo_urls: string[];
  // 20260802090000_add_supply_media_gallery.sql — mekan video galerisi.
  video_urls: string[];
  // 20260807190000_add_native_video_assets.sql
  video_assets: VideoAssetRow[];
  // 20260802150000_add_venue_google_enrichment.sql — panel "Google'dan doldur".
  google_place_id: string | null;
  google_rating: number | null;
  google_ratings_total: number | null;
  enriched_at: string | null;
  claim_status: ClaimStatus;
  // 20260801150000_add_supply_publish_flags.sql — varsayılan false; kurucu
  // panelden bilinçli olarak yayınlar. Sync worker yalnız true olanları projekte eder.
  is_published: boolean;
  // 20260801160000_add_supply_review_status.sql — varsayılan 'potential'.
  review_status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export interface ArtistProfileRow {
  id: string;
  entity_id: string;
  entity_kind: "person" | "organization";
  slug: string;
  display_name: string;
  bio: string | null;
  photo_url: string | null;
  // 20260802090000_add_supply_media_gallery.sql — kapak (photo_url) ile ayrı,
  // sanatçı medya galerisi.
  photo_urls: string[];
  video_urls: string[];
  // 20260807190000_add_native_video_assets.sql
  video_assets: VideoAssetRow[];
  city: string | null;
  genres: string[];
  performer_type: string;
  links: { instagram?: string; spotify?: string; youtube?: string; soundcloud?: string };
  // Şemada baştan beri vardı (20260801130000) ama bu tipte eksikti — panel
  // Spotify/YouTube zenginleştirme özelliği (bkz. ArtistEnrich.tsx) eklenirken
  // tamamlandı.
  spotify_artist_id: string | null;
  youtube_channel_id: string | null;
  // 20260802140000_add_artist_spotify_enrichment.sql
  spotify_popularity: number | null;
  spotify_followers: number | null;
  enriched_at: string | null;
  claim_status: ClaimStatus;
  managed_by_manager: boolean;
  // 20260801150000_add_supply_publish_flags.sql — bkz. VenueDetailsRow.is_published notu.
  is_published: boolean;
  // 20260801160000_add_supply_review_status.sql — varsayılan 'potential'.
  review_status: ReviewStatus;
  created_at: string;
  updated_at: string;
}

export interface EntityMemberRow {
  id: string;
  entity_id: string;
  user_id: string;
  member_role: MemberRole;
  invited_by: string | null;
  created_at: string;
}

export interface SupplyEventRow {
  id: string;
  title: string;
  venue_entity_id: string;
  artist_entity_ids: string[];
  start_at: string;
  end_at: string | null;
  city: string;
  district: string | null;
  genres: string[];
  entry_policy: EntryPolicy | null;
  price_text: string | null;
  description: string | null;
  event_kind: EventKind;
  status: SupplyEventStatus;
  created_by_entity_id: string;
  created_by_side: CreatedBySide;
  counterparty_entity_id: string | null;
  confirmed_at: string | null;
  rejected_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClaimRow {
  id: string;
  entity_id: string;
  claimant_user_id: string;
  method: ClaimMethod;
  code: string | null;
  code_sent_to: string | null;
  status: ClaimRowStatus;
  reviewed_by: string | null;
  notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface InviteRow {
  id: string;
  target_entity_id: string;
  invited_via: "sms" | "whatsapp" | "ig" | "email";
  sent_to: string;
  sent_at: string;
  clicked_at: string | null;
  claimed_at: string | null;
  related_event_id: string | null;
  created_at: string;
}

// Panel içi UI için: "kimin hangi profili" — entity_members + görünen ad birleşimi.
export interface MyEntitySummary {
  entityId: string;
  kind: EntityKind;
  memberRole: MemberRole;
  displayName: string;
  claimStatus: ClaimStatus;
}
