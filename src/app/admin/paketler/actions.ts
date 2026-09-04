"use server";

import { createServiceClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";
import { revalidatePath } from "next/cache";

export type PackageRow = {
  id: string;
  slug: string;
  name: string;
  tag: string | null;
  emoji: string | null;
  description: string | null;
  includes: string[];
  suitable: string[];
  price_from: number | null;
  price_note: string | null;
  cta_text: string | null;
  cta_href: string | null;
  color: string | null;
  is_dark: boolean;
  is_active: boolean;
  sort_order: number;
};

export async function getPackages(): Promise<PackageRow[]> {
  // Bulgu 7: layout kontrolü server action çağrılarını korumaz — her export kendi kapısını açar.
  await requireAdmin();
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("packages")
    .select("*")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as PackageRow[];
}

export async function upsertPackage(pkg: Partial<PackageRow> & { slug: string }) {
  // Bulgu 7: layout kontrolü server action çağrılarını korumaz — her export kendi kapısını açar.
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("packages")
    .upsert(pkg, { onConflict: "slug" });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/paketler");
}

export async function deletePackage(id: string) {
  // Bulgu 7: layout kontrolü server action çağrılarını korumaz — her export kendi kapısını açar.
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase.from("packages").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/paketler");
}
