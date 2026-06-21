import type { Metadata } from "next";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";
import PartnersClient from "@/components/sections/PartnersClient";
import PartnersPage from "@/components/sections/PartnersPage";
import { createServiceClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Ortak Ekosistemi",
  description: "NOQT'un özenle seçilmiş partner ağı — mekanlar, fotoğrafçılar, dekoratörler ve daha fazlası.",
};

export default async function Page() {
  const supabase = createServiceClient();
  const { data: partners } = await supabase
    .from("partner_profiles")
    .select("id, business_name, description, logo_url, photos, category, services")
    .eq("is_active", true)
    .eq("application_status", "approved")
    .order("created_at", { ascending: true });

  const hasPartners = partners && partners.length > 0;

  return (
    <>
      <Navigation />
      <main className="pt-20">
        {hasPartners ? <PartnersClient partners={partners} /> : <PartnersPage />}
      </main>
      <Footer />
    </>
  );
}
