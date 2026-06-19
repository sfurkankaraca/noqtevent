"use server";

import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function upsertTestimonial(formData: FormData) {
  const supabase = createServiceClient();
  const id = formData.get("id") as string | null;

  const payload = {
    quote: formData.get("quote") as string,
    name: formData.get("name") as string,
    event: (formData.get("event") as string) || null,
    initials: (formData.get("initials") as string) || null,
    color: (formData.get("color") as string) || "bg-[oklch(0.88_0.055_65)]",
    dark: formData.get("dark") === "true",
    rating: parseInt(formData.get("rating") as string) || 5,
    is_active: formData.get("is_active") === "true",
    sort_order: parseInt(formData.get("sort_order") as string) || 0,
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const { error } = await supabase.from("testimonials").update(payload).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("testimonials").insert(payload);
    if (error) throw new Error(error.message);
  }

  revalidatePath("/admin/testimonials");
  revalidatePath("/");
}

export async function deleteTestimonial(formData: FormData) {
  const supabase = createServiceClient();
  const id = formData.get("id") as string;
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/testimonials");
  revalidatePath("/");
}
