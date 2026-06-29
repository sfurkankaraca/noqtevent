import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase";
import GalleryClient from "./GalleryClient";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase.from("memory_events").select("title").eq("slug", slug).single();
  if (!data) return { title: "Galeri" };
  return { title: `${data.title} — Galeri` };
}

export default async function GalleryPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: event } = await supabase
    .from("memory_events")
    .select("id, slug, title")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!event) notFound();

  const { data: uploads } = await supabase
    .from("memory_uploads")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  return <GalleryClient event={event} uploads={uploads ?? []} />;
}
