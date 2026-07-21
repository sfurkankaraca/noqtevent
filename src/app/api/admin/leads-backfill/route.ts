import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { runArmutBackfillStep } from "@/lib/armutBackfill";

export const maxDuration = 300;

// Sales OS — tek seferlik, admin tetikli TAM geçmiş Armut e-posta taraması.
// Düzenli cron (lead-ingest) yalnızca ileriye akışı işler; bu uç kutudaki
// TÜM Armut bildirimlerini (tarih sınırı yok) sayfalayarak içeri alır.
// Bitene kadar tekrar tekrar çağrılması gerekir (bkz. admin panelindeki
// "Tüm Geçmişi Çek" butonu, aynı çekirdek mantığı otomatik döngüyle çağırır).
export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }
  try {
    const reset = new URL(req.url).searchParams.get("reset") === "1";
    const result = await runArmutBackfillStep({ reset });
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
