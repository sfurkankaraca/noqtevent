import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NOQT — Deneyim Stüdyosu",
    template: "%s | NOQT",
  },
  description:
    "İnsanları aynı anda, aynı hislerde buluşturan deneyimler. Düğünlerden marka lansmanlarına, açılışlardan after party'lere kadar.",
  keywords: [
    "düğün dj",
    "etkinlik organizasyonu",
    "deneyim stüdyosu",
    "müzik",
    "wedding dj istanbul",
    "kurumsal etkinlik",
    "açılış organizasyonu",
  ],
  openGraph: {
    type: "website",
    locale: "tr_TR",
    url: "https://noqt.co",
    siteName: "NOQT",
    title: "NOQT — Deneyim Stüdyosu",
    description:
      "İnsanları aynı anda, aynı hislerde buluşturan deneyimler.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="tr" className={`${inter.variable} h-full`} suppressHydrationWarning>
        <body className="min-h-full flex flex-col antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
