import { NextRequest, NextResponse } from "next/server";
import { generateContractPreview } from "@/lib/contract";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const maxDuration = 30;

// Teklif sayfasındaki müşteri sözleşmeyi PDF olarak görüntüleyip indirebilsin diye —
// offer_slug ile herkese açık (booking id'sine güvenilmez, tahmin edilemeyen slug korur).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = getClientIp(req);
  const { ok } = rateLimit(ip, "teklif-sozlesme", { max: 20, windowMs: 60_000 });
  if (!ok) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
  }

  const { slug } = await params;

  try {
    const pdfBuffer = await generateContractPreview(slug);
    if (!pdfBuffer) {
      return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 });
    }

    return new NextResponse(pdfBuffer.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="noqt-sozlesme-${slug}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[teklif sozlesme] PDF üretim hatası:", err);
    return NextResponse.json({ error: "Sözleşme oluşturulamadı." }, { status: 500 });
  }
}
