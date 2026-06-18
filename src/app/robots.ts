import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_URL ?? "https://noqt.co";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/sign-in/"],
      },
    ],
    sitemap: `${BASE}/sitemap.xml`,
  };
}
