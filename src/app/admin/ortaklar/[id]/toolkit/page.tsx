import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import PartnerToolkitBuilder from "./PartnerToolkitBuilder";

export default async function PartnerToolkitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: partner } = await supabase.from("partner_profiles").select("*").eq("id", id).single();

  if (!partner) notFound();

  return (
    <div className="space-y-6 h-full">
      <div className="flex items-center gap-3">
        <Link href="/admin/ortaklar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Ortaklar
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <Link href={`/admin/ortaklar/${id}/edit`} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          {partner.business_name}
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <h1 className="text-sm font-medium text-foreground">Toolkit</h1>
      </div>

      <PartnerToolkitBuilder partner={partner} />
    </div>
  );
}
