import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/adminAuth";
import { generateContractPdf, type ContractData } from "@/lib/generateContractPdf";
import { sendBookingContractEmails } from "@/lib/email";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createServiceClient();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, dj_profiles(name, performer_type, city, email)")
    .eq("id", id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Booking bulunamadı" }, { status: 404 });
  }

  const contractData: ContractData = {
    bookingId: booking.id,
    contractDate: new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
    client: {
      name: booking.client_name,
      email: booking.client_email,
      phone: booking.client_phone,
    },
    artist: {
      name: booking.dj_profiles?.name ?? "—",
      performer_type: booking.dj_profiles?.performer_type,
      city: booking.dj_profiles?.city,
    },
    event: {
      type: booking.event_type,
      date: booking.event_date,
      time: booking.event_time,
      duration: booking.event_duration_hours,
      venueName: booking.venue_name,
      venueCity: booking.venue_city,
      venueAddress: booking.venue_address,
    },
    financial: {
      fee: booking.fee,
      commissionRate: booking.commission_rate,
      depositRate: booking.deposit_rate,
      advanceAmount: booking.advance_amount,
      travelRequired: booking.travel_required,
      accommodationRequired: booking.accommodation_required,
    },
    notes: booking.notes,
  };

  try {
    const pdfBuffer = await generateContractPdf(contractData);

    // Supabase Storage'a yükle (görseller de bu "images" bucket'ında tutuluyor)
    const fileName = `contracts/${booking.id}/sozlesme-${Date.now()}.pdf`;
    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(fileName, pdfBuffer, { contentType: "application/pdf", upsert: true });

    let contractUrl: string | null = null;
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from("images").getPublicUrl(fileName);
      contractUrl = urlData.publicUrl;

      // Booking'e kaydet
      await supabase.from("bookings").update({ contract_url: contractUrl }).eq("id", booking.id);
    } else {
      console.error("Contract upload error:", uploadError.message);
    }

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
