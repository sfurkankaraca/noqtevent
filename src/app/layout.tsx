import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const BASE_URL = process.env.NEXT_PUBLIC_URL ?? "https://www.noqt.events";

export const metadata: Metadata = {
  title: {
    default: "NOQT — Düğün, Mezuniyet & Etkinlik DJ Organizasyonu",
    template: "%s | NOQT",
  },
  description:
    "Düğün DJ, mezuniyet partisi, doğum günü, bekarlığa veda, kurumsal etkinlik ve after party organizasyonu. Profesyonel müzik deneyimi — İstanbul, İzmir, Ankara ve Türkiye geneli.",
  keywords: [
    "düğün dj",
    "düğün müziği",
    "wedding dj istanbul",
    "mezuniyet partisi organizasyonu",
    "doğum günü partisi dj",
    "bekarlığa veda partisi",
    "kurumsal etkinlik organizasyonu",
    "after party dj",
    "kına gecesi müziği",
    "etkinlik organizasyonu türkiye",
    "bride party organizasyonu",
    "morning party dj",
    "brunch party organizasyonu",
    "deneyim stüdyosu",
  ],
  metadataBase: new URL(BASE_URL),
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: BASE_URL,
    siteName: "NOQT",
    title: "NOQT — Düğün, Mezuniyet & Etkinlik DJ Organizasyonu",
    description:
      "Düğün DJ, mezuniyet partisi, doğum günü, bekarlığa veda ve kurumsal etkinlik organizasyonu. Türkiye geneli profesyonel müzik deneyimi.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "NOQT Deneyim Stüdyosu",
  description:
    "Düğün DJ, mezuniyet partisi, doğum günü, bekarlığa veda, kurumsal etkinlik ve after party organizasyonu.",
  url: BASE_URL,
  logo: `${BASE_URL}/noqt-logo-transparent.png`,
  areaServed: [
    { "@type": "City", name: "İstanbul" },
    { "@type": "City", name: "İzmir" },
    { "@type": "City", name: "Ankara" },
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
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
