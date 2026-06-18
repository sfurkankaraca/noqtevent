import Link from "next/link";
import ConceptForm from "../ConceptForm";
import { upsertConcept } from "../actions";

export default function NewConceptPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/konseptler" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Konseptler
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <h1 className="text-2xl font-semibold text-foreground">Yeni Konsept</h1>
      </div>
      <div className="bg-white rounded-2xl border border-border p-6">
        <ConceptForm action={upsertConcept} />
      </div>
    </div>
  );
}
