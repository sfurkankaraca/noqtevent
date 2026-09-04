import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Bulgu 5: next.config.ts'deki X-Robots-Tag noindex listesiyle hizalı
        disallow: [
          "/admin/",
          "/sign-in/",
          "/panel/",
          "/onay/",
          "/memory/",
          "/davetiye/",
          "/teslimat/",
          "/teklif/",
          "/degerlendirme/",
          "/t/",
          "/s/",
          "/p/",
        ],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
