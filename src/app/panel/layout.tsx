import type { Metadata, Viewport } from "next";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import PanelNav from "./PanelNav";

export const metadata: Metadata = {
  title: {
    default: "NOQT Panel — Mekan & Sanatçı",
    template: "%s | NOQT Panel",
  },
  description: "Mekan ve sanatçı profillerini yönet, etkinlik oluştur, onayları takip et.",
  manifest: "/panel-manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#151312",
};

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getPanelUser();
  const admin = await isPanelAdmin();

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.005_80)]">
      <PanelNav signedIn={!!user} isAdmin={admin} />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
  );
}
