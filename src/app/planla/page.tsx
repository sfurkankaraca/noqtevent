import type { Metadata } from "next";
import Link from "next/link";
import PlannerWizard from "@/components/planner/PlannerWizard";
import { createServiceClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Deneyimini Tasarla",
  description:
    "Adım adım rehberlik eden deneyim planlayıcısı ile hayalindeki etkinliği tasarla.",
};

export default async function PlanlaPage() {
  // Fetch concept cover images from DB (slug → cover_image_url)
  const supabase = createServiceClient();
  const [{ data: dbConcepts }, { data: dbDjs }] = await Promise.all([
    supabase.from("concepts").select("slug, cover_image_url, name").eq("is_active", true),
    supabase
      .from("dj_profiles")
      .select("id, name, bio, performer_type, speciality, city, photo_url, instagram_url, spotify_url, website_url, soundcloud_url, concept_tags")
      .eq("is_active", true)
      .eq("application_status", "approved"),
  ]);

  const conceptCovers: Record<string, string> = {};
  const activeSlugs = new Set<string>();
  for (const c of dbConcepts ?? []) {
    activeSlugs.add(c.slug);
    if (c.cover_image_url) conceptCovers[c.slug] = c.cover_image_url;
  }

  return (
    <div className="relative">
      <Link
        href="/"
        className="fixed top-5 left-6 lg:left-8 z-50 text-xs tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
      >
        <span className="text-base">←</span> NOQT
      </Link>

      <PlannerWizard conceptCovers={conceptCovers} activeSlugs={[...activeSlugs]} djs={dbDjs ?? []} />
    </div>
  );
}
