import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase";
import MemoryUploadClient from "./MemoryUploadClient";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase.from("memory_events").select("title").eq("slug", slug).eq("is_active", true).single();
  if (!data) return { title: "Memory Drive" };
  return { title: `${data.title} — Memory Drive` };
}

export default async function MemoryUploadPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();
  // select("*") — gallery_visibility migration'ı çalışmamışsa eksik sütun sorguyu bozar
  const { data: event } = await supabase
    .from("memory_events")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!event) notFound();

  return <MemoryUploadClient event={event} />;
}
