"use server";

import { requireAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export type ToolkitSpec = { label: string; value: string };
export type ToolkitPackage = { name: string; price: string; description: string };

type ToolkitPayload = {
  id: string;
  slug: string | null;
  specs: ToolkitSpec[];
  packages: ToolkitPackage[];
};

export async function savePartnerToolkit(payload: ToolkitPayload) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("partner_profiles")
    .update({
      slug: payload.slug,
      tool_data: { specs: payload.specs, packages: payload.packages },
    })
    .eq("id", payload.id);

  if (error) throw new Error(error.message);

  revalidatePath(`/p/${payload.slug}`);
  revalidatePath(`/admin/ortaklar/${payload.id}/toolkit`);
}
