import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { createAndStoreContract } from "@/lib/contract";
import { sendBookingContractEmails } from "@/lib/email";

export const maxDuration = 60;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await createAndStoreContract(id);
    if (!result) {
      return NextResponse.json({ error: "Booking bulunamadı" }, { status: 404 });
    }
    const { pdfBuffer, contractUrl, booking } = result;

    // E-posta gönder (fire-and-forget)
    sendBookingContractEmails({
      clientName: booking.client_name,
      clientEmail: booking.client_email,
      artistName: booking.dj_profiles?.name ?? "—",
      artistEmail: booking.dj_profiles?.email ?? null,
      eventType: booking.event_type,
      eventDate: booking.event_date,
      venueName: booking.venue_name,
      fee: booking.fee,
      depositAmount: booking.fee * ((booking.deposit_rate ?? 30) / 100),
      contractUrl,
      bookingId: booking.id,
    }).catch(console.error);

    // PDF'i direkt döndür (tarayıcıda açılır veya indirilir)
    return new NextResponse(pdfBuffer.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="noqt-sozlesme-${booking.id.slice(0, 8)}.pdf"`,
        "X-Contract-Url": contractUrl ?? "",
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return NextResponse.json({ error: "PDF oluşturulamadı" }, { status: 500 });
  }
}

// GET — mevcut sözleşmeyi döndür veya yeni oluştur
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return POST(req, context);
}
