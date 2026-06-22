import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import AboutPage from "@/components/sections/AboutPage";

export const metadata: Metadata = {
  title: "Hakkımızda — NOQT Kayseri & Nevşehir Deneyim Stüdyosu",
  description: "NOQT, Kayseri ve Nevşehir merkezli bir deneyim stüdyosudur. Düğün DJ'i, kına, after party ve kurumsal etkinliklerde profesyonel müzik ve organizasyon hizmeti sunuyoruz.",
  alternates: { canonical: "https://www.noqt.events/hakkimizda" },
};

export default function Page() {
  return (
    <>
      <Navigation />
      <main className="pt-20">
        <AboutPage />
      </main>
      <Footer />
    </>
  );
}
