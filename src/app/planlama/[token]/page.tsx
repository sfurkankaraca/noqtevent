import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase";
import ChecklistView from "./ChecklistView";

type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const supabase = createServiceClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("client_name")
    .eq("checklist_token", token)
    .single();
  if (!booking) return { title: "Checklist Bulunamadı" };
  return {
    title: `Etkinlik Planlaması — ${booking.client_name} · NOQT`,
    robots: { index: false },
  };
}

export default async function ChecklistPage({ params }: Props) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, client_name, event_type, event_date, venue_name")
    .eq("checklist_token", token)
    .single();

  if (!booking) notFound();

  const [{ data: items }, { data: comments }] = await Promise.all([
    supabase.from("checklist_items").select("*").eq("booking_id", booking.id).order("sort_order").order("created_at"),
    supabase.from("checklist_comments").select("*").eq("booking_id", booking.id).order("created_at"),
  ]);

  return (
    <ChecklistView
      token={token}
      booking={booking}
      initialItems={items ?? []}
      initialComments={comments ?? []}
    />
  );
}
