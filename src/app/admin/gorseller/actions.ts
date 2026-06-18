"use server";

import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function uploadAsset(formData: FormData) {
  const supabase = createServiceClient();
  const file = formData.get("file") as File;
  const category = formData.get("category") as string;
  const label = formData.get("label") as string;

  if (!file || !category || !label) throw new Error("Eksik alan");

  const ext = file.name.split(".").pop();
  const fileName = `${category}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("images")
    .upload(fileName, buffer, { contentType: file.type, upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const { data: urlData } = supabase.storage.from("images").getPublicUrl(fileName);

  const { error: dbError } = await supabase.from("site_assets").insert({
    category,
    label,
    file_path: fileName,
    public_url: urlData.publicUrl,
  });

  if (dbError) throw new Error(dbError.message);
  revalidatePath("/admin/gorseller");
}

export async function deleteAsset(id: string, filePath: string) {
  const supabase = createServiceClient();

  await supabase.storage.from("images").remove([filePath]);
  await supabase.from("site_assets").delete().eq("id", id);
  revalidatePath("/admin/gorseller");
}
