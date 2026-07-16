import { NextRequest, NextResponse } from "next/server";
import { generateOfferPdfBySlug } from "@/lib/offerPdf";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

export const maxDuration = 30;

// Müşteri (ve admin) teklifi PDF olarak indirebilsin diye —
// offer_slug ile herkese açık (tahmin edilemeyen slug korur, sozlesme route'u ile aynı model).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ip = getClientIp(req);
  const { ok } = rateLimit(ip, "teklif-pdf", { max: 20, windowMs: 60_000 });
  if (!ok) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
  }

  const { slug } = await params;

  try {
    const pdfBuffer = await generateOfferPdfBySlug(slug);
    if (!pdfBuffer) {
      return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 });
    }

    return new NextResponse(pdfBuffer.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="noqt-teklif-${slug}.pdf"`,
      },
    });
  } catch (err) {
    console.error("[teklif pdf] PDF üretim hatası:", err);
    return NextResponse.json({ error: "Teklif PDF'i oluşturulamadı." }, { status: 500 });
  }
}
