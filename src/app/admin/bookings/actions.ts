"use server";

import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { sendBookingDeliveryEmail } from "@/lib/email";

export type BookingStatus =
  | "draft" | "offer_sent" | "confirmed" | "contracted"
  | "deposit_paid" | "full_paid" | "completed" | "cancelled";

export type BookingPayload = {
  id?: string;
  inquiry_id?: string | null;
  artist_id?: string | null;
  client_name: string;
  client_email?: string | null;
  client_phone?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  event_time?: string | null;
  event_duration_hours?: number | null;
  venue_name?: string | null;
  venue_city?: string | null;
  venue_address?: string | null;
  fee: number;
  commission_rate: number;
  deposit_rate: number;
  travel_required: boolean;
  accommodation_required: boolean;
  advance_amount: number;
  notes?: string | null;
  internal_notes?: string | null;
};

export async function upsertBooking(payload: BookingPayload) {
  const supabase = createServiceClient();
  const { id, ...data } = payload;

  if (id) {
    const { error } = await supabase.from("bookings").update(data).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("bookings").insert(data);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/admin/bookings");
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const supabase = createServiceClient();
  const extra: Record<string, unknown> = {};
  if (status === "contracted") extra.contract_signed_at = new Date().toISOString();
  const { error } = await supabase.from("bookings").update({ status, ...extra }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${id}`);
}

export async function addPayment(bookingId: string, data: {
  type: string; amount: number; direction: string; description?: string;
}) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("booking_payments").insert({
    booking_id: bookingId,
    ...data,
    status: "completed",
    paid_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function saveDelivery(bookingId: string, data: {
  slug: string;
  photos: string[];
  videos: string[];
  notes?: string | null;
}) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("bookings").update({
    delivery_slug: data.slug,
    delivery_photos: data.photos,
    delivery_videos: data.videos,
    delivery_notes: data.notes ?? null,
  }).eq("id", bookingId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/bookings/${bookingId}`);
  revalidatePath(`/teslimat/${data.slug}`);
}

export async function sendDelivery(bookingId: string) {
  const supabase = createServiceClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, dj_profiles(name)")
    .eq("id", bookingId)
    .single();
  if (error || !booking) throw new Error(error?.message ?? "Booking bulunamadı");
  if (!booking.delivery_slug) throw new Error("Önce teslimat linkini oluşturun");

  const BASE = process.env.NEXT_PUBLIC_URL ?? "https://www.noqt.events";
  await sendBookingDeliveryEmail({
    clientName: booking.client_name,
    clientEmail: booking.client_email,
    artistName: booking.dj_profiles?.name ?? "—",
    deliveryUrl: `${BASE}/teslimat/${booking.delivery_slug}`,
    photoCount: Array.isArray(booking.delivery_photos) ? booking.delivery_photos.length : 0,
    videoCount: Array.isArray(booking.delivery_videos) ? booking.delivery_videos.length : 0,
  });

  await supabase.from("bookings").update({ delivery_sent_at: new Date().toISOString() }).eq("id", bookingId);
  revalidatePath(`/admin/bookings/${bookingId}`);
}

export async function deleteBooking(id: string) {
  const supabase = createServiceClient();
  await supabase.from("bookings").delete().eq("id", id);
  revalidatePath("/admin/bookings");
}
