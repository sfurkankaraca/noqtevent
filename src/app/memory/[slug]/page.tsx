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
  // Bulgu 2: select("*") gallery_token ve password'ü de client prop'una taşıyordu.
  // Misafir yükleme sayfası yalnızca bu alanlara ihtiyaç duyar.
  const { data: event } = await supabase
    .from("memory_events")
    .select("id, slug, title, description, gallery_visibility")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!event) notFound();

  return <MemoryUploadClient event={event} />;
}
