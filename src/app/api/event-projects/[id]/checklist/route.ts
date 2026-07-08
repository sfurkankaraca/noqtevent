import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";

// GET — madde + yorum listesini döndür
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: items }, { data: comments }] = await Promise.all([
    supabase.from("checklist_items").select("*").eq("event_project_id", id).order("sort_order").order("created_at"),
    supabase.from("checklist_comments").select("*").eq("event_project_id", id).order("created_at"),
  ]);

  return NextResponse.json({ items: items ?? [], comments: comments ?? [] });
}

// POST — tek madde ekle
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

  const { category, title, description, assigned_to } = body;
  if (!category || !title) {
    return NextResponse.json({ error: "category ve title zorunlu" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("checklist_items")
    .insert({ event_project_id: id, category, title, description: description ?? null, assigned_to: assigned_to ?? null })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

// PATCH — { itemId, is_done?, title?, description?, category?, assigned_to? }
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
  if (typeof rest.is_done === "boolean") {
    update.is_done = rest.is_done;
    update.done_by = rest.is_done ? "admin" : null;
    update.done_at = rest.is_done ? new Date().toISOString() : null;
  }
  if (typeof rest.title === "string") update.title = rest.title;
  if (typeof rest.description === "string" || rest.description === null) update.description = rest.description;
  if (typeof rest.category === "string") update.category = rest.category;
  if (typeof rest.assigned_to === "string" || rest.assigned_to === null) update.assigned_to = rest.assigned_to;

  const { data, error } = await supabase
    .from("checklist_items")
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
  const { error } = await supabase.from("checklist_items").delete().eq("id", itemId).eq("event_project_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
