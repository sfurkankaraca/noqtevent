import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // iyzipay dosyaları dinamik require ile yüklüyor — bundle edilemez, runtime'da node_modules'ten çalışır.
  // firebase-admin: "auth" alt modülü jwks-rsa → jose zincirinden geçiyor, jose artık salt ESM.
  // Bundler bunu statik olarak analiz edip require() ile yüklemeye çalışınca
  // "ERR_REQUIRE_ESM" ile 500 veriyordu — getAdminAuth() HİÇ ÇAĞRILMASA BİLE,
  // firebaseAdmin.ts'in tepesindeki `import { getAuth } from "firebase-admin/auth"`
  // modül yüklenirken çalışıyor (panel.noqt.social/panel/admin/uygulama/kullanicilar
  // 500 hatası, 2026-08-06). Bu paketi bundle dışı bırakmak Node'un kendi
  // require/import çözümlemesine bırakıyor, o CJS/ESM sınırını doğru yönetiyor.
  serverExternalPackages: ["iyzipay", "firebase-admin"],
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
      // Partner araştırmasıyla eklenen firma görselleri — çeşitli firma
      // siteleri ve Google Maps işletme fotoğrafları. Onaylanan partnerler
      // zamanla media.noqt.events'e taşınırsa bu liste küçültülebilir.
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "static.wixstatic.com" },
      { protocol: "https", hostname: "i.dugun.com" },
      { protocol: "https", hostname: "cdn-europe.dugunbuketi.com" },
      { protocol: "https", hostname: "biancovitakayseri.com" },
      { protocol: "https", hostname: "valls.com.tr" },
      { protocol: "https", hostname: "vipvenus.com.tr" },
      { protocol: "https", hostname: "www.yesimgelinlik.com" },
      { protocol: "https", hostname: "www.nejlahaniminmutfagi.com" },
      { protocol: "https", hostname: "www.katmermutfak.com" },
      { protocol: "https", hostname: "www.kalbimyemek.com.tr" },
      { protocol: "https", hostname: "kayseri.sahnekirala.com.tr" },
      { protocol: "https", hostname: "www.kayseridavulzurna.com.tr" },
      { protocol: "https", hostname: "kayserigelinarabasi.com" },
      { protocol: "https", hostname: "flintstonescicek.com" },
      { protocol: "https", hostname: "www.urepmedya.com" },
      { protocol: "https", hostname: "www.museumhotel.com.tr" },
      { protocol: "https", hostname: "www.kelebekhotel.com" },
      { protocol: "https", hostname: "www.nevsehirdugun.com" },
      { protocol: "https", hostname: "www.kapadokyaorganizasyon.com" },
      { protocol: "https", hostname: "cappadociaweddingphotos.com" },
      { protocol: "https", hostname: "thecappadociaphotographer.com" },
    ],
    formats: ["image/avif", "image/webp"],
    // Optimize edilmiş görsellerin tarayıcı/CDN önbelleğinde kalma süresi.
    // Kaynak dosyalar (upload'lar) değişmez isimlerle üretiliyor (rastgele
    // ek), bu yüzden agresif önbellekleme güvenli — Lighthouse'un "verimli
    // önbellek süreleri" uyarısını giderir.
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  async redirects() {
    type RedirectRule = {
      source: string;
      destination: string;
      permanent: boolean;
      has?: { type: "host"; value: string }[];
    };
    const redirectRules: RedirectRule[] = [
      {
        // Eski yazım hatalı slug — indexlenmiş URL'leri koru
        source: "/etkinlikler/bekarlga-veda-bride",
        destination: "/etkinlikler/bekarliga-veda-bride",
        permanent: true,
      },
      // /deneyimler/* → /etkinlikler/* konsolidasyonu (keyword cannibalization giderildi)
      { source: "/deneyimler/dugun", destination: "/etkinlikler/dugun-dj", permanent: true },
      { source: "/deneyimler/kurumsal", destination: "/etkinlikler/kurumsal-etkinlik", permanent: true },
      { source: "/deneyimler/acilis", destination: "/etkinlikler/acilis-lansman", permanent: true },
      { source: "/deneyimler/ozel-parti", destination: "/etkinlikler/ozel-parti", permanent: true },
      // /paketler kaldırıldı (Furkan, 4 Eyl 2026: "sadece paketler sayfasını
      // kaldıralım"); sitemap'te 0.85 öncelikle indekslenmişti, fiyatlara yönlendir.
      { source: "/paketler", destination: "/fiyatlar", permanent: true },
    ];

    // Panel domain yönlendirmesi (ETKINLIK_KESIF_V1_TASARIM.md §2.6): panel
    // yalnız panel.noqt.social'dan sunulur, noqt.events'ten /panel* veya
    // /onay* isteği gelirse oraya 308 (kalıcı) redirect edilir. `has: host`
    // kontrolü sayesinde AYNI Vercel projesi/build'i hem noqt.events hem
    // panel.noqt.social host'larına cevap verebilir — yalnız noqt.events'e
    // gelen isteklerde bu kural devreye girer; panel.noqt.social'ın kendisi
    // ve localhost (host eşleşmediği için) ASLA yönlendirilmez.
    //
    // PANEL_CANONICAL_HOST env'i boşsa kural hiç eklenmez — domain
    // panel.noqt.social'a bağlanana kadar mevcut davranış (yönlendirme yok)
    // sürer. Env değişikliği yalnız yeni bir build/deploy sonrası etkili
    // olur (next.config.ts build-time'da değerlendirilir).
    const panelHost = process.env.PANEL_CANONICAL_HOST?.trim();
    if (panelHost) {
      for (const sourceHost of ["noqt.events", "www.noqt.events"]) {
        for (const prefix of ["/panel", "/onay"]) {
          redirectRules.push(
            {
              source: prefix,
              has: [{ type: "host" as const, value: sourceHost }],
              destination: `https://${panelHost}${prefix}`,
              permanent: true,
            },
            {
              source: `${prefix}/:path*`,
              has: [{ type: "host" as const, value: sourceHost }],
              destination: `https://${panelHost}${prefix}/:path*`,
              permanent: true,
            }
          );
        }
      }
    }

    return redirectRules;
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
      {
        // /public altındaki statik görseller/ikonlar — içerik değişirse dosya adı da değişir
        source: "/:path*.(png|jpg|jpeg|webp|avif|svg|ico|gif|woff|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
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
