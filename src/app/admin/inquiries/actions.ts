"use server";

import { requireAdmin } from "@/lib/adminAuth";
import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase";

export async function updateInquiryStatus(id: string, status: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  await supabase.from("inquiries").update({ status }).eq("id", id);
  revalidatePath(`/admin/inquiries/${id}`);
  revalidatePath("/admin/inquiries");
}

export async function updateAdminNotes(id: string, admin_notes: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  await supabase.from("inquiries").update({ admin_notes }).eq("id", id);
  revalidatePath(`/admin/inquiries/${id}`);
}

export async function assignDj(id: string, dj_id: string | null) {
  await requireAdmin();
  const supabase = createServiceClient();
  await supabase.from("inquiries").update({ assigned_dj_id: dj_id || null }).eq("id", id);
  revalidatePath(`/admin/inquiries/${id}`);
}

export async function deleteInquiry(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  await supabase.from("inquiries").delete().eq("id", id);
  revalidatePath("/admin/inquiries");
}
