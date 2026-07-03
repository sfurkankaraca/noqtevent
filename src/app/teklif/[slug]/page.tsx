import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase";
import { sendOfferViewedNotification } from "@/lib/email";
import OfferView from "./OfferView";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ odeme?: string; mesaj?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("client_name")
    .eq("offer_slug", slug)
    .single();
  if (!booking) return { title: "Teklif Bulunamadı" };
  return {
    title: `Teklifiniz — ${booking.client_name} · NOQT`,
    robots: { index: false },
  };
}

export default async function OfferPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { odeme, mesaj } = (await searchParams) ?? {};
  const supabase = createServiceClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, dj_profiles(name, performer_type, slug)")
    .eq("offer_slug", slug)
    .single();

  if (!booking) notFound();

  // İlk görüntülemede admin'e "sıcakken ara" bildirimi.
  // Serverless'ta response sonrası arka plan işi kesilebileceğinden burada await ediyoruz.
  // Update başarısız olursa (ör. migration henüz çalıştırılmadıysa) bildirim gönderilmez —
  // "görüldü" durumu kaydedilemeyen bir bildirimi her sayfa yenilemesinde tekrar atmamak için.
  if (!booking.offer_viewed_at) {
    const { error: viewedError } = await supabase
      .from("bookings")
      .update({ offer_viewed_at: new Date().toISOString() })
      .eq("id", booking.id);
    if (!viewedError) {
      await sendOfferViewedNotification({
        clientName: booking.client_name,
        artistName: booking.dj_profiles?.name ?? "—",
        bookingId: booking.id,
      }).catch((err) => console.error("[offer-viewed]", err));
    }
  }

  const { data: agreement } = await supabase
    .from("booking_agreements")
    .select("*")
    .eq("booking_id", booking.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Havale bilgileri env'den — IBAN tanımlı değilse kutu gösterilmez
  const bankInfo = process.env.BANK_IBAN
    ? {
        iban: process.env.BANK_IBAN,
        accountName: process.env.BANK_ACCOUNT_NAME ?? "NOQT Experience",
        bankName: process.env.BANK_NAME ?? null,
      }
    : null;

  const expired = Boolean(
    booking.offer_expires_at &&
    new Date(booking.offer_expires_at) < new Date() &&
    !agreement
  );

  return (
    <OfferView
      booking={booking}
      slug={slug}
      agreement={agreement}
      bankInfo={bankInfo}
      expired={expired}
      paymentResult={odeme === "basarili" ? "success" : odeme === "hata" ? "error" : null}
      paymentMessage={mesaj ?? null}
    />
  );
}
