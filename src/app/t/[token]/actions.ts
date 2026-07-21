"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase";
import { rateLimit } from "@/lib/rateLimit";
import { GUEST_RANGES, BUDGET_LEVELS } from "@/lib/concierge";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VENUE_OPTS = ["var", "yok"];

export type LandingSubmission = {
  token: string;
  event_date?: string;
  guest_range?: string;
  budget_level?: string;
  venue_status?: string;
  location?: string;
  phone?: string;
  note?: string;
};

// Müşteri landing formu — public uç: token tahmin edilemez (uuid), rate limitli,
// tüm alanlar allowlist/uzunluk doğrulamalı. Hiçbir alan zorunlu değil:
// müşteri ne verirse o kazanç (founder ilkesi: müşteri kaçmamalı).
export async function submitLandingInfo(sub: LandingSubmission): Promise<{ ok: true }> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { ok } = rateLimit(ip, "lead-landing", { max: 10, windowMs: 60 * 60_000 });
  if (!ok) throw new Error("Çok fazla istek. Lütfen daha sonra tekrar deneyin.");

  if (!UUID_RE.test(sub.token)) throw new Error("Geçersiz bağlantı.");

  const supabase = createServiceClient();
  const { data: lead } = await supabase
    .from("leads")
    .select("id, status, budget_text, location, event_date, admin_notes")
    .eq("landing_token", sub.token)
    .single();
  if (!lead) throw new Error("Geçersiz bağlantı.");

  const guest = GUEST_RANGES.find((g) => g.id === sub.guest_range);
  const budget = BUDGET_LEVELS.find((b) => b.id === sub.budget_level);
  const venue = VENUE_OPTS.includes(sub.venue_status ?? "") ? sub.venue_status : null;
  const date = sub.event_date && /^\d{4}-\d{2}-\d{2}$/.test(sub.event_date) ? sub.event_date : null;
  const location = sub.location?.trim().slice(0, 160) || null;
  const phone = sub.phone?.replace(/[^\d+\s()-]/g, "").trim().slice(0, 30) || null;
  const note = sub.note?.replace(/\s+/g, " ").trim().slice(0, 600) || null;

  const captured = {
    ...(date ? { event_date: date } : {}),
    ...(guest ? { guest_range: guest.label } : {}),
    ...(budget ? { budget_level: budget.label } : {}),
    ...(venue ? { venue_status: venue } : {}),
    ...(location ? { location } : {}),
    ...(phone ? { phone } : {}),
    ...(note ? { note } : {}),
  };
  if (Object.keys(captured).length === 0) return { ok: true }; // boş gönderim — sessizce geç

  // Kanonik alanları güncelle (müşteri verisi kazanır); yapısal olmayanlar nota eklenir.
  const noteLines = [
    guest && `Misafir (landing): ${guest.label}`,
    budget && `Bütçe yaklaşımı (landing): ${budget.label}`,
    venue && `Mekan durumu (landing): ${venue === "var" ? "belli" : "arıyor"}`,
    phone && `Telefon (landing): ${phone}`,
    note && `Müşteri notu (landing): ${note}`,
  ].filter(Boolean).join("\n");

  await supabase
    .from("leads")
    .update({
      ...(date ? { event_date: date } : {}),
      ...(location ? { location } : {}),
      ...(budget && !lead.budget_text ? { budget_text: budget.label } : {}),
      ...(noteLines
        ? { admin_notes: [lead.admin_notes, noteLines].filter(Boolean).join("\n---\n") }
        : {}),
      // Müşteri yeni bilgi verdi — bekleyen lead tekrar incelemeye düşer, inbox'ta öne çıkar
      ...(["sent", "waiting"].includes(lead.status) ? { status: "needs_review" } : {}),
    })
    .eq("id", lead.id);

  await supabase.from("lead_events").insert({
    lead_id: lead.id,
    type: "landing_submitted",
    data: captured,
  });
  if (["sent", "waiting"].includes(lead.status)) {
    await supabase.from("lead_events").insert({
      lead_id: lead.id,
      type: "customer_replied",
      data: { via: "landing" },
    });
  }

  return { ok: true };
}
