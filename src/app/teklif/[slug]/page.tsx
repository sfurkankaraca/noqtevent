import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase";
import OfferView from "./OfferView";

type Props = { params: Promise<{ slug: string }> };

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

export default async function OfferPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("*, dj_profiles(name, performer_type, slug)")
    .eq("offer_slug", slug)
    .single();

  if (!booking) notFound();

  const { data: agreement } = await supabase
    .from("booking_agreements")
    .select("*")
    .eq("booking_id", booking.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return <OfferView booking={booking} slug={slug} agreement={agreement} />;
}
