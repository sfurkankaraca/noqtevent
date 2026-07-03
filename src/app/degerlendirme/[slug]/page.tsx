import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase";
import ReviewForm from "./ReviewForm";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase.from("bookings").select("client_name").eq("delivery_slug", slug).single();
  if (!data) return { title: "Değerlendirme" };
  return { title: `Değerlendirme — ${data.client_name} · NOQT`, robots: { index: false } };
}

export default async function ReviewPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, client_name, event_type, dj_profiles(name)")
    .eq("delivery_slug", slug)
    .single();

  if (!booking) notFound();

  return (
    <ReviewForm
      slug={slug}
      clientName={booking.client_name}
      artistName={(booking.dj_profiles as { name?: string } | null)?.name ?? "NOQT"}
    />
  );
}
