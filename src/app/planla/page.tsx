import type { Metadata } from "next";
import Link from "next/link";
import PlannerWizard from "@/components/planner/PlannerWizard";

export const metadata: Metadata = {
  title: "Deneyimini Tasarla",
  description:
    "Adım adım rehberlik eden deneyim planlayıcısı ile hayalindeki etkinliği tasarla.",
};

export default function PlanlaPage() {
  return (
    <div className="relative">
      {/* Back to home */}
      <Link
        href="/"
        className="fixed top-5 left-6 lg:left-8 z-50 text-xs tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
      >
        <span className="text-base">←</span> NOQT
      </Link>

      <PlannerWizard />
    </div>
  );
}
