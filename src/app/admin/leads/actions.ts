"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { EVENT_TYPES } from "@/components/planner/PlannerStore";
import {
  LEAD_SOURCES,
  LEAD_TRANSITIONS,
  type LeadStatus,
  sanitizeReply,
} from "@/lib/leads";
import { ingestLead, runAnalysisAndReply, logLeadEvent as logEvent } from "@/lib/leadPipeline";
import { updateOfferOptions } from "../bookings/actions";

const toSlug = (s: string) =>
  s.toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

// ── Lead oluşturma — ortak pipeline üzerinden (cron ile aynı yol) ────────────

export async function createLead(input: {
  source: string;
  source_ref?: string;
  customer_name?: string;
  event_type?: string;
  event_date?: string;
  location?: string;
  budget_text?: string;
  description: string;
}): Promise<{ id: string }> {
  await requireAdmin();

  if (!LEAD_SOURCES.some((s) => s.id === input.source)) throw new Error("Geçersiz kaynak.");

  const result = await ingestLead({ ...input, created_via: "manual" });
  if (result.outcome === "duplicate") throw new Error("Bu kaynak referansıyla zaten bir lead var.");
  if (result.outcome === "invalid") throw new Error(result.reason);

  revalidatePath("/admin/leads");
  return { id: result.id };
}

export async function createLeadAndRedirect(input: Parameters<typeof createLead>[0]) {
  const { id } = await createLead(input);
  redirect(`/admin/leads/${id}`);
}

// ── Yeniden analiz / yeniden yanıt ───────────────────────────────────────────

export async function regenerateAnalysis(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { data: lead } = await supabase.from("leads").select("*").eq("id", id).single();
  if (!lead) throw new Error("Lead bulunamadı.");

  const result = await runAnalysisAndReply(lead);
  if (!result) throw new Error("AI Gateway anahtarı tanımlı değil.");

  const history = Array.isArray(lead.reply_history) ? lead.reply_history : [];
  await supabase
    .from("leads")
    .update({
      ai_analysis: result.analysis,
      suggested_reply: result.reply,
      reply_history: [...history, { text: result.reply, generated_at: new Date().toISOString(), edited: false }].slice(-10),
    })
    .eq("id", id);

  await logEvent(id, "ai_analyzed", { probability: result.analysis.probability, regenerated: true });
  await logEvent(id, "reply_generated", { chars: result.reply.length, regenerated: true });
  revalidatePath(`/admin/leads/${id}`);
}

// ── Yanıt düzenleme / gönderildi işaretleme ──────────────────────────────────

export async function saveEditedReply(id: string, text: string) {
  await requireAdmin();
  const clean = sanitizeReply(text);
  const supabase = createServiceClient();
  const { data: lead } = await supabase.from("leads").select("reply_history").eq("id", id).single();
  const history = Array.isArray(lead?.reply_history) ? lead.reply_history : [];
  await supabase
    .from("leads")
    .update({
      suggested_reply: clean,
      reply_history: [...history, { text: clean, generated_at: new Date().toISOString(), edited: true }].slice(-10),
    })
    .eq("id", id);
  await logEvent(id, "reply_edited", { chars: clean.length });
  revalidatePath(`/admin/leads/${id}`);
}

export async function markSent(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  await supabase
    .from("leads")
    .update({ status: "waiting", sent_at: new Date().toISOString() })
    .eq("id", id);
  await logEvent(id, "marked_sent", {});
  await logEvent(id, "status_changed", { to: "waiting", via: "marked_sent" });
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin/leads");
}

// ── Durum makinesi ───────────────────────────────────────────────────────────

export async function changeLeadStatus(id: string, to: LeadStatus, lostReason?: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { data: lead } = await supabase.from("leads").select("status").eq("id", id).single();
  if (!lead) throw new Error("Lead bulunamadı.");

  const allowed = LEAD_TRANSITIONS[lead.status as LeadStatus] ?? [];
  if (!allowed.includes(to)) {
    throw new Error(`${lead.status} → ${to} geçişine izin yok.`);
  }

  await supabase
    .from("leads")
    .update({
      status: to,
      ...(to === "lost" && lostReason ? { lost_reason: lostReason.trim().slice(0, 200) } : {}),
    })
    .eq("id", id);

  await logEvent(id, "status_changed", { from: lead.status, to });
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin/leads");
}

export async function updateLeadNotes(id: string, notes: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  await supabase.from("leads").update({ admin_notes: notes.slice(0, 2000) }).eq("id", id);
  await logEvent(id, "note_added", {});
  revalidatePath(`/admin/leads/${id}`);
}

export async function updateLeadFields(id: string, fields: {
  customer_name?: string; event_type?: string; event_date?: string;
  location?: string; budget_text?: string;
}) {
  await requireAdmin();
  if (fields.event_type && !EVENT_TYPES.some((e) => e.id === fields.event_type)) {
    throw new Error("Geçersiz etkinlik türü.");
  }
  const supabase = createServiceClient();
  await supabase
    .from("leads")
    .update({
      customer_name: fields.customer_name?.trim().slice(0, 120) || null,
      event_type: fields.event_type || null,
      event_date: fields.event_date || null,
      location: fields.location?.trim().slice(0, 160) || null,
      budget_text: fields.budget_text?.trim().slice(0, 160) || null,
    })
    .eq("id", id);
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin/leads");
}

// ── Armut rapor yorumu ───────────────────────────────────────────────────────

export async function generateLeadReportComment(statsJson: string, samples: string[]): Promise<string> {
  await requireAdmin();
  const { interpretLeadReport } = await import("@/lib/aiContent");
  const text = await interpretLeadReport({
    statsJson: String(statsJson).slice(0, 4000),
    samples: (samples ?? []).slice(0, 12).map((s) => String(s).slice(0, 220)),
  });
  return text.trim().slice(0, 4000);
}

// ── Armut tam geçmiş taraması (backfill) ─────────────────────────────────────
// Tek sayfa işler; istemci "bitene kadar" bunu döngüyle çağırır (BackfillButton.tsx).

export async function backfillArmutStep(reset?: boolean) {
  await requireAdmin();
  const { runArmutBackfillStep } = await import("@/lib/armutBackfill");
  const result = await runArmutBackfillStep({ reset });
  revalidatePath("/admin/leads/rapor");
  revalidatePath("/admin/leads");
  return result;
}

// ── Arama hatırlatıcısı (Phase 1) ────────────────────────────────────────────

export async function setCallReminder(id: string, isoDatetime: string | null) {
  await requireAdmin();
  const supabase = createServiceClient();
  await supabase.from("leads").update({ call_reminder_at: isoDatetime }).eq("id", id);
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin/leads");
}

export async function markCallMade(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  await supabase.from("leads").update({ call_reminder_at: null }).eq("id", id);
  await logEvent(id, "call_made", {});
  revalidatePath(`/admin/leads/${id}`);
  revalidatePath("/admin/leads");
}

// ── Eski/pasif lead toplu arşivleme ──────────────────────────────────────────
// Backfill ile giren, hiç işlem görmemiş ve STALE_THRESHOLD_DAYS'ten eski
// (veya etkinlik tarihi geçmiş) lead'leri arşive taşır. Arşivleme geri
// alınabilir (archived → new geçişi tanımlı) — veri silinmez, sadece durum
// değişir. Kullanıcı bu butona kendisi basmadan hiçbir şey arşivlenmez.
export async function archiveStaleLeads(): Promise<{ archived: number }> {
  await requireAdmin();
  const supabase = createServiceClient();

  const { data: candidates } = await supabase
    .from("leads")
    .select("id, status, created_at, event_date")
    .in("status", ["new", "needs_review", "proposal_ready"]);

  const { isStaleLead } = await import("@/lib/leads");
  const staleIds = (candidates ?? []).filter((l) => isStaleLead(l)).map((l) => l.id);
  if (staleIds.length === 0) return { archived: 0 };

  await supabase.from("leads").update({ status: "archived" }).in("id", staleIds);
  await supabase.from("lead_events").insert(
    staleIds.map((id) => ({ lead_id: id, type: "status_changed", data: { to: "archived", via: "bulk_stale_archive" } }))
  );

  revalidatePath("/admin/leads");
  return { archived: staleIds.length };
}

// ── Takılı kalan (analiz edilememiş) lead'leri yeniden dene ──────────────────

export async function reanalyzeStuckLeadsStep(limit?: number) {
  await requireAdmin();
  const { reanalyzeStuckLeadsStep: run } = await import("@/lib/leadPipeline");
  const result = await run(limit);
  revalidatePath("/admin/leads");
  return result;
}

// ── Eski parser hatasıyla giren junk Armut lead'lerini düzelt ────────────────

export async function reprocessJunkArmutStep() {
  await requireAdmin();
  const { reprocessJunkArmutStep: run } = await import("@/lib/armutJunkReprocess");
  const result = await run();
  revalidatePath("/admin/leads");
  return result;
}

// ── Aylık trend grafiği — bir aya tıklandığında o ayın lead'lerini getir ────

export async function getLeadsForMonthAction(monthKey: string) {
  await requireAdmin();
  const { getLeadsForMonth } = await import("@/lib/monthlyStats");
  const rows = await getLeadsForMonth(monthKey);
  return rows.map((r) => ({ ...r, demand_date: r.demand_date.toISOString() }));
}

// ── Lead için kişiye özel teklif linki — sanatçı seçenekleri + konsept ──────
// Lead'in bağlı olduğu booking yoksa arka planda taslak bir booking oluşturup
// bağlar; varsa mevcut booking'i günceller. /teklif/[slug] altyapısını yeniden
// kullanır — yanıt metnine eklenecek linki döner.
export async function attachOfferToLead(
  leadId: string,
  options: { artistIds: string[]; conceptCategory: string | null }
): Promise<{ offerUrl: string }> {
  await requireAdmin();
  const supabase = createServiceClient();

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("id, customer_name, event_type, event_date, booking_id")
    .eq("id", leadId)
    .single();
  if (leadError || !lead) {
    if (leadError?.message.includes("column")) {
      throw new Error("Lead-booking bağlantısı migration'ı henüz Supabase'de çalıştırılmadı (20260724000000_add_lead_booking_link.sql).");
    }
    throw new Error("Lead bulunamadı.");
  }

  let bookingId: string = lead.booking_id;

  if (!bookingId) {
    const clientName = lead.customer_name?.trim() || "İsimsiz Müşteri";
    const offerSlug = `${toSlug(clientName)}-${leadId.slice(0, 6)}`;
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        client_name: clientName,
        event_type: lead.event_type ?? null,
        event_date: lead.event_date ?? null,
        fee: 0,
        status: "draft",
        offer_slug: offerSlug,
      })
      .select("id, offer_slug")
      .single();
    if (bookingError || !booking) throw new Error(bookingError?.message ?? "Taslak booking oluşturulamadı.");

    const { error: linkError } = await supabase.from("leads").update({ booking_id: booking.id }).eq("id", leadId);
    if (linkError) throw new Error(linkError.message);
    bookingId = booking.id;
  }

  await updateOfferOptions(bookingId, options);

  const { data: updated } = await supabase.from("bookings").select("offer_slug").eq("id", bookingId).single();
  if (!updated?.offer_slug) throw new Error("Teklif linki oluşturulamadı.");

  const BASE = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";
  revalidatePath(`/admin/leads/${leadId}`);
  return { offerUrl: `${BASE}/teklif/${updated.offer_slug}` };
}
