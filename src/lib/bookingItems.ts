import type { SupabaseClient } from "@supabase/supabase-js";

// Teklif kalemi: dj_profiles'a bağlı sanatçı veya serbest hizmet
export type BookingItemArtist = {
  id: string;
  name: string;
  slug: string | null;
  performer_type: string | null;
  photo_url: string | null;
};

export type BookingItem = {
  id: string;
  booking_id: string;
  kind: "artist" | "service";
  artist_id: string | null;
  title: string;
  description: string | null;
  amount: number;
  sort_order: number;
  dj_profiles: BookingItemArtist | null;
};

export function itemsTotal(items: Pick<BookingItem, "amount">[]): number {
  return items.reduce((s, i) => s + Number(i.amount || 0), 0);
}

export function artistProfileUrl(artistId: string): string {
  const base = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";
  return `${base}/sanatcilar/${artistId}`;
}

// Kalemleri sanatçı profilleriyle birlikte getirir.
// booking_items migration'ı henüz çalıştırılmadıysa boş liste döner — sayfayı kırmaz.
export async function fetchBookingItems(
  supabase: SupabaseClient,
  bookingId: string
): Promise<BookingItem[]> {
  const { data, error } = await supabase
    .from("booking_items")
    .select("*, dj_profiles(id, name, slug, performer_type, photo_url)")
    .eq("booking_id", bookingId)
    .order("sort_order", { ascending: true });
  if (error) return [];
  return (data ?? []) as BookingItem[];
}

// Kalemlerdeki sanatçı adlarını e-posta/sözleşme başlıkları için birleştirir
export function itemsArtistNames(items: BookingItem[]): string | null {
  const names = items
    .filter((i) => i.kind === "artist" && i.dj_profiles?.name)
    .map((i) => i.dj_profiles!.name);
  return names.length > 0 ? names.join(" + ") : null;
}
