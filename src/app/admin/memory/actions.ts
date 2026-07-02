"use server";

import { requireAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { deleteFromR2 } from "@/lib/r2";
import { redirect } from "next/navigation";

export async function upsertMemoryEvent(formData: FormData) {
  await requireAdmin();
  const id = formData.get("id") as string | null;
  const payload = {
    slug: (formData.get("slug") as string).trim().toLowerCase(),
    title: (formData.get("title") as string).trim(),
    description: (formData.get("description") as string) || null,
    invitation_id: (formData.get("invitation_id") as string) || null,
    is_active: formData.get("is_active") === "on",
  };

  const supabase = createServiceClient();
  if (id) {
    await supabase.from("memory_events").update(payload).eq("id", id);
  } else {
    await supabase.from("memory_events").insert(payload);
  }
  redirect("/admin/memory");
}

export async function deleteMemoryEvent(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  await supabase.from("memory_events").delete().eq("id", id);
  redirect("/admin/memory");
}

export async function deleteUpload(id: string, filePath: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  await deleteFromR2(filePath);
  await supabase.from("memory_uploads").delete().eq("id", id);
}
