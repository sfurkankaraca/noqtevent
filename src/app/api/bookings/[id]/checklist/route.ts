import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { isAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { DEFAULT_CHECKLIST_TEMPLATE } from "@/lib/checklistTemplate";

// GET — checklist_token yoksa üret, madde + yorum listesini döndür
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }
  const { id } = await params;
  const supabase = createServiceClient();

  let { data: booking } = await supabase
    .from("bookings")
    .select("id, checklist_token")
    .eq("id", id)
    .single();

  if (!booking) {
    return NextResponse.json({ error: "Booking bulunamadı" }, { status: 404 });
  }

  if (!booking.checklist_token) {
    const token = randomBytes(9).toString("hex");
    const { data: updated, error } = await supabase
      .from("bookings")
      .update({ checklist_token: token })
      .eq("id", id)
      .select("id, checklist_token")
      .single();
    if (!error && updated) booking = updated;
  }

  const [{ data: items }, { data: comments }] = await Promise.all([
    supabase.from("checklist_items").select("*").eq("booking_id", id).order("sort_order").order("created_at"),
    supabase.from("checklist_comments").select("*").eq("booking_id", id).order("created_at"),
  ]);

  return NextResponse.json({
    checklistToken: booking.checklist_token,
    items: items ?? [],
    comments: comments ?? [],
  });
}

// POST — tek madde ekle, ya da { seedTemplate: true } ile şablondan toplu oluştur
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
    const rows = DEFAULT_CHECKLIST_TEMPLATE.map((t, i) => ({
      booking_id: id,
      category: t.category,
      title: t.title,
      sort_order: i,
    }));
    const { data, error } = await supabase.from("checklist_items").insert(rows).select("*");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ items: data ?? [] });
  }

  const { category, title, description } = body;
  if (!category || !title) {
    return NextResponse.json({ error: "category ve title zorunlu" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("checklist_items")
    .insert({ booking_id: id, category, title, description: description ?? null })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

// PATCH — { itemId, is_done? , title?, description?, category? }
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

  const { data, error } = await supabase
    .from("checklist_items")
    .update(update)
    .eq("id", itemId)
    .eq("booking_id", id)
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
  const { error } = await supabase.from("checklist_items").delete().eq("id", itemId).eq("booking_id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
