import Link from "next/link";
import PartnerForm from "../PartnerForm";

export default function NewPartnerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/ortaklar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Ortaklar
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <h1 className="text-2xl font-semibold text-foreground">Yeni Ortak</h1>
      </div>
      <PartnerForm />
    </div>
  );
}
