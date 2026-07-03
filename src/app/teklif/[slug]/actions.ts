"use server";

import crypto from "node:crypto";
import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { TERMS_VERSION, calcCashPrice, calcPrepayPrice, isPrepayAvailable } from "@/lib/bookingTerms";
import { rateLimit } from "@/lib/rateLimit";
import { sendPaymentClaimNotification, sendOfferAcceptedEmails, sendOfferOtpEmail } from "@/lib/email";
import { createAndStoreContract } from "@/lib/contract";
import { generateOfferOtp, verifyOfferOtp } from "@/lib/offerOtp";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function getRequestMeta() {
  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs.get("x-real-ip") ?? "unknown";
  const userAgent = hdrs.get("user-agent") ?? null;
  return { ip, userAgent };
}

// Onay öncesi e-posta doğrulama kodu gönderir — onaylayanın e-posta
// sahibi olduğunu kanıtlamak sözleşmenin ispat gücünü artırır.
export async function sendOfferOtp(slug: string, email: string) {
  const { ip } = await getRequestMeta();
  const { ok } = rateLimit(ip, "offer-otp", { max: 5, windowMs: 10 * 60_000 });
  if (!ok) throw new Error("Çok fazla kod istendi. Lütfen birkaç dakika bekleyin.");

  const cleanEmail = email?.trim().toLowerCase();
  if (!cleanEmail || !EMAIL_RE.test(cleanEmail)) throw new Error("Geçerli bir e-posta adresi girin.");

  const supabase = createServiceClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, dj_profiles(name)")
    .eq("offer_slug", slug)
    .single();
  if (error || !booking) throw new Error("Teklif bulunamadı.");

  const code = generateOfferOtp(slug, cleanEmail);
  await sendOfferOtpEmail({
    email: cleanEmail,
    code,
    artistName: (booking.dj_profiles as { name?: string } | null)?.name ?? "NOQT",
  });
}

export async function acceptOffer(data: {
  slug: string;
  name: string;
  email: string;
  otp: string;
  plan: "cash" | "prepay";
}) {
  const { ip, userAgent } = await getRequestMeta();
  const { ok } = rateLimit(ip, "accept-offer", { max: 10, windowMs: 60 * 60_000 });
  if (!ok) throw new Error("Çok fazla istek. Lütfen daha sonra tekrar deneyin.");

  const name = data.name?.trim().slice(0, 120);
  if (!name) throw new Error("Ad soyad zorunludur.");
  if (data.plan !== "cash" && data.plan !== "prepay") throw new Error("Geçersiz ödeme planı.");

  const email = data.email?.trim().toLowerCase().slice(0, 200);
  if (!email || !EMAIL_RE.test(email)) throw new Error("Geçerli bir e-posta adresi girin.");
  if (!verifyOfferOtp(data.slug, email, data.otp)) {
    throw new Error("Doğrulama kodu hatalı veya süresi dolmuş. Yeni kod isteyin.");
  }

  const supabase = createServiceClient();

  // Booking'i slug üzerinden bul — client'tan gelen id/fiyata güvenilmez
  const { data: booking, error: lookupError } = await supabase
    .from("bookings")
    .select("id, fee, status, event_date, event_type, deposit_rate, client_email, dj_profiles(name)")
    .eq("offer_slug", data.slug)
    .single();
  if (lookupError || !booking) throw new Error("Teklif bulunamadı.");

  if (data.plan === "prepay" && !isPrepayAvailable(booking.event_date)) {
    throw new Error("Ön ödemeli plan bu tarih için artık kullanılamıyor.");
  }

  // Fiyat sunucu tarafında hesaplanır
  const agreedPrice = data.plan === "cash" ? calcCashPrice(booking.fee ?? 0) : calcPrepayPrice(booking.fee ?? 0);

  const baseAgreement = {
    booking_id: booking.id,
    accepted_name: name,
    accepted_email: email,
    payment_plan: data.plan,
    agreed_price: agreedPrice,
    terms_version: TERMS_VERSION,
    ip_address: ip === "unknown" ? null : ip,
    user_agent: userAgent,
  };

  // Doğrulama kolonları migration'ı henüz çalıştırılmadıysa onları atlayarak dene
  let agreementId: string | null = null;
  let insertResult = await supabase
    .from("booking_agreements")
    .insert({ ...baseAgreement, verification_method: "email-otp", verified_email: email })
    .select("id")
    .single();
  if (insertResult.error?.message.includes("column")) {
    insertResult = await supabase.from("booking_agreements").insert(baseAgreement).select("id").single();
  }
  if (insertResult.error) throw new Error(insertResult.error.message);
  agreementId = insertResult.data?.id ?? null;

  const nextStatus = ["draft", "offer_sent"].includes(booking.status) ? "confirmed" : booking.status;

  const { error: bookingError } = await supabase
    .from("bookings")
    .update({ payment_plan: data.plan, status: nextStatus })
    .eq("id", booking.id);
  if (bookingError) throw new Error(bookingError.message);

  // Sözleşmeyi otomatik oluştur ve müşteriye e-postayla gönder.
  // Onay kaydedildi — PDF/e-posta hatası onayı geri almaz, sadece loglanır.
  try {
    const contract = await createAndStoreContract(booking.id);

    // Bütünlük kanıtı: sözleşme PDF'inin SHA-256 özeti onay kaydına yazılır
    if (contract && agreementId) {
      const contractHash = crypto.createHash("sha256").update(contract.pdfBuffer).digest("hex");
      await supabase
        .from("booking_agreements")
        .update({ contract_hash: contractHash })
        .eq("id", agreementId)
        .then((r) => {
          if (r.error && !r.error.message.includes("column")) console.error("[acceptOffer] hash kaydı:", r.error.message);
        });
    }

    await sendOfferAcceptedEmails({
      clientName: name,
      clientEmail: email,
      artistName: (booking.dj_profiles as { name?: string } | null)?.name ?? "—",
      eventType: booking.event_type,
      eventDate: booking.event_date,
      plan: data.plan,
      agreedPrice,
      depositAmount: Math.round(agreedPrice * ((booking.deposit_rate ?? 30) / 100)),
      contractUrl: contract?.contractUrl ?? null,
      contractPdf: contract?.pdfBuffer ?? null,
      bookingId: booking.id,
    });
  } catch (err) {
    console.error("[acceptOffer] sözleşme/e-posta hatası:", err);
  }

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

// iyzico Checkout Form başlatır — tutar her zaman sunucuda hesaplanır.
export async function startOnlinePayment(slug: string): Promise<{ paymentPageUrl: string }> {
  const { ip } = await getRequestMeta();
  const { ok } = rateLimit(ip, "start-payment", { max: 10, windowMs: 10 * 60_000 });
  if (!ok) throw new Error("Çok fazla istek. Lütfen birkaç dakika bekleyin.");

  const { isIyzicoConfigured, initCheckoutForm } = await import("@/lib/iyzico");
  if (!isIyzicoConfigured()) {
    throw new Error("Online ödeme şu an aktif değil. Lütfen banka havalesi ile ödeyin.");
  }

  const supabase = createServiceClient();
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("id, fee, status, payment_plan, deposit_rate, client_name, client_email, venue_city, event_type, dj_profiles(name)")
    .eq("offer_slug", slug)
    .single();
  if (error || !booking) throw new Error("Teklif bulunamadı.");

  // Ödeme yalnızca onaylanmış teklifler için
  if (!booking.payment_plan || ["draft", "offer_sent", "cancelled"].includes(booking.status)) {
    throw new Error("Ödeme için önce teklifi onaylamanız gerekiyor.");
  }

  // Son onaydaki isim/e-posta (booking'te yoksa)
  const { data: agreement } = await supabase
    .from("booking_agreements")
    .select("accepted_name, accepted_email")
    .eq("booking_id", booking.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Tamamlanmış müşteri tahsilatları
  const { data: payments } = await supabase
    .from("booking_payments")
    .select("amount")
    .eq("booking_id", booking.id)
    .eq("direction", "inbound")
    .eq("status", "completed")
    .in("type", ["deposit", "full"]);
  const paidTotal = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);

  const { calcDuePayment } = await import("@/lib/paymentPlan");
  const due = calcDuePayment(booking, paidTotal);
  if (!due) throw new Error("Ödenecek tutar kalmadı — ödemeniz zaten alınmış.");

  const fullName = (agreement?.accepted_name || booking.client_name || "Müşteri Müşteri").trim();
  const parts = fullName.split(/\s+/);
  const surname = parts.length > 1 ? parts.pop()! : "—";
  const name = parts.join(" ") || "Müşteri";
  const email = agreement?.accepted_email || booking.client_email;
  if (!email) throw new Error("Ödeme için e-posta adresi gerekli. Lütfen bizimle iletişime geçin.");

  const artistName = (booking.dj_profiles as { name?: string } | null)?.name ?? "NOQT";
  const kindLabel = due.kind === "deposit" ? "Ön Ödeme" : due.kind === "remaining" ? "Kalan Ödeme" : "Ödeme";
  const BASE = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";

  const { paymentPageUrl } = await initCheckoutForm({
    conversationId: `${booking.id}:${due.kind}:${Date.now()}`,
    basketId: booking.id,
    price: due.amount,
    callbackUrl: `${BASE}/api/payment/iyzico/callback?slug=${encodeURIComponent(slug)}`,
    buyer: {
      id: booking.id,
      name,
      surname,
      email,
      ip: ip === "unknown" ? "85.34.78.112" : ip,
      city: booking.venue_city,
    },
    itemName: `${artistName} — Rezervasyon ${kindLabel}`,
  });

  return { paymentPageUrl };
}
