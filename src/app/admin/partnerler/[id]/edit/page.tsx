import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase";
import PartnerForm from "../../PartnerForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditPartnerPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: partner } = await supabase.from("partner_profiles").select("*").eq("id", id).single();
  if (!partner) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{partner.business_name}</h1>
        <p className="text-sm text-muted-foreground mt-1">Partner profilini düzenle</p>
      </div>
      <PartnerForm partner={partner} />
    </div>
  );
}
