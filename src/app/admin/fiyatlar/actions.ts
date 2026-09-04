"use server";

import { createServiceClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";
import { revalidatePath } from "next/cache";

export type PricingTier = {
  id: string;
  label: string;
  emoji: string;
  range_text: string;
  description: string | null;
  includes: string[];
  suitable: string[];
  is_featured: boolean;
  is_dark: boolean;
  color: string;
  sort_order: number;
  is_active: boolean;
};

export type PricingFactor = {
  id: string;
  factor: string;
  impact: string;
  sort_order: number;
  is_active: boolean;
};

export type PricingFaqItem = {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
};

const revalidate = () => {
  revalidatePath("/admin/fiyatlar");
  revalidatePath("/fiyatlar");
};

// ── Tiers ────────────────────────────────────────────────────────────────────

export async function getTiers(): Promise<PricingTier[]> {
  // Bulgu 7: layout kontrolü server action çağrılarını korumaz — her export kendi kapısını açar.
  await requireAdmin();
  const { data, error } = await createServiceClient()
    .from("pricing_tiers")
    .select("*")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as PricingTier[];
}

export async function upsertTier(tier: Partial<PricingTier> & { id?: string }) {
  // Bulgu 7: layout kontrolü server action çağrılarını korumaz — her export kendi kapısını açar.
  await requireAdmin();
  const supabase = createServiceClient();
  if (tier.id) {
    const { error } = await supabase.from("pricing_tiers").update(tier).eq("id", tier.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("pricing_tiers").insert(tier);
    if (error) throw new Error(error.message);
  }
  revalidate();
}

export async function deleteTier(id: string) {
  // Bulgu 7: layout kontrolü server action çağrılarını korumaz — her export kendi kapısını açar.
  await requireAdmin();
  const { error } = await createServiceClient().from("pricing_tiers").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidate();
}

// ── Factors ───────────────────────────────────────────────────────────────────

export async function getFactors(): Promise<PricingFactor[]> {
  // Bulgu 7: layout kontrolü server action çağrılarını korumaz — her export kendi kapısını açar.
  await requireAdmin();
  const { data, error } = await createServiceClient()
    .from("pricing_factors")
    .select("*")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as PricingFactor[];
}

export async function upsertFactor(f: Partial<PricingFactor> & { id?: string }) {
  // Bulgu 7: layout kontrolü server action çağrılarını korumaz — her export kendi kapısını açar.
  await requireAdmin();
  const supabase = createServiceClient();
  if (f.id) {
    const { error } = await supabase.from("pricing_factors").update(f).eq("id", f.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("pricing_factors").insert(f);
    if (error) throw new Error(error.message);
  }
  revalidate();
}

export async function deleteFactor(id: string) {
  // Bulgu 7: layout kontrolü server action çağrılarını korumaz — her export kendi kapısını açar.
  await requireAdmin();
  const { error } = await createServiceClient().from("pricing_factors").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidate();
}

// ── FAQ ───────────────────────────────────────────────────────────────────────

export async function getFaq(): Promise<PricingFaqItem[]> {
  // Bulgu 7: layout kontrolü server action çağrılarını korumaz — her export kendi kapısını açar.
  await requireAdmin();
  const { data, error } = await createServiceClient()
    .from("pricing_faq")
    .select("*")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return (data ?? []) as PricingFaqItem[];
}

export async function upsertFaqItem(item: Partial<PricingFaqItem> & { id?: string }) {
  // Bulgu 7: layout kontrolü server action çağrılarını korumaz — her export kendi kapısını açar.
  await requireAdmin();
  const supabase = createServiceClient();
  if (item.id) {
    const { error } = await supabase.from("pricing_faq").update(item).eq("id", item.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("pricing_faq").insert(item);
    if (error) throw new Error(error.message);
  }
  revalidate();
}

export async function deleteFaqItem(id: string) {
  // Bulgu 7: layout kontrolü server action çağrılarını korumaz — her export kendi kapısını açar.
  await requireAdmin();
  const { error } = await createServiceClient().from("pricing_faq").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidate();
}
