import type { SupabaseClient } from "@supabase/supabase-js";

// Çok seçenekli teklif paketi — bir booking'e bağlı, müşteri birini seçer.
export type OfferPackageLine = {
  title: string;
  description?: string | null;
  amount?: number | null;
};

export type OfferPackage = {
  id: string;
  booking_id: string;
  title: string;
  subtitle: string | null;
  fee: number;
  lines: OfferPackageLine[];
  is_recommended: boolean;
  sort_order: number;
};

// Migration henüz çalıştırılmadıysa boş liste döner — sayfayı kırmaz,
// paket bölümü sessizce gizlenir (booking_items ile aynı yaklaşım).
export async function fetchOfferPackages(
  supabase: SupabaseClient,
  bookingId: string
): Promise<OfferPackage[]> {
  const { data, error } = await supabase
    .from("booking_offer_packages")
    .select("*")
    .eq("booking_id", bookingId)
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []).map(normalizePackage);
}

export function normalizePackage(row: Record<string, unknown>): OfferPackage {
  const rawLines = row.lines;
  const lines: OfferPackageLine[] = Array.isArray(rawLines)
    ? (rawLines as Record<string, unknown>[])
        .filter((l) => l && typeof l === "object")
        .map((l) => ({
          title: String(l.title ?? "").trim(),
          description: l.description ? String(l.description) : null,
          amount: l.amount === null || l.amount === undefined ? null : Number(l.amount) || 0,
        }))
        .filter((l) => l.title.length > 0)
    : [];

  return {
    id: String(row.id),
    booking_id: String(row.booking_id),
    title: String(row.title ?? ""),
    subtitle: row.subtitle ? String(row.subtitle) : null,
    fee: Number(row.fee ?? 0),
    lines,
    is_recommended: Boolean(row.is_recommended),
    sort_order: Number(row.sort_order ?? 0),
  };
}

// Paket kolonu/tablosu eksikse (migration çalıştırılmadıysa) verilen hatayı tanır
export function isMissingPackageSchema(message: string | undefined | null): boolean {
  if (!message) return false;
  return /booking_offer_packages|selected_package_id|package_selected_at|schema cache/i.test(message);
}

export const PACKAGE_MIGRATION_HINT =
  "Teklif paketleri migration'ı henüz Supabase'de çalıştırılmadı (20260731120000_add_offer_packages.sql).";
