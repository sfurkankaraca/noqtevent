"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { TERMS_VERSION, calcCashPrice, calcPrepayPrice, isPrepayAvailable } from "@/lib/bookingTerms";
import { rateLimit } from "@/lib/rateLimit";
import { sendPaymentClaimNotification } from "@/lib/email";

async function getRequestMeta() {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? "unknown";
  const userAgent = hdrs.get("user-agent") ?? null;
  return { ip, userAgent };
}

export async function acceptOffer(data: {
  slug: string;
  name: string;
  email: string | null;
  plan: "cash" | "prepay";
}) {
  const { ip, userAgent } = await getRequestMeta();
  const { ok } = rateLimit(ip, "accept-offer", { max: 10, windowMs: 60 * 60_000 });
  if (!ok) throw new Error("Çok fazla istek. Lütfen daha sonra tekrar deneyin.");

  const name = data.name?.trim().slice(0, 120);
  if (!name) throw new Error("Ad soyad zorunludur.");
  if (data.plan !== "cash" && data.plan !== "prepay") throw new Error("Geçersiz ödeme planı.");

  const supabase = createServiceClient();

  // Booking'i slug üzerinden bul — client'tan gelen id/fiyata güvenilmez
  const { data: booking, error: lookupError } = await supabase
    .from("bookings")
    .select("id, fee, status, event_date")
    .eq("offer_slug", data.slug)
    .single();
  if (lookupError || !booking) throw new Error("Teklif bulunamadı.");

  if (data.plan === "prepay" && !isPrepayAvailable(booking.event_date)) {
    throw new Error("Ön ödemeli plan bu tarih için artık kullanılamıyor.");
  }

  // Fiyat sunucu tarafında hesaplanır
  const agreedPrice = data.plan === "cash" ? calcCashPrice(booking.fee ?? 0) : calcPrepayPrice(booking.fee ?? 0);

  const { error: agreementError } = await supabase.from("booking_agreements").insert({
    booking_id: booking.id,
    accepted_name: name,
    accepted_email: data.email?.trim().slice(0, 200) || null,
    payment_plan: data.plan,
    agreed_price: agreedPrice,
    terms_version: TERMS_VERSION,
    ip_address: ip === "unknown" ? null : ip,
    user_agent: userAgent,
  });
  if (agreementError) throw new Error(agreementError.message);

  const nextStatus = ["draft", "offer_sent"].includes(booking.status) ? "confirmed" : booking.status;

  const { error: bookingError } = await supabase
    .from("bookings")
    .update({ payment_plan: data.plan, status: nextStatus })
    .eq("id", booking.id);
  if (bookingError) throw new Error(bookingError.message);

  revalidatePath(`/teklif/${data.slug}`);
  revalidatePath(`/admin/bookings/${booking.id}`);
}

// Müşteri "ödemeyi yaptım" bildirimi — public teklif sayfasından çağrılır
export async function notifyPaymentClaim(slug: string, plan: "cash" | "prepay") {
  const { ip } = await getRequestMeta();
  const { ok } = rateLimit(ip, "payment-claim", { max: 10, windowMs: 60 * 60_000 });
  if (!ok) throw new Error("Çok fazla istek. Lütfen daha sonra tekrar deneyin.");

  if (plan !== "cash" && plan !== "prepay") throw new Error("Geçersiz ödeme planı.");

  const supabase = createServiceClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, client_name, fee")
    .eq("offer_slug", slug)
    .single();
  if (error || !booking) throw new Error("Teklif bulunamadı.");

  const amount = plan === "cash" ? calcCashPrice(booking.fee ?? 0) : calcPrepayPrice(booking.fee ?? 0);

  await sendPaymentClaimNotification({
    clientName: booking.client_name,
    bookingId: booking.id,
    plan,
    amount,
  });
}
