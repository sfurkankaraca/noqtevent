import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import WhatsAppButton from "@/components/layout/WhatsAppButton";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";

export const metadata: Metadata = {
  title: {
    default: "NOQT — DJ & Sanatçı Booking, Etkinlik Yönetimi | Kayseri & Nevşehir",
    template: "%s | NOQT",
  },
  description:
    "Kayseri ve Nevşehir'de DJ ve sanatçı booking: düğün, kına, festival, kulüp gecesi, açılış, mezuniyet ve kurumsal etkinlikler. Mekanlara sanatçı temini ve baştan sona etkinlik yönetimi. Aynı gün teklif.",
  keywords: [
    "kayseri dj",
    "kayseri dj booking",
    "kayseri sanatçı booking",
    "nevşehir dj",
    "nevşehir sanatçı booking",
    "kapadokya etkinlik organizasyonu",
    "kayseri etkinlik yönetimi",
    "nevşehir etkinlik organizasyonu",
    "kayseri düğün dj",
    "nevşehir düğün dj",
    "kayseri kına gecesi dj",
    "kayseri after party",
    "kayseri kulüp dj",
    "mekan için dj",
    "festival sanatçı booking",
    "kayseri mezuniyet partisi",
    "kayseri kurumsal etkinlik",
    "kayseri açılış organizasyonu",
    "dj booking",
    "sanatçı booking",
    "etkinlik yönetimi",
  ],
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: BASE_URL,
    siteName: "NOQT",
    title: "NOQT — DJ & Sanatçı Booking, Etkinlik Yönetimi | Kayseri & Nevşehir",
    description:
      "Kayseri ve Nevşehir'de DJ ve sanatçı booking: düğün, festival, kulüp gecesi, açılış ve kurumsal etkinlikler. Mekanlara sanatçı temini, baştan sona etkinlik yönetimi.",
    images: [
      {
        url: `${BASE_URL}/noqt-og.jpg`,
        width: 1200,
        height: 630,
        alt: "NOQT — DJ & Sanatçı Booking ve Etkinlik Yönetimi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NOQT — DJ & Sanatçı Booking, Etkinlik Yönetimi | Kayseri & Nevşehir",
    description:
      "Kayseri ve Nevşehir'de DJ ve sanatçı booking; düğün, festival, kulüp gecesi ve kurumsal etkinlik yönetimi.",
    images: [`${BASE_URL}/noqt-og.jpg`],
  },
  alternates: {
    canonical: BASE_URL,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-icon.png",
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  // Ana sayfadaki aggregateRating schema'sı bu @id üzerinden aynı işletmeye bağlanır
  "@id": `${BASE_URL}#localbusiness`,
  name: "NOQT Deneyim Stüdyosu",
  description:
    "Kayseri ve Nevşehir merkezli DJ ve sanatçı booking ajansı: düğün, kına, festival, kulüp gecesi, açılış, mezuniyet ve kurumsal etkinlikler için sanatçı temini ve baştan sona etkinlik yönetimi.",
  url: BASE_URL,
  logo: `${BASE_URL}/noqt-logo-transparent.png`,
  email: "booking@noqt.events",
  telephone: "+905447335514",
  // Fiyat seviyesi göstergesi (₺ az – ₺₺₺ üst segment). Gerçek konumlamaya göre ayarla.
  priceRange: "₺₺-₺₺₺",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Kayseri",
    addressRegion: "Kayseri",
    addressCountry: "TR",
  },
  areaServed: [
    { "@type": "City", name: "Kayseri" },
    { "@type": "City", name: "Nevşehir" },
    { "@type": "City", name: "Kapadokya" },
    { "@type": "Country", name: "Türkiye" },
  ],
  serviceType: [
    "DJ Booking",
    "Sanatçı Booking",
    "Etkinlik Yönetimi",
    "Mekanlara Sanatçı Temini",
    "Düğün DJ",
    "Kına Gecesi Müziği",
    "Festival Organizasyonu",
    "Kulüp Gecesi",
    "Açılış Etkinliği",
    "Mezuniyet Partisi",
    "Doğum Günü Organizasyonu",
    "Bekarlığa Veda Partisi",
    "Kurumsal Etkinlik",
    "After Party",
    "Morning Party",
  ],
  sameAs: [
    "https://www.instagram.com/noqtevents",
    "https://www.youtube.com/@noqtclubradio",
    "https://open.spotify.com/user/31jte7ldctopxvipofwgucvts5sm",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="tr" className={`${inter.variable} h-full`} suppressHydrationWarning>
        <body className="min-h-full flex flex-col antialiased">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
          />
          {children}
          <WhatsAppButton />
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
