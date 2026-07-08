"use server";

import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

type TokenTarget = { idField: "event_project_id" | "booking_id"; id: string };

async function resolveTokenTarget(token: string): Promise<TokenTarget | null> {
  const supabase = createServiceClient();
  const { data: project } = await supabase.from("event_projects").select("id").eq("checklist_token", token).single();
  if (project) return { idField: "event_project_id", id: project.id };

  const { data: booking } = await supabase.from("bookings").select("id").eq("checklist_token", token).single();
  if (booking) return { idField: "booking_id", id: booking.id };

  return null;
}

export async function toggleItem(token: string, itemId: string, done: boolean) {
  const target = await resolveTokenTarget(token);
  if (!target) throw new Error("Geçersiz link.");

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("checklist_items")
    .update({
      is_done: done,
      done_by: done ? "client" : null,
      done_at: done ? new Date().toISOString() : null,
    })
    .eq("id", itemId)
    .eq(target.idField, target.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/planlama/${token}`);
}

export async function addComment(token: string, itemId: string, authorName: string, body: string) {
  const target = await resolveTokenTarget(token);
  if (!target) throw new Error("Geçersiz link.");
  if (!body.trim()) throw new Error("Yorum boş olamaz.");

  const supabase = createServiceClient();
  const { data: item } = await supabase.from("checklist_items").select("id").eq("id", itemId).eq(target.idField, target.id).single();
  if (!item) throw new Error("Madde bulunamadı.");

  const { error } = await supabase.from("checklist_comments").insert({
    item_id: itemId,
    [target.idField]: target.id,
    author_type: "client",
    author_name: authorName.trim() || null,
    body: body.trim(),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/planlama/${token}`);
}
