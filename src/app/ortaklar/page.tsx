import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import PartnersPage from "@/components/sections/PartnersPage";

export const metadata: Metadata = {
  title: "Ortak Ekosistemi",
  description: "NOQT'un özenle seçilmiş partner ağı — mekanlar, fotoğrafçılar, dekoratörler ve daha fazlası.",
};

export default function Page() {
  return (
    <>
      <Navigation />
      <main className="pt-20">
        <PartnersPage />
      </main>
      <Footer />
    </>
  );
}
