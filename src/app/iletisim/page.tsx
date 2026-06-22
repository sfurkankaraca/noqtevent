import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import ContactPage from "@/components/sections/ContactPage";

export const metadata: Metadata = {
  title: "İletişim — Kayseri & Nevşehir DJ ve Etkinlik",
  description: "NOQT ile iletişime geçin. Kayseri ve Nevşehir'deki düğün, kına, after party ve kurumsal etkinlikleriniz için teklif alın.",
  alternates: { canonical: "https://www.noqt.events/iletisim" },
};

export default function Page() {
  return (
    <>
      <Navigation />
      <main className="pt-20">
        <ContactPage />
      </main>
      <Footer />
    </>
  );
}
