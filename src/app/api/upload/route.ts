import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase";

export const maxDuration = 60;


const PUBLIC_FOLDERS = ["partners/logos", "partners/photos", "artists/photos", "artists/videos"];

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const folder = (formData.get("folder") as string) || "uploads";

  const isPublicFolder = PUBLIC_FOLDERS.some((f) => folder.startsWith(f));

  if (!isPublicFolder) {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!file || file.size === 0) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const ext = file.name.split(".").pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = createServiceClient();
  const { data, error } = await supabase.storage
    .from("images")
    .upload(path, buffer, { contentType: file.type, upsert: false });

  if (error) {
    console.error("Supabase upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("images").getPublicUrl(data.path);
  return NextResponse.json({ url: urlData.publicUrl, path: data.path });
}
