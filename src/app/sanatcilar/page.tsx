import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import ArtistsClient from "@/components/sections/ArtistsClient";
import ArtistsPage from "@/components/sections/ArtistsPage";
import { createServiceClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Sanatçılar — DJ, Solo Sanatçı, Dans Ekibi | NOQT",
  description: "NOQT kadrosu — DJ'ler, solo sanatçılar, trio gruplar, dans ekipleri ve orkestralar.",
};

type Props = { searchParams: Promise<{ type?: string }> };

export default async function Page({ searchParams }: Props) {
  const { type } = await searchParams;
  const activeType = type && type !== "all" ? type : null;

  const supabase = createServiceClient();
  let query = supabase
    .from("dj_profiles")
    .select("id, name, bio, photo_url, concept_tags, soundcloud_url, mixcloud_url, youtube_url, instagram_url, spotify_url, website_url, performer_type, city, speciality")
    .eq("is_active", true)
    .eq("application_status", "approved")
    .order("created_at", { ascending: true });

  if (activeType) query = query.eq("performer_type", activeType);

  const { data: djs } = await query;

  const hasDjs = djs && djs.length > 0;

  return (
    <>
      <Navigation />
      <main className="pt-20">
        {hasDjs ? <ArtistsClient djs={djs} activeType={activeType} /> : <ArtistsPage />}
      </main>
      <Footer />
    </>
  );
}
