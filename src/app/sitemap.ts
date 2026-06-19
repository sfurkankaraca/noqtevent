import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase";

const BASE = process.env.NEXT_PUBLIC_URL ?? "https://www.noqt.events";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient();

  const [
    { data: djs },
    { data: partners },
    { data: concepts },
    { data: posts },
  ] = await Promise.all([
    supabase.from("dj_profiles").select("id, updated_at").eq("is_active", true),
    supabase.from("partner_profiles").select("id, updated_at").eq("is_active", true),
    supabase.from("concepts").select("slug, updated_at").eq("is_active", true),
    supabase.from("journal_posts").select("slug, updated_at").eq("is_published", true),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, priority: 1.0, changeFrequency: "weekly" },
    { url: `${BASE}/planla`, priority: 0.9, changeFrequency: "monthly" },
    { url: `${BASE}/konseptler`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${BASE}/sanatcilar`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${BASE}/ortaklar`, priority: 0.8, changeFrequency: "weekly" },
    { url: `${BASE}/journal`, priority: 0.7, changeFrequency: "weekly" },
    { url: `${BASE}/hakkimizda`, priority: 0.5, changeFrequency: "monthly" },
    { url: `${BASE}/iletisim`, priority: 0.5, changeFrequency: "monthly" },
  ];

  const djRoutes: MetadataRoute.Sitemap = (djs ?? []).map((d) => ({
    url: `${BASE}/sanatcilar/${d.id}`,
    lastModified: d.updated_at ? new Date(d.updated_at) : undefined,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const partnerRoutes: MetadataRoute.Sitemap = (partners ?? []).map((p) => ({
    url: `${BASE}/ortaklar/${p.id}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const conceptRoutes: MetadataRoute.Sitemap = (concepts ?? []).map((c) => ({
    url: `${BASE}/konseptler/${c.slug}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : undefined,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const postRoutes: MetadataRoute.Sitemap = (posts ?? []).map((p) => ({
    url: `${BASE}/journal/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...djRoutes, ...partnerRoutes, ...conceptRoutes, ...postRoutes];
}
