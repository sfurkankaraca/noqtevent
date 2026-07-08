import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase";
import TemplateModern from "@/components/davetiye/TemplateModern";
import TemplateClassic from "@/components/davetiye/TemplateClassic";
import TemplateMinimal from "@/components/davetiye/TemplateMinimal";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("invitations")
    .select("bride_name, groom_name, wedding_date")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  if (!data) return { title: "Davetiye" };
  return {
    title: `${data.bride_name} & ${data.groom_name} — Davet`,
    description: `${data.bride_name} ve ${data.groom_name}'in özel gününe davetlisiniz.`,
  };
}

export default async function DavetiyePage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: inv } = await supabase
    .from("invitations")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!inv) notFound();

  if (inv.template === "classic") return <TemplateClassic inv={inv} />;
  if (inv.template === "minimal") return <TemplateMinimal inv={inv} />;
  return <TemplateModern inv={inv} />;
}
