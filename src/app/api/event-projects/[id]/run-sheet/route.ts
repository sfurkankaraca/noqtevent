import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { generateRunSheetPdf, type RunSheetData } from "@/lib/generateRunSheetPdf";

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

  const [{ data: project }, { data: schedule }] = await Promise.all([
    supabase.from("event_projects").select("*").eq("id", id).single(),
    supabase.from("event_schedule_items").select("time, title, description, assigned_to").eq("event_project_id", id).order("time").order("sort_order"),
  ]);

  if (!project) {
    return NextResponse.json({ error: "Etkinlik bulunamadı" }, { status: 404 });
  }
  if (!schedule || schedule.length === 0) {
    return NextResponse.json({ error: "Gün planı boş — önce Gün Planı sekmesinden program oluşturun." }, { status: 400 });
  }

  const data: RunSheetData = {
    clientName: project.client_name,
    eventType: project.event_type,
    eventDate: project.event_date,
    venueName: project.venue_name,
    venueCity: project.venue_city,
    generatedDate: new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
    schedule: schedule.map((s) => ({ time: s.time, title: s.title, description: s.description, assignedTo: s.assigned_to })),
  };

  try {
    const pdfBuffer = await generateRunSheetPdf(data);
    return new NextResponse(pdfBuffer.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="noqt-gun-plani-${project.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Run sheet PDF error:", err);
    return NextResponse.json({ error: "PDF oluşturulamadı" }, { status: 500 });
  }
}
