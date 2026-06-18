import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import ArtistsClient from "@/components/sections/ArtistsClient";
import ArtistsPage from "@/components/sections/ArtistsPage";
import { createServiceClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Sanatçılar",
  description: "NOQT kadrosu — DJ'ler, canlı performansçılar ve ses sanatçıları.",
};

export default async function Page() {
  const supabase = createServiceClient();
  const { data: djs } = await supabase
    .from("dj_profiles")
    .select("id, name, bio, photo_url, concept_tags, soundcloud_url, mixcloud_url, youtube_url")
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const hasDjs = djs && djs.length > 0;

  return (
    <>
      <Navigation />
      <main className="pt-20">
        {hasDjs ? <ArtistsClient djs={djs} /> : <ArtistsPage />}
      </main>
      <Footer />
    </>
  );
}
