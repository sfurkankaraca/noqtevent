import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase";
import { EVENT_PAGES } from "@/lib/eventPages";

const BASE = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";

// Yeni sanatçı/konsept/yazı eklendiğinde sitemap güncel kalsın
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient();

  // updated_at bazı tablolarda yok — seçilirse sorgu hata verir ve o bölüm sitemap'ten düşer
  const [
    { data: djs },
    { data: partners },
    { data: concepts },
    { data: posts },
  ] = await Promise.all([
    supabase.from("dj_profiles").select("id").eq("is_active", true),
    supabase.from("partner_profiles").select("id").eq("is_active", true),
    supabase.from("concepts").select("slug").eq("is_active", true),
    supabase.from("journal_posts").select("slug, updated_at").eq("is_published", true),
  ]);

  const eventRoutes: MetadataRoute.Sitemap = EVENT_PAGES.map((p) => ({
    url: `${BASE}/etkinlikler/${p.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, priority: 1.0, changeFrequency: "weekly" },
    { url: `${BASE}/planla`, priority: 0.9, changeFrequency: "monthly" },
    { url: `${BASE}/konseptler`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${BASE}/sanatcilar`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${BASE}/ortaklar`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${BASE}/journal`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${BASE}/paketler`, priority: 0.85, changeFrequency: "monthly" },
    { url: `${BASE}/fiyatlar`, priority: 0.85, changeFrequency: "monthly" },
    { url: `${BASE}/organizatorler`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${BASE}/salonlar`, priority: 0.75, changeFrequency: "monthly" },
    { url: `${BASE}/hakkimizda`, priority: 0.5, changeFrequency: "monthly" },
    { url: `${BASE}/iletisim`, priority: 0.5, changeFrequency: "monthly" },
  ];

  const djRoutes: MetadataRoute.Sitemap = (djs ?? []).map((d) => ({
    url: `${BASE}/sanatcilar/${d.id}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const partnerRoutes: MetadataRoute.Sitemap = (partners ?? []).map((p) => ({
    url: `${BASE}/ortaklar/${p.id}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const conceptRoutes: MetadataRoute.Sitemap = (concepts ?? []).map((c) => ({
    url: `${BASE}/konseptler/${c.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const postRoutes: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
    url: `${BASE}/journal/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
    changeFrequency: "monthly" as const,
    priority: 0.75,
  }));

  return [...staticRoutes, ...eventRoutes, ...djRoutes, ...partnerRoutes, ...conceptRoutes, ...postRoutes];
}
