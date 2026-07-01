import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import PackagesClient from "@/components/sections/PackagesClient";

export const metadata: Metadata = {
  title: "Etkinlik Paketleri — DJ, Fotoğraf, Dekorasyon | NOQT",
  description:
    "Kayseri ve Nevşehir düğün, nişan ve özel etkinlikleriniz için hazır deneyim paketleri. DJ, fotoğrafçı, dekorasyon — tek sözleşme, tek ekip, tek fiyat.",
  alternates: { canonical: "https://www.noqt.events/paketler" },
  keywords: [
    "kayseri düğün paketi",
    "kayseri düğün organizasyon paketi",
    "nevşehir düğün paketi",
    "dj fotoğrafçı paketi",
    "düğün müzik dekorasyon paketi",
    "kayseri etkinlik paketi",
  ],
};

export default function PaketlerPage() {
  return (
    <>
      <Navigation />
      <main>
        <PackagesClient />
      </main>
      <Footer />
    </>
  );
}
