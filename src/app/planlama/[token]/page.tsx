import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase";
import ChecklistView from "./ChecklistView";

type Props = { params: Promise<{ token: string }> };

async function resolveByToken(token: string) {
  const supabase = createServiceClient();
  const { data: project } = await supabase
    .from("event_projects")
    .select("id, client_name, event_type, event_date, venue_name")
    .eq("checklist_token", token)
    .single();
  if (project) return { idField: "event_project_id" as const, entity: project };

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, client_name, event_type, event_date, venue_name")
    .eq("checklist_token", token)
    .single();
  if (booking) return { idField: "booking_id" as const, entity: booking };

  return null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const resolved = await resolveByToken(token);
  if (!resolved) return { title: "Checklist Bulunamadı" };
  return {
    title: `Etkinlik Planlaması — ${resolved.entity.client_name} · NOQT`,
    robots: { index: false },
  };
}

export default async function ChecklistPage({ params }: Props) {
  const { token } = await params;
  const resolved = await resolveByToken(token);
  if (!resolved) notFound();

  const supabase = createServiceClient();
  const { idField, entity } = resolved;

  const [{ data: items }, { data: comments }] = await Promise.all([
    supabase.from("checklist_items").select("*").eq(idField, entity.id).order("sort_order").order("created_at"),
    supabase.from("checklist_comments").select("*").eq(idField, entity.id).order("created_at"),
  ]);

  return (
    <ChecklistView
      token={token}
      booking={entity}
      initialItems={items ?? []}
      initialComments={comments ?? []}
    />
  );
}
