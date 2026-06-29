"use server";

import { createServiceClient } from "@/lib/supabase";
import { redirect } from "next/navigation";

export async function upsertInvitation(formData: FormData) {
  const id = formData.get("id") as string | null;
  const payload = {
    slug: (formData.get("slug") as string).trim().toLowerCase(),
    template: formData.get("template") as string,
    bride_name: (formData.get("bride_name") as string).trim(),
    groom_name: (formData.get("groom_name") as string).trim(),
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
    memory_drive_url: (formData.get("memory_drive_url") as string) || null,
    seating_plan_url: (formData.get("seating_plan_url") as string) || null,
    seating_tables: (() => {
      try { return JSON.parse(formData.get("seating_tables") as string); } catch { return null; }
    })(),
  };

  const supabase = createServiceClient();
  const createMemoryDrive = formData.get("create_memory_drive") === "on";

  if (id) {
    await supabase.from("invitations").update(payload).eq("id", id);
  } else {
    const { data: inserted } = await supabase.from("invitations").insert(payload).select("id, slug").single();

    if (inserted && createMemoryDrive) {
      const memorySlug = inserted.slug;
      const memoryUrl = `https://www.noqt.events/memory/${memorySlug}`;
      const { data: memEvent } = await supabase.from("memory_events").insert({
        slug: memorySlug,
        title: `${payload.bride_name} & ${payload.groom_name}`,
        invitation_id: inserted.id,
        is_active: true,
      }).select("id").single();

      if (memEvent) {
        await supabase.from("invitations").update({ memory_drive_url: memoryUrl }).eq("id", inserted.id);
      }
    }
  }
  redirect("/admin/davetiyeler");
}

export async function deleteInvitation(id: string) {
  const supabase = createServiceClient();
  await supabase.from("invitations").delete().eq("id", id);
  redirect("/admin/davetiyeler");
}
