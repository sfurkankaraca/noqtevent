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
