"use server";

import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function saveAssetRecord({
  category,
  label,
  publicUrl,
  filePath,
}: {
  category: string;
  label: string;
  publicUrl: string;
  filePath: string;
}) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("site_assets").insert({
    category,
    label,
    file_path: filePath,
    public_url: publicUrl,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/gorseller");
  revalidatePath("/");
}

export async function deleteAsset(id: string, filePath: string) {
  const supabase = createServiceClient();

  await supabase.storage.from("images").remove([filePath]);
  await supabase.from("site_assets").delete().eq("id", id);
  revalidatePath("/admin/gorseller");
}
