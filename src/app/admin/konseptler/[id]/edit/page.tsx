import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import ConceptForm from "../../ConceptForm";
import { upsertConcept } from "../../actions";

export default async function EditConceptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: concept } = await supabase.from("concepts").select("*").eq("id", id).single();
  if (!concept) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/konseptler" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Konseptler
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <h1 className="text-2xl font-semibold text-foreground">
          {concept.emoji} {concept.name}
        </h1>
      </div>
      <div className="bg-white rounded-2xl border border-border p-6">
        <ConceptForm concept={concept} action={upsertConcept} />
      </div>
    </div>
  );
}
