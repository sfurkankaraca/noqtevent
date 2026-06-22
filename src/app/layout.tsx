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

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? "https://www.noqt.events";

export const metadata: Metadata = {
  title: {
    default: "NOQT — Kayseri & Nevşehir Düğün DJ ve Etkinlik Organizasyonu",
    template: "%s | NOQT",
  },
  description:
    "Kayseri ve Nevşehir'de düğün DJ, kına gecesi, mezuniyet, after party ve kurumsal etkinlik organizasyonu. Profesyonel müzik deneyimi, sanatçı ve ses sistemi çözümleri.",
  keywords: [
    "kayseri düğün dj",
    "kayseri dj",
    "nevşehir düğün dj",
    "kapadokya düğün organizasyonu",
    "kayseri düğün müziği",
    "kayseri kına gecesi dj",
    "kayseri after party",
    "nevşehir etkinlik organizasyonu",
    "kayseri mezuniyet partisi",
    "kayseri kurumsal etkinlik",
    "düğün dj",
    "düğün müziği",
    "kına gecesi müziği",
    "deneyim stüdyosu",
  ],
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: BASE_URL,
    siteName: "NOQT",
    title: "NOQT — Kayseri & Nevşehir Düğün DJ ve Etkinlik Organizasyonu",
    description:
      "Kayseri ve Nevşehir'de düğün DJ, kına gecesi, after party ve kurumsal etkinlik organizasyonu. Profesyonel müzik deneyimi.",
    images: [
      {
        url: `${BASE_URL}/noqt-og.jpg`,
        width: 1200,
        height: 630,
        alt: "NOQT — Kayseri & Nevşehir Düğün DJ ve Etkinlik Organizasyonu",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NOQT — Kayseri & Nevşehir Düğün DJ ve Etkinlik Organizasyonu",
    description:
      "Kayseri ve Nevşehir'de düğün DJ, kına gecesi, after party ve kurumsal etkinlik organizasyonu.",
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
  name: "NOQT Deneyim Stüdyosu",
  description:
    "Kayseri ve Nevşehir merkezli düğün DJ, kına gecesi, mezuniyet, kurumsal etkinlik ve after party organizasyonu.",
  url: BASE_URL,
  logo: `${BASE_URL}/noqt-logo-transparent.png`,
  email: "booking@noqt.events",
  telephone: "+905447335514",
  areaServed: [
    { "@type": "City", name: "Kayseri" },
    { "@type": "City", name: "Nevşehir" },
    { "@type": "City", name: "Kapadokya" },
    { "@type": "Country", name: "Türkiye" },
  ],
  serviceType: [
    "Düğün DJ",
    "Kına Gecesi Müziği",
    "Mezuniyet Partisi",
    "Doğum Günü Organizasyonu",
    "Bekarlığa Veda Partisi",
    "Kurumsal Etkinlik",
    "After Party",
    "Morning Party",
  ],
  sameAs: ["https://www.noqt.events"],
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
