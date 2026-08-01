"use server";

import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isEntityMember, getEntityKind } from "@/lib/panel/queries";
import { uniqueSlug } from "@/lib/panel/slug";
import { generateApprovalToken } from "@/lib/panel/tokens";
import type { EntryPolicy, EventKind } from "@/lib/panel/types";

type ServiceClient = ReturnType<typeof createServiceClient>;

const NO_ARTIST_KINDS: EventKind[] = ["karaoke", "quiz", "theme_night"];

// Etkinlik oluşturma (TASARIM §1/§2): mekan sanatçı seçer ya da hayalet
// sanatçı+davet kurar; sanatçı da simetrik olarak mekan seçer/hayalet mekan
// kurar. Sanatçısız türlerde (karaoke/quiz/tema gecesi) karşı taraf yok,
// etkinlik doğrudan 'confirmed' doğar (service_role — guard trigger'ın
// izin verdiği tek yol, TASARIM §3.2/§3.3).
//
// Tüm yazma tek bir service_role akışında yapılıyor: entities/artist_profiles/
// venue_details/contact_leads/invites için authenticated RLS zaten yetersiz
// (entities'te hiç insert policy'si yok — kasıtlı, bkz. migration), bu yüzden
// tutarlılık için supply_events insert'i de aynı akışta service client'la
// yapılıyor. Yetki kontrolü kodda: çağıran kullanıcı creatorEntityId'nin
// owner/manager/staff'ı mı — isEntityMember() ile doğrulanıyor.
export async function createSupplyEventAction(formData: FormData): Promise<void> {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");

  const creatorEntityId = String(formData.get("creatorEntityId") ?? "");
  if (!creatorEntityId) throw new Error("Hangi profil adına oluşturduğunuz belirtilmedi.");

  const member = await isEntityMember(user.id, creatorEntityId, ["owner", "manager", "staff"]);
  if (!member) throw new Error("Bu profil adına etkinlik oluşturma yetkiniz yok.");

  const creatorKind = await getEntityKind(creatorEntityId);
  if (!creatorKind) throw new Error("Profil bulunamadı.");
  const creatorSide: "venue" | "artist" = creatorKind === "venue" ? "venue" : "artist";

  const title = String(formData.get("title") ?? "").trim().slice(0, 200);
  const startAtRaw = String(formData.get("startAt") ?? "");
  const endAtRaw = String(formData.get("endAt") ?? "");
  const city = String(formData.get("city") ?? "Kayseri").trim().slice(0, 80) || "Kayseri";
  const district = String(formData.get("district") ?? "").trim().slice(0, 80) || null;
  const genres = String(formData.get("genres") ?? "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean)
    .slice(0, 10);
  const entryPolicy = (String(formData.get("entryPolicy") ?? "") || null) as EntryPolicy | null;
  const priceText = String(formData.get("priceText") ?? "").trim().slice(0, 200) || null;
  const description = String(formData.get("description") ?? "").trim().slice(0, 2000) || null;
  const eventKind = String(formData.get("eventKind") ?? "dj") as EventKind;
  const noArtist =
    formData.get("noArtist") === "on" && creatorSide === "venue" && NO_ARTIST_KINDS.includes(eventKind);

  if (!title) throw new Error("Başlık zorunludur.");
  const startAt = new Date(startAtRaw);
  if (Number.isNaN(startAt.getTime())) throw new Error("Geçerli bir tarih/saat girin.");
  const endAt = endAtRaw ? new Date(endAtRaw) : null;
  if (endAt && Number.isNaN(endAt.getTime())) throw new Error("Geçerli bir bitiş tarihi girin.");

  const supabase = createServiceClient();

  let venueEntityId: string;
  let artistEntityIds: string[] = [];
  let counterpartyEntityId: string | null = null;
  let counterpartyIsGhost = false;

  if (creatorSide === "venue") {
    venueEntityId = creatorEntityId;
    if (!noArtist) {
      const artist = await resolveCounterparty(supabase, "artist", formData, user.id);
      artistEntityIds = [artist.entityId];
      counterpartyEntityId = artist.entityId;
      counterpartyIsGhost = artist.isGhost;
    }
  } else {
    artistEntityIds = [creatorEntityId];
    const venue = await resolveCounterparty(supabase, "venue", formData, user.id);
    venueEntityId = venue.entityId;
    counterpartyEntityId = venue.entityId;
    counterpartyIsGhost = venue.isGhost;
  }

  const initialStatus = noArtist ? "confirmed" : "pending_counterparty";

  const { data: inserted, error } = await supabase
    .from("supply_events")
    .insert({
      title,
      venue_entity_id: venueEntityId,
      artist_entity_ids: artistEntityIds,
      start_at: startAt.toISOString(),
      end_at: endAt ? endAt.toISOString() : null,
      city,
      district,
      genres,
      entry_policy: entryPolicy,
      price_text: priceText,
      description,
      event_kind: eventKind,
      status: initialStatus,
      created_by_entity_id: creatorEntityId,
      created_by_side: creatorSide,
      counterparty_entity_id: counterpartyEntityId,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (!noArtist && counterpartyEntityId) {
    // Otomatik onay: karşı tarafın "bu profilden gelenleri otomatik onayla" kuralı var mı?
    const { data: rule } = await supabase
      .from("auto_approve_rules")
      .select("id")
      .eq("entity_id", counterpartyEntityId)
      .eq("trusted_entity_id", creatorEntityId)
      .maybeSingle();
    if (rule) {
      await supabase
        .from("supply_events")
        .update({ status: "confirmed" })
        .eq("id", inserted.id)
        .eq("status", "pending_counterparty");
    } else if (counterpartyIsGhost) {
      // Karşı taraf hayalet (henüz panelde hesabı yok) — hesapsız tek
      // kullanımlık onay linki üretilir (TASARIM §3.4) ve az önce oluşturulan
      // invites satırına bağlanır (invites.related_event_id).
      const { token, tokenHash } = generateApprovalToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from("approval_tokens").insert({
        supply_event_id: inserted.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });
      await supabase
        .from("invites")
        .update({ related_event_id: inserted.id })
        .eq("target_entity_id", counterpartyEntityId)
        .is("related_event_id", null);
      // NOT: token burada üretiliyor ama gerçek bir SMS/WhatsApp/e-posta
      // gönderim entegrasyonu YOK — bkz. final rapor "bilinçli eksik".
      // Bağlantı: `${NEXT_PUBLIC_URL}/onay/${token}`
    }
  }

  redirect("/panel/takvim?olusturuldu=1");
}

// Karşı taraf (mekan veya sanatçı) listeden seçilir; bulunamazsa hayalet
// profil + iletişim lead'i (contact_leads) + davet (invites) oluşturulur.
// contact_leads herkesin görebileceği bir yer DEĞİL — yalnız service_role/admin
// okuyabiliyor (RLS), KVKK izolasyonu migration'da bilinçli kuruldu.
async function resolveCounterparty(
  supabase: ServiceClient,
  kind: "venue" | "artist",
  formData: FormData,
  userId: string
): Promise<{ entityId: string; isGhost: boolean }> {
  const prefix = kind;
  const existingId = String(formData.get(`${prefix}ExistingId`) ?? "").trim();
  if (existingId) return { entityId: existingId, isGhost: false };

  const name = String(formData.get(`${prefix}NewName`) ?? "").trim().slice(0, 150);
  const instagram = String(formData.get(`${prefix}NewInstagram`) ?? "").trim().slice(0, 100) || null;
  const contactName = String(formData.get(`${prefix}ContactName`) ?? "").trim().slice(0, 150) || null;
  const contactPhone = String(formData.get(`${prefix}ContactPhone`) ?? "").trim().slice(0, 40) || null;
  const contactEmail = String(formData.get(`${prefix}ContactEmail`) ?? "").trim().slice(0, 200) || null;

  const label = kind === "venue" ? "Mekan" : "Sanatçı";
  if (!name) throw new Error(`${label} seçilmedi ve yeni ${label.toLowerCase()} adı girilmedi.`);
  if (!contactPhone && !contactEmail) {
    throw new Error("Yetkili iletişim bilgisi (telefon veya e-posta) zorunludur.");
  }

  const { data: entity, error: entityError } = await supabase
    .from("entities")
    .insert({ kind: kind === "venue" ? "venue" : "person" })
    .select("id")
    .single();
  if (entityError) throw new Error(entityError.message);

  if (kind === "venue") {
    const { error } = await supabase.from("venue_details").insert({
      entity_id: entity.id,
      name,
      slug: uniqueSlug(name),
      instagram_handle: instagram,
      claim_status: "unclaimed",
    });
    if (error) throw new Error(error.message);
  } else {
    const spotify = String(formData.get("artistNewSpotify") ?? "").trim().slice(0, 300) || null;
    const { error } = await supabase.from("artist_profiles").insert({
      entity_id: entity.id,
      entity_kind: "person",
      slug: uniqueSlug(name),
      display_name: name,
      links: {
        ...(instagram ? { instagram } : {}),
        ...(spotify ? { spotify } : {}),
      },
      claim_status: "unclaimed",
    });
    if (error) throw new Error(error.message);
  }

  await supabase.from("contact_leads").insert({
    entity_id: entity.id,
    contact_name: contactName,
    contact_phone: contactPhone,
    contact_email: contactEmail,
    is_business_contact: true,
    provided_by_user_id: userId,
    purpose: "claim_invite",
  });

  await supabase.from("invites").insert({
    target_entity_id: entity.id,
    invited_via: contactPhone ? "whatsapp" : "email",
    sent_to: contactPhone ?? contactEmail ?? "bilinmiyor",
  });

  return { entityId: entity.id, isGhost: true };
}
