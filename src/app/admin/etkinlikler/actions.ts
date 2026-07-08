"use server";

import { requireAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function updateEventProjectStatus(id: string, status: "planning" | "active" | "completed") {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase.from("event_projects").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/etkinlikler/${id}`);
  revalidatePath("/admin/etkinlikler");
}
