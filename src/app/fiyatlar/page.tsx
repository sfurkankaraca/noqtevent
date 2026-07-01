import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import PricingClient from "@/components/sections/PricingClient";

export const metadata: Metadata = {
  title: "Fiyat Rehberi — Kayseri Düğün DJ & Etkinlik 2025 | NOQT",
  description:
    "Kayseri ve Nevşehir'de düğün DJ, kına gecesi, after party ve kurumsal etkinlik fiyat rehberi. Bütçenizi doğru planlamanız için şeffaf bilgi.",
  alternates: { canonical: "https://www.noqt.events/fiyatlar" },
  keywords: [
    "kayseri düğün dj fiyatı",
    "kayseri dj fiyatı 2025",
    "nevşehir düğün organizasyon fiyatı",
    "düğün dj fiyatı",
    "kına gecesi dj fiyatı",
    "kapadokya düğün fiyatı",
    "kayseri after party dj fiyatı",
  ],
};

export default function FiyatlarPage() {
  return (
    <>
      <Navigation />
      <main>
        <PricingClient />
      </main>
      <Footer />
    </>
  );
}
