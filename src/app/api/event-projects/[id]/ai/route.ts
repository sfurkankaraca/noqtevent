import { NextRequest, NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import {
  buildEventContext, generateProjectBrief, generateSponsorDoc, generateStrategyDoc, generatePosterImage, generateConceptDoc,
  type ChecklistItemRow, type ScheduleItemRow,
} from "@/lib/aiContent";

export const maxDuration = 120;

const VALID_TYPES = ["concept_doc", "project_brief", "sponsor_doc", "strategy", "poster"] as const;
type OutputType = (typeof VALID_TYPES)[number];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }
  const { id } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase.from("event_ai_outputs").select("*").eq("event_project_id", id);
  return NextResponse.json({ outputs: data ?? [] });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }
  const { id } = await params;
  const { type } = await req.json().catch(() => ({}));
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "Geçersiz tür." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const [{ data: project }, { data: items }, { data: schedule }] = await Promise.all([
    supabase.from("event_projects").select("*").eq("id", id).single(),
    supabase.from("checklist_items").select("category, title, assigned_to").eq("event_project_id", id),
    supabase.from("event_schedule_items").select("time, title, assigned_to").eq("event_project_id", id).order("time"),
  ]);

  if (!project) {
    return NextResponse.json({ error: "Etkinlik bulunamadı" }, { status: 404 });
  }

  const context = buildEventContext(project, (items ?? []) as ChecklistItemRow[], (schedule ?? []) as ScheduleItemRow[]);

  try {
    let content: string;

    if ((type as OutputType) === "poster") {
      const { uint8Array, mediaType } = await generatePosterImage(context);
      const bucket = "event-posters";
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets?.some((b) => b.name === bucket)) {
        await supabase.storage.createBucket(bucket, { public: true });
      }
      const ext = mediaType.includes("png") ? "png" : "jpg";
      const fileName = `${id}/afis-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, uint8Array, { contentType: mediaType, upsert: true });
      if (uploadError) throw new Error(uploadError.message);
      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(fileName);
      content = pub.publicUrl;
    } else if (type === "concept_doc") {
      content = await generateConceptDoc(context);
    } else if (type === "project_brief") {
      content = await generateProjectBrief(context);
    } else if (type === "sponsor_doc") {
      content = await generateSponsorDoc(context);
    } else {
      content = await generateStrategyDoc(context);
    }

    const { data: output, error } = await supabase
      .from("event_ai_outputs")
      .upsert({ event_project_id: id, type, content }, { onConflict: "event_project_id,type" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    return NextResponse.json({ output });
  } catch (err) {
    console.error("AI content generation error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Üretilemedi" }, { status: 500 });
  }
}
