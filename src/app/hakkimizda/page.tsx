import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import AboutPage from "@/components/sections/AboutPage";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description: "NOQT nedir? Nasıl çalışır? Kim yaratır?",
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
