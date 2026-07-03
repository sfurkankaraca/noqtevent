import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { retrieveCheckoutForm } from "@/lib/iyzico";
import { calcDuePayment } from "@/lib/paymentPlan";
import { sendPaymentReceivedEmails } from "@/lib/email";

// iyzico, ödeme sonrası müşteriyi bu adrese token ile POST eder.
// Sonuç iyzico'dan sunucudan sunucuya doğrulanır — client verisine güvenilmez.

const BASE = () => process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";

function redirectToOffer(slug: string | null, result: "basarili" | "hata", message?: string) {
  const target = new URL(slug ? `/teklif/${slug}` : "/", BASE());
  target.searchParams.set("odeme", result);
  if (message) target.searchParams.set("mesaj", message.slice(0, 200));
  return NextResponse.redirect(target, 303);
}

export async function POST(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");

  let token: string | null = null;
  try {
    const form = await req.formData();
    token = (form.get("token") as string) || null;
  } catch {
    // form parse hatası
  }
  if (!token) return redirectToOffer(slug, "hata", "Ödeme doğrulanamadı.");

  try {
    const result = await retrieveCheckoutForm(token);

    if (result.paymentStatus !== "SUCCESS") {
      return redirectToOffer(slug, "hata", result.errorMessage || "Ödeme tamamlanamadı.");
    }

    const supabase = createServiceClient();
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, offer_slug, status, fee, payment_plan, deposit_rate, client_name, client_email, dj_profiles(name, email)")
      .eq("id", result.basketId)
      .single();

    if (!booking) return redirectToOffer(slug, "hata", "Rezervasyon bulunamadı.");
    const offerSlug = booking.offer_slug ?? slug;

    // Idempotency: aynı iyzico paymentId için ikinci kayıt açma
    const { data: existing } = await supabase
      .from("booking_payments")
      .select("id")
      .eq("provider_payment_id", result.paymentId)
      .maybeSingle();
    if (existing) return redirectToOffer(offerSlug, "basarili");

    const kind = result.conversationId.split(":")[1] ?? "full";
    const paymentRow = {
      booking_id: booking.id,
      type: kind === "deposit" ? "deposit" : "full",
      amount: result.paidPrice,
      direction: "inbound",
      status: "completed",
      description: `iyzico online ödeme${result.cardLastFour ? ` (**** ${result.cardLastFour})` : ""}`,
      paid_at: new Date().toISOString(),
    };

    // Migration çalıştırılmadıysa provider kolonları olmadan kaydet
    let insert = await supabase.from("booking_payments").insert({
      ...paymentRow,
      provider: "iyzico",
      provider_payment_id: result.paymentId,
      conversation_id: result.conversationId,
    });
    if (insert.error?.message.includes("column")) {
      insert = await supabase.from("booking_payments").insert(paymentRow);
    }
    if (insert.error) console.error("[iyzico callback] payment insert:", insert.error.message);

    // Toplam tahsilata göre booking durumunu güncelle
    const { data: payments } = await supabase
      .from("booking_payments")
      .select("amount")
      .eq("booking_id", booking.id)
      .eq("direction", "inbound")
      .eq("status", "completed")
      .in("type", ["deposit", "full"]);
    const paidTotal = (payments ?? []).reduce((s, p) => s + Number(p.amount), 0);
    const stillDue = calcDuePayment(booking, paidTotal);
    const newStatus = stillDue ? "deposit_paid" : "full_paid";
    await supabase.from("bookings").update({ status: newStatus }).eq("id", booking.id);

    // Makbuz + admin bildirimi (hata ödemeyi etkilemez)
    sendPaymentReceivedEmails({
      clientName: booking.client_name,
      clientEmail: booking.client_email,
      artistName: (booking.dj_profiles as { name?: string } | null)?.name ?? "—",
      amount: result.paidPrice,
      kind: kind === "deposit" ? "deposit" : kind === "remaining" ? "remaining" : "full",
      remaining: stillDue?.amount ?? 0,
      bookingId: booking.id,
      cardLastFour: result.cardLastFour ?? null,
    }).catch(console.error);

    return redirectToOffer(offerSlug, "basarili");
  } catch (err) {
    console.error("[iyzico callback] hata:", err);
    return redirectToOffer(slug, "hata", "Ödeme doğrulanırken bir hata oluştu. Kartınızdan çekim olduysa bizimle iletişime geçin.");
  }
}

// Kullanıcı callback URL'ine GET ile gelirse teklif sayfasına yönlendir
export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug");
  return NextResponse.redirect(new URL(slug ? `/teklif/${slug}` : "/", BASE()), 303);
}
