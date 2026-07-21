import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase";
import { EVENT_TYPE_LABELS } from "@/lib/eventTypeLabels";
import LandingClient from "./LandingClient";

export const metadata: Metadata = {
  title: "Etkinliğiniz — NOQT",
  robots: { index: false, follow: false },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Görüntüleme sinyali — son 1 saatte kaydedilmediyse yaz (yenileme spam'i önlenir).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logLandingView(supabase: any, leadId: string) {
  const { data: lastView } = await supabase
    .from("lead_events")
    .select("created_at")
    .eq("lead_id", leadId)
    .eq("type", "landing_viewed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!lastView || Date.now() - new Date(lastView.created_at).getTime() > 3_600_000) {
    await supabase.from("lead_events").insert({ lead_id: leadId, type: "landing_viewed", data: {} });
  }
}

export default async function LeadLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!UUID_RE.test(token)) notFound();

  const supabase = createServiceClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("id, landing_token, customer_name, event_type, event_date, location, budget_text, status, source")
    .eq("landing_token", token)
    .single();

  if (!lead || lead.status === "archived") notFound();

  // Güven unsurları — ana sayfanın kullandığı public veriler
  const [{ data: testimonials }, { data: djs }] = await Promise.all([
    supabase
      .from("testimonials")
      .select("name, quote, event, rating")
      .eq("is_active", true)
      .order("sort_order")
      .limit(3),
    supabase
      .from("dj_profiles")
      .select("id, name, photo_url, photos, performer_type")
      .eq("is_active", true)
      .eq("application_status", "approved")
      .limit(6),
  ]);

  await logLandingView(supabase, lead.id);

  return (
    <LandingClient
      token={token}
      customerName={lead.customer_name}
      eventTypeLabel={lead.event_type ? (EVENT_TYPE_LABELS[lead.event_type] ?? null) : null}
      knownDate={lead.event_date}
      knownLocation={lead.location}
      testimonials={(testimonials ?? []).map((t) => ({
        author: t.name as string,
        content: (t.quote as string) ?? "",
        event: (t.event as string | null) ?? null,
        rating: (t.rating as number) ?? 5,
      }))}
      artists={(djs ?? []).map((d) => ({
        id: d.id as string,
        name: d.name as string,
        photo: ((d.photos as string[] | null)?.[0] ?? (d.photo_url as string | null)) ?? null,
      }))}
    />
  );
}
