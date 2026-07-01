import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import VenuePartnershipClient from "@/components/sections/VenuePartnershipClient";

export const metadata: Metadata = {
  title: "Düğün Salonları ile Ortaklık | NOQT",
  description:
    "Kayseri ve Nevşehir düğün salonları için NOQT ortaklık programı. Misafirlerinize en iyi müzik deneyimini önerin, siz de avantajlardan yararlanın.",
  alternates: { canonical: "https://www.noqt.events/salonlar" },
};

export default function SalonlarPage() {
  return (
    <>
      <Navigation />
      <main>
        <VenuePartnershipClient />
      </main>
      <Footer />
    </>
  );
}
