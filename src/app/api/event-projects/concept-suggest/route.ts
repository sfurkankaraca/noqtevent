import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { suggestConcepts, type ConceptRow } from "@/lib/aiContent";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }
  const basics = await req.json().catch(() => ({}));

  const supabase = createServiceClient();
  const { data: concepts } = await supabase
    .from("concepts")
    .select("slug, name, category, description, atmosphere, musical_direction, energy_level")
    .eq("is_active", true)
    .order("sort_order");

  if (!concepts || concepts.length === 0) {
    return NextResponse.json({ error: "Konsept kataloğu boş." }, { status: 404 });
  }

  try {
    const { suggestions, raw } = await suggestConcepts(basics, concepts as ConceptRow[]);
    const enriched = suggestions.map((s) => ({
      ...s,
      name: concepts.find((c) => c.slug === s.slug)?.name ?? s.slug,
    }));
    return NextResponse.json({ suggestions: enriched, raw });
  } catch (err) {
    console.error("Concept suggest error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Öneri üretilemedi" }, { status: 500 });
  }
}
