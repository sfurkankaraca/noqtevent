import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase";
import LeadWorkbench from "./LeadWorkbench";

// Yeniden analiz / yeniden yanıt action'ları AI çağrısı yapar
export const maxDuration = 60;

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: lead }, { data: events }, { data: artists }] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).single(),
    supabase.from("lead_events").select("*").eq("lead_id", id).order("created_at", { ascending: false }).limit(50),
    supabase.from("dj_profiles").select("id, name, performer_type").eq("is_active", true).order("name"),
  ]);

  if (!lead) notFound();

  // Lead zaten bir booking'e bağlıysa mevcut teklif seçeneklerini prefill için çek
  let offerState: { offerUrl: string | null; artistIds: string[]; conceptCategory: string | null } | null = null;
  if (lead.booking_id) {
    const { data: booking } = await supabase
      .from("bookings")
      .select("offer_slug, offer_artist_ids, offer_concept_category")
      .eq("id", lead.booking_id)
      .single();
    if (booking) {
      const BASE = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";
      offerState = {
        offerUrl: booking.offer_slug ? `${BASE}/teklif/${booking.offer_slug}` : null,
        artistIds: Array.isArray(booking.offer_artist_ids) ? booking.offer_artist_ids : [],
        conceptCategory: booking.offer_concept_category ?? null,
      };
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/leads" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Inbox
        </Link>
      </div>
      <LeadWorkbench lead={lead} events={events ?? []} artists={artists ?? []} initialOfferState={offerState} />
    </div>
  );
}
