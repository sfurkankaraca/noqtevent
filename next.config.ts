import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // iyzipay dosyaları dinamik require ile yüklüyor — bundle edilemez, runtime'da node_modules'ten çalışır
  serverExternalPackages: ["iyzipay"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "gztdvsduxfkdfskrdrng.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
      {
        protocol: "https",
        hostname: "media.noqt.events",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  async redirects() {
    return [
      {
        // Eski yazım hatalı slug — indexlenmiş URL'leri koru
        source: "/etkinlikler/bekarlga-veda-bride",
        destination: "/etkinlikler/bekarliga-veda-bride",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Clickjacking koruması
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // MIME sniffing koruması
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Referrer policy
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions policy
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // CSP — script/style kısıtlaması yok (Next inline script kullanır);
          // yalnızca kırılma riski olmayan direktifler
          {
            key: "Content-Security-Policy",
            value: "object-src 'none'; base-uri 'self'; frame-ancestors 'self'",
          },
        ],
      },
      {
        // Public sayfalarda Clerk dev-mode noindex'ini ez
        source: "/((?!admin|sign-in|api).*)",
        headers: [
          { key: "X-Robots-Tag", value: "index, follow" },
        ],
      },
      {
        // Admin ve sign-in sayfalarını indexleme
        source: "/(admin|sign-in)(.*)",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

// SENTRY_AUTH_TOKEN yoksa kaynak haritası yükleme adımı sessizce atlanır
// (build kırılmaz); Sentry organizasyon/proje bilgisi de env'den gelir.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: true,
  disableLogger: true,
  widenClientFileUpload: false,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
});
