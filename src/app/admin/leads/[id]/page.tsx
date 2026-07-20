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

  const [{ data: lead }, { data: events }] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).single(),
    supabase.from("lead_events").select("*").eq("lead_id", id).order("created_at", { ascending: false }).limit(50),
  ]);

  if (!lead) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/leads" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Inbox
        </Link>
      </div>
      <LeadWorkbench lead={lead} events={events ?? []} />
    </div>
  );
}
