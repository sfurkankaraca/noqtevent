import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import MemoryDrivePage from "@/components/sections/MemoryDrivePage";

export const metadata: Metadata = {
  title: "Memory Drive",
  description: "Etkinliğinin her anını QR kod ile topla. Misafir fotoğrafları, videolar, DJ set kaydı.",
};

export default function Page() {
  return (
    <>
      <Navigation />
      <main className="pt-20">
        <MemoryDrivePage />
      </main>
      <Footer />
    </>
  );
}
