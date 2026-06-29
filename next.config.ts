import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
