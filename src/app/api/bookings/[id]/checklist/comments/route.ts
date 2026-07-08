import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";

// POST — { itemId, body }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }
  const { id } = await params;
  const { itemId, body: text } = await req.json().catch(() => ({}));
  if (!itemId || !text) {
    return NextResponse.json({ error: "itemId ve body zorunlu" }, { status: 400 });
  }
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("checklist_comments")
    .insert({ item_id: itemId, booking_id: id, author_type: "admin", author_name: "NOQT", body: text })
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ comment: data });
}
