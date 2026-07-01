import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import PresskitBuilder from "./PresskitBuilder";

export default async function PresskitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: dj } = await supabase.from("dj_profiles").select("*").eq("id", id).single();

  if (!dj) notFound();

  return (
    <div className="space-y-6 h-full">
      <div className="flex items-center gap-3">
        <Link href="/admin/djler" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← DJ&apos;ler
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <Link href={`/admin/djler/${id}/edit`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          {dj.name}
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <h1 className="text-sm font-medium text-foreground">Presskit</h1>
      </div>

      <PresskitBuilder dj={dj} />
    </div>
  );
}
