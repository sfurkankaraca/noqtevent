"use server";

import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

async function bookingIdForToken(token: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("bookings").select("id").eq("checklist_token", token).single();
  return data?.id ?? null;
}

export async function toggleItem(token: string, itemId: string, done: boolean) {
  const bookingId = await bookingIdForToken(token);
  if (!bookingId) throw new Error("Geçersiz link.");

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("checklist_items")
    .update({
      is_done: done,
      done_by: done ? "client" : null,
      done_at: done ? new Date().toISOString() : null,
    })
    .eq("id", itemId)
    .eq("booking_id", bookingId);
  if (error) throw new Error(error.message);
  revalidatePath(`/planlama/${token}`);
}

export async function addComment(token: string, itemId: string, authorName: string, body: string) {
  const bookingId = await bookingIdForToken(token);
  if (!bookingId) throw new Error("Geçersiz link.");
  if (!body.trim()) throw new Error("Yorum boş olamaz.");

  const supabase = createServiceClient();
  const { data: item } = await supabase.from("checklist_items").select("id").eq("id", itemId).eq("booking_id", bookingId).single();
  if (!item) throw new Error("Madde bulunamadı.");

  const { error } = await supabase.from("checklist_comments").insert({
    item_id: itemId,
    booking_id: bookingId,
    author_type: "client",
    author_name: authorName.trim() || null,
    body: body.trim(),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/planlama/${token}`);
}
