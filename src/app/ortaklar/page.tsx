import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import PartnersClient from "@/components/sections/PartnersClient";
import JoinPlatform from "@/components/home/JoinPlatform";
import { createServiceClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Partner Ağı — Mekan, Fotoğraf, Dekorasyon & Daha Fazlası | NOQT",
  description: "NOQT partner ekosistemi — mekanlar, fotoğrafçılar, çiçek tasarımcıları, catering ve daha fazlası. Etkinliğinizin her detayı için titizlikle seçilmiş partnerler.",
};

export default async function Page() {
  const supabase = createServiceClient();
  const { data: partners } = await supabase
    .from("partner_profiles")
    .select("id, business_name, description, logo_url, photos, category, services")
    .eq("is_active", true)
    .eq("application_status", "approved")
    .order("created_at", { ascending: true });

  return (
    <>
      <Navigation />
      <main className="pt-20">
        <PartnersClient partners={partners ?? []} />
        <JoinPlatform />
      </main>
      <Footer />
    </>
  );
}
