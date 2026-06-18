import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import ContactPage from "@/components/sections/ContactPage";

export const metadata: Metadata = {
  title: "İletişim",
  description: "NOQT ile iletişime geç. Etkinliğin için konuşalım.",
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
