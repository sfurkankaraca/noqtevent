import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import ArtistsClient from "@/components/sections/ArtistsClient";
import ArtistsPage from "@/components/sections/ArtistsPage";
import JoinPlatform from "@/components/home/JoinPlatform";
import { createServiceClient } from "@/lib/supabase";
import { resolveTabId, tabTypes } from "@/lib/performerTypes";

export const metadata: Metadata = {
  title: "Sanatçılar — DJ, Solo Sanatçı, Dans Ekibi | NOQT",
  description: "Kayseri ve Nevşehir düğünleri için DJ'ler, solo sanatçılar, trio gruplar, dans ekipleri ve orkestralar. NOQT kadrosuyla tanışın.",
  alternates: { canonical: "https://www.noqt.events/sanatcilar" },
};

type Props = { searchParams: Promise<{ type?: string }> };

export default async function Page({ searchParams }: Props) {
  const { type } = await searchParams;
  // Eski ?type=artist|grup|orkestra linkleri birleşik sekmeye çözülür
  const activeType = resolveTabId(type && type !== "all" ? type : "dj");
  const performerTypes = tabTypes(activeType);

  const BASE_COLS = "id, name, bio, photo_url, photos, focal_points, concept_tags, soundcloud_url, mixcloud_url, youtube_url, instagram_url, spotify_url, website_url, performer_type, city, speciality, preview_video_url, videos, youtube_links";

  const supabase = createServiceClient();
  const buildQuery = (withSort: boolean) => {
    let q = supabase
      .from("dj_profiles")
      .select(BASE_COLS)
      .eq("is_active", true)
      .eq("application_status", "approved")
      .in("performer_type", performerTypes);
    if (withSort) q = q.order("sort_order", { ascending: true });
    return q.order("created_at", { ascending: true });
  };

  // sort_order kolonu henüz eklenmediyse eski sıralamaya düş
  let { data: rawDjs, error } = await buildQuery(true);
  if (error) ({ data: rawDjs, error } = await buildQuery(false));

  // Sadece sorgu tamamen başarısızsa statik sayfaya düş
  if (error || rawDjs === null) {
    return (
      <>
        <Navigation />
        <main className="pt-20"><ArtistsPage /></main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="pt-20">
        <ArtistsClient djs={rawDjs} activeType={activeType} />
        <JoinPlatform />
      </main>
      <Footer />
    </>
  );
}
