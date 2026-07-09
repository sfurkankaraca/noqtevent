import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { DEFAULT_RUN_SHEET } from "@/lib/checklistTemplate";

// GET — gün planı satırlarını döndür
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }
  const { id } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("event_schedule_items")
    .select("*")
    .eq("event_project_id", id)
    .order("time")
    .order("sort_order");
  return NextResponse.json({ items: data ?? [] });
}

// POST — satır ekle, ya da { seedTemplate: true } ile şablondan oluştur
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }
  const { id } = await params;
  const supabase = createServiceClient();
  const body = await req.json().catch(() => ({}));

  if (body.seedTemplate) {
    const rows = DEFAULT_RUN_SHEET.map((t, i) => ({
      event_project_id: id,
      time: t.time,
      title: t.title,
      sort_order: i,
    }));
    const { data, error } = await supabase.from("event_schedule_items").insert(rows).select("*");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data ?? [] });
  }

  const { time, title, description, assigned_to } = body;
  if (!time || !title) {
    return NextResponse.json({ error: "time ve title zorunlu" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("event_schedule_items")
    .insert({ event_project_id: id, time, title, description: description ?? null, assigned_to: assigned_to ?? null })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

// PATCH — { itemId, time?, title?, description?, assigned_to? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }
  const { id } = await params;
  const supabase = createServiceClient();
  const body = await req.json().catch(() => ({}));
  const { itemId, ...rest } = body;
  if (!itemId) return NextResponse.json({ error: "itemId zorunlu" }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (typeof rest.time === "string") update.time = rest.time;
  if (typeof rest.title === "string") update.title = rest.title;
  if (typeof rest.description === "string" || rest.description === null) update.description = rest.description;
  if (typeof rest.assigned_to === "string" || rest.assigned_to === null) update.assigned_to = rest.assigned_to;

  const { data, error } = await supabase
    .from("event_schedule_items")
    .update(update)
    .eq("id", itemId)
    .eq("event_project_id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

// DELETE — ?itemId=...
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }
  const { id } = await params;
  const itemId = req.nextUrl.searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId zorunlu" }, { status: 400 });
  const supabase = createServiceClient();
  const { error } = await supabase.from("event_schedule_items").delete().eq("id", itemId).eq("event_project_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
