import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import EventProjectDetail from "./EventProjectDetail";

export default async function EventProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: project } = await supabase.from("event_projects").select("*").eq("id", id).single();
  if (!project) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/etkinlikler" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Etkinlikler
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <h1 className="text-2xl font-semibold text-foreground">{project.client_name}</h1>
      </div>
      <EventProjectDetail project={project} />
    </div>
  );
}
