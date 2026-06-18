import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import DjForm from "../../DjForm";

export default async function EditDjPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: dj } = await supabase.from("dj_profiles").select("*").eq("id", id).single();

  if (!dj) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/djler" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← DJ&apos;ler
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <h1 className="text-2xl font-semibold text-foreground">{dj.name}</h1>
      </div>
      <DjForm dj={dj} />
    </div>
  );
}
