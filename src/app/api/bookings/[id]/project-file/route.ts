import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { generateProjectFilePdf, type ProjectFileData } from "@/lib/generateProjectFilePdf";

export const maxDuration = 60;

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: booking }, { data: items }] = await Promise.all([
    supabase.from("bookings").select("*, dj_profiles(name, performer_type)").eq("id", id).single(),
    supabase.from("checklist_items").select("category, title, is_done").eq("booking_id", id).order("sort_order"),
  ]);

  if (!booking) {
    return NextResponse.json({ error: "Booking bulunamadı" }, { status: 404 });
  }

  const data: ProjectFileData = {
    bookingId: booking.id,
    generatedDate: new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
    client: { name: booking.client_name, email: booking.client_email, phone: booking.client_phone },
    event: {
      type: booking.event_type,
      date: booking.event_date,
      time: booking.event_time,
      duration: booking.event_duration_hours,
      venueName: booking.venue_name,
      venueCity: booking.venue_city,
      venueAddress: booking.venue_address,
    },
    artist: booking.dj_profiles ? { name: booking.dj_profiles.name, performer_type: booking.dj_profiles.performer_type } : null,
    items: items ?? [],
  };

  try {
    const pdfBuffer = await generateProjectFilePdf(data);
    return new NextResponse(pdfBuffer.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="noqt-proje-dosyasi-${booking.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Project file PDF error:", err);
    return NextResponse.json({ error: "PDF oluşturulamadı" }, { status: 500 });
  }
}
