"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase";
import { rateLimit } from "@/lib/rateLimit";

export async function submitReview(data: {
  slug: string;
  rating: number;
  quote: string;
  name: string;
}) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { ok } = rateLimit(ip, "review-submit", { max: 5, windowMs: 60 * 60_000 });
  if (!ok) throw new Error("Çok fazla istek. Lütfen daha sonra tekrar deneyin.");

  const rating = Math.round(Number(data.rating));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) throw new Error("Geçerli bir puan seçin.");

  const quote = data.quote?.trim().slice(0, 1000);
  if (!quote) throw new Error("Lütfen birkaç kelime yazın.");

  const name = data.name?.trim().slice(0, 120) || "Misafir";

  const supabase = createServiceClient();
  const { data: booking, error: lookupError } = await supabase
    .from("bookings")
    .select("id, event_type, event_date, venue_city, dj_profiles(name)")
    .eq("delivery_slug", data.slug)
    .single();
  if (lookupError || !booking) throw new Error("Kayıt bulunamadı.");

  const eventLabel = [booking.event_type, booking.venue_city].filter(Boolean).join(" — ") || null;
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Yeni yorum onaya düşer (is_active=false) — admin panelinden yayınlanır
  const { error } = await supabase.from("testimonials").insert({
    quote,
    name,
    event: eventLabel,
    initials: initials || null,
    rating,
    is_active: false,
  });
  if (error) throw new Error(error.message);
}
