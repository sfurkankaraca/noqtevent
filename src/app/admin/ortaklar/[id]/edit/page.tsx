import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import PartnerForm from "../../PartnerForm";

export default async function EditPartnerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: partner } = await supabase.from("partner_profiles").select("*").eq("id", id).single();

  if (!partner) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/ortaklar" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Ortaklar
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <h1 className="text-2xl font-semibold text-foreground">{partner.company_name}</h1>
      </div>
      <PartnerForm partner={partner} />
    </div>
  );
}
