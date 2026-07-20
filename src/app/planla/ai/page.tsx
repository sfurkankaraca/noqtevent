import type { Metadata } from "next";
import Link from "next/link";
import ConciergeWizard from "./ConciergeWizard";
import { buildMonthOptions } from "@/lib/concierge";

// Server Action'lar (runConcierge içindeki AI çağrısı dahil) için zaman aşımı.
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "AI ile Planla — Saniyeler İçinde Kişisel Etkinlik Önerisi",
  description:
    "Birkaç soruya cevap ver, hayalindeki atmosferi anlat — sana özel konsept, sanatçı ve tahmini bütçe önerisini saniyeler içinde al.",
  alternates: { canonical: "https://www.noqt.events/planla/ai" },
};

export default function PlanlaAiPage() {
  // Ay seçenekleri sunucuda üretilir ki istemci/sunucu saat farkı doğrulamayı bozmasın.
  const monthOptions = buildMonthOptions();

  return (
    <div className="relative">
      <Link
        href="/"
        className="fixed top-5 left-6 lg:left-8 z-50 text-xs tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
      >
        <span className="text-base">←</span> NOQT
      </Link>

      <ConciergeWizard monthOptions={monthOptions} />
    </div>
  );
}
