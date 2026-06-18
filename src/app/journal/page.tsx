import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import JournalPage from "@/components/sections/JournalPage";

export const metadata: Metadata = {
  title: "Journal",
  description: "Düğün müziği, etkinlik tasarımı ve deneyim kültürü üzerine yazılar.",
};

export default function Page() {
  return (
    <>
      <Navigation />
      <main className="pt-20">
        <JournalPage />
      </main>
      <Footer />
    </>
  );
}
