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

  const [{ data: project }, { data: items }] = await Promise.all([
    supabase.from("event_projects").select("*").eq("id", id).single(),
    supabase.from("checklist_items").select("category, title, is_done, assigned_to").eq("event_project_id", id).order("sort_order"),
  ]);

  if (!project) {
    return NextResponse.json({ error: "Etkinlik bulunamadı" }, { status: 404 });
  }

  const data: ProjectFileData = {
    bookingId: project.id,
    generatedDate: new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }),
    client: { name: project.client_name, email: project.client_email, phone: project.client_phone },
    event: {
      type: project.event_type,
      date: project.event_date,
      time: project.event_time,
      venueName: project.venue_name,
      venueCity: project.venue_city,
      venueAddress: project.venue_address,
    },
    items: (items ?? []).map((i) => ({ category: i.category, title: i.title, is_done: i.is_done, assignedTo: i.assigned_to })),
  };

  try {
    const pdfBuffer = await generateProjectFilePdf(data);
    return new NextResponse(pdfBuffer.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="noqt-proje-dosyasi-${project.id.slice(0, 8)}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Project file PDF error:", err);
    return NextResponse.json({ error: "PDF oluşturulamadı" }, { status: 500 });
  }
}
