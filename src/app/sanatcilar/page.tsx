import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import ArtistsPage from "@/components/sections/ArtistsPage";

export const metadata: Metadata = {
  title: "Sanatçılar",
  description:
    "NOQT kadrosu — DJ'ler, canlı performansçılar ve ses sanatçıları.",
};

export default function Page() {
  return (
    <>
      <Navigation />
      <main className="pt-20">
        <ArtistsPage />
      </main>
      <Footer />
    </>
  );
}
