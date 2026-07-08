import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { isAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { DEFAULT_CHECKLIST_TEMPLATE, type CategoryDecision, type ChecklistCategory } from "@/lib/checklistTemplate";

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    client_name, client_email, client_phone, event_type, event_date, event_time,
    guest_count, venue_name, venue_city, venue_address, budget, booking_id,
    decisions,
  } = body as {
    client_name?: string;
    client_email?: string | null;
    client_phone?: string | null;
    event_type?: string | null;
    event_date?: string | null;
    event_time?: string | null;
    guest_count?: number | null;
    venue_name?: string | null;
    venue_city?: string | null;
    venue_address?: string | null;
    budget?: number | null;
    booking_id?: string | null;
    decisions?: Record<string, CategoryDecision>;
  };

  if (!client_name?.trim()) {
    return NextResponse.json({ error: "client_name zorunlu" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const checklistToken = randomBytes(9).toString("hex");

  const { data: project, error } = await supabase
    .from("event_projects")
    .insert({
      client_name: client_name.trim(),
      client_email: client_email || null,
      client_phone: client_phone || null,
      event_type: event_type || null,
      event_date: event_date || null,
      event_time: event_time || null,
      guest_count: guest_count || null,
      venue_name: venue_name || null,
      venue_city: venue_city || null,
      venue_address: venue_address || null,
      budget: budget || null,
      booking_id: booking_id || null,
      decisions: decisions ?? {},
      checklist_token: checklistToken,
    })
    .select("id")
    .single();

  if (error || !project) {
    return NextResponse.json({ error: error?.message ?? "Etkinlik oluşturulamadı" }, { status: 500 });
  }

  const rows = DEFAULT_CHECKLIST_TEMPLATE
    .filter((t) => decisions?.[t.category]?.included !== false)
    .map((t, i) => ({
      event_project_id: project.id,
      category: t.category,
      title: t.title,
      sort_order: i,
      assigned_to: decisions?.[t.category as ChecklistCategory]?.assignee || null,
    }));

  if (rows.length > 0) {
    const { error: itemsError } = await supabase.from("checklist_items").insert(rows);
    if (itemsError) {
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ id: project.id });
}
