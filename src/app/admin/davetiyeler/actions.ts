"use server";

import { requireAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

const BASE_URL = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";

// "https://www.noqt.events/memory/ayse-ali" veya sadece "ayse-ali" girilebilir
function extractMemorySlug(raw: string): string {
  const trimmed = raw.trim();
  const match = trimmed.match(/\/memory\/([a-z0-9-]+)/i);
  return (match ? match[1] : trimmed).toLowerCase();
}

export async function upsertInvitation(formData: FormData): Promise<{ id: string }> {
  await requireAdmin();
  const id = formData.get("id") as string | null;

  const slug = (formData.get("slug") as string).trim().toLowerCase();
  const bride_name = (formData.get("bride_name") as string).trim();
  const groom_name = (formData.get("groom_name") as string).trim();
  if (!slug) throw new Error("URL (slug) zorunludur.");
  if (!bride_name || !groom_name) throw new Error("Gelin ve damat adı zorunludur.");

  const payload = {
    slug,
    template: formData.get("template") as string,
    bride_name,
    groom_name,
    couple_email: (formData.get("couple_email") as string)?.trim() || null,
    wedding_date: (formData.get("wedding_date") as string) || null,
    wedding_time: (formData.get("wedding_time") as string) || null,
    venue_name: (formData.get("venue_name") as string) || null,
    venue_address: (formData.get("venue_address") as string) || null,
    venue_maps_url: (formData.get("venue_maps_url") as string) || null,
    story: (formData.get("story") as string) || null,
    cover_photo_url: (formData.get("cover_photo_url") as string) || null,
    music_note: (formData.get("music_note") as string) || null,
    dress_code: (formData.get("dress_code") as string) || null,
    rsvp_deadline: (formData.get("rsvp_deadline") as string) || null,
    rsvp_enabled: formData.get("rsvp_enabled") === "on",
    is_active: formData.get("is_active") === "on",
    // Mevcut değer korunur — aşağıdaki Memory Drive bloğu gerekirse günceller.
    // Bu alan için görünür bir input yok; önceden hiç okunmuyordu ve her
    // kayıtta bağlantı sessizce sıfırlanıyordu (bkz. existing_memory_drive_url).
    memory_drive_url: (formData.get("existing_memory_drive_url") as string) || null,
    seating_plan_url: (formData.get("seating_plan_url") as string) || null,
    seating_tables: (() => {
      try { return JSON.parse(formData.get("seating_tables") as string); } catch { return null; }
    })(),
  };

  const supabase = createServiceClient();

  // Sonucu iş öncesi bilinen id ile devam ettirebilmek için değişken
  let invitationId = id;

  // couple_email migration'a bağlı; sütun yoksa o alanı atlayıp tekrar dener
  const { couple_email, ...payloadNoEmail } = payload;
  const isMissingCol = (msg?: string) => !!msg && msg.includes("couple_email");

  if (id) {
    let { error } = await supabase.from("invitations").update(payload).eq("id", id);
    if (error && isMissingCol(error.message)) {
      ({ error } = await supabase.from("invitations").update(payloadNoEmail).eq("id", id));
    }
    if (error) {
      throw new Error(
        error.code === "23505" ? `Bu URL (${slug}) zaten kullanımda. Farklı bir slug deneyin.` : error.message
      );
    }
  } else {
    let { data: inserted, error } = await supabase.from("invitations").insert(payload).select("id").single();
    if (error && isMissingCol(error.message)) {
      ({ data: inserted, error } = await supabase.from("invitations").insert(payloadNoEmail).select("id").single());
    }
    if (error || !inserted) {
      throw new Error(
        error?.code === "23505" ? `Bu URL (${slug}) zaten kullanımda. Farklı bir slug deneyin.` : error?.message ?? "Davetiye oluşturulamadı."
      );
    }
    invitationId = inserted.id;
  }

  // Memory Drive: ya yeni oluştur ya da mevcut bir etkinliğe bağla.
  // Zaten bağlıysa (payload.memory_drive_url doluysa) hiçbir şey yapma.
  const createMemoryDrive = formData.get("create_memory_drive") === "on";
  const manualMemoryInput = (formData.get("memory_drive_manual") as string)?.trim();

  if (!payload.memory_drive_url && createMemoryDrive) {
    const memoryUrl = `${BASE_URL}/memory/${slug}`;
    const memBase = {
      slug,
      title: `${bride_name} & ${groom_name}`,
      invitation_id: invitationId,
      is_active: true,
    };
    let { error: memError } = await supabase.from("memory_events").insert({ ...memBase, couple_email });
    if (memError && memError.message.includes("couple_email")) {
      ({ error: memError } = await supabase.from("memory_events").insert(memBase));
    }
    if (memError) {
      throw new Error(
        memError.code === "23505"
          ? `Memory Drive oluşturulamadı: "${slug}" slug'ı zaten başka bir etkinlikte kullanılıyor.`
          : `Memory Drive oluşturulamadı: ${memError.message}`
      );
    }
    await supabase.from("invitations").update({ memory_drive_url: memoryUrl }).eq("id", invitationId);
  } else if (!payload.memory_drive_url && manualMemoryInput) {
    const memorySlug = extractMemorySlug(manualMemoryInput);
    const { data: existingEvent, error: lookupError } = await supabase
      .from("memory_events")
      .select("id")
      .eq("slug", memorySlug)
      .single();
    if (lookupError || !existingEvent) {
      throw new Error(`"${memorySlug}" slug'ında bir Memory Drive etkinliği bulunamadı. Önce Memory Drive panelinden oluşturun.`);
    }
    await supabase
      .from("memory_events")
      .update({ invitation_id: invitationId })
      .eq("id", existingEvent.id);
    await supabase
      .from("invitations")
      .update({ memory_drive_url: `${BASE_URL}/memory/${memorySlug}` })
      .eq("id", invitationId);
  }

  revalidatePath("/admin/davetiyeler");
  revalidatePath(`/admin/davetiyeler/${invitationId}/edit`);
  return { id: invitationId! };
}

export async function deleteInvitation(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase.from("invitations").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/davetiyeler");
}
