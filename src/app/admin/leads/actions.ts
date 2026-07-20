"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { analyzeLeadRaw, draftLeadReply } from "@/lib/aiContent";
import { EVENT_TYPES } from "@/components/planner/PlannerStore";
import { EVENT_TYPE_LABELS } from "@/lib/eventTypeLabels";
import {
  LEAD_SOURCES,
  LEAD_TRANSITIONS,
  URGENCY_LABELS,
  type LeadStatus,
  validateLeadAnalysis,
  sanitizeReply,
  sanitizeLeadText,
  type LeadAnalysis,
} from "@/lib/leads";
import { TEXT_MODEL } from "@/lib/aiContent";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeadRow = Record<string, any>;

async function logEvent(leadId: string, type: string, data: Record<string, unknown> = {}) {
  const supabase = createServiceClient();
  await supabase.from("lead_events").insert({ lead_id: leadId, type, data });
}

// ── Analiz + yanıt üretimi (tek yerden; oluşturma ve "yeniden analiz" kullanır) ──

async function runAnalysisAndReply(lead: LeadRow): Promise<{
  analysis: LeadAnalysis;
  reply: string;
} | null> {
  if (!process.env.AI_GATEWAY_API_KEY) return null;

  const supabase = createServiceClient();
  const { data: packages } = await supabase
    .from("packages")
    .select("name")
    .eq("is_active", true);
  const packageNames = (packages ?? []).map((p) => p.name as string);

  const knownFields = [
    lead.customer_name && `Ad: ${lead.customer_name}`,
    lead.event_type && `Etkinlik: ${EVENT_TYPE_LABELS[lead.event_type] ?? lead.event_type}`,
    lead.event_date && `Tarih: ${lead.event_date}`,
    lead.location && `Konum: ${lead.location}`,
    lead.budget_text && `Bütçe (ham): ${lead.budget_text}`,
  ].filter(Boolean).join(" | ");

  const { parsed } = await analyzeLeadRaw({
    source: lead.source,
    knownFields,
    description: lead.description,
    eventTypeCatalog: EVENT_TYPES.map((e) => ({ id: e.id, label: e.label })),
    packageCatalog: packageNames,
  });

  const analysis = validateLeadAnalysis(parsed, {
    validEventTypes: EVENT_TYPES.map((e) => e.id),
    validPackages: packageNames,
    model: TEXT_MODEL,
  });

  const analysisSummary = [
    analysis.event_type_guess && `Tür: ${EVENT_TYPE_LABELS[analysis.event_type_guess] ?? analysis.event_type_guess}`,
    analysis.urgency && `Aciliyet: ${URGENCY_LABELS[analysis.urgency]}`,
    lead.event_date && `Tarih: ${lead.event_date}`,
  ].filter(Boolean).join(" | ");

  const replyRaw = await draftLeadReply({
    customerName: lead.customer_name,
    description: lead.description,
    analysisSummary: analysisSummary || "detay yok",
    missingInfo: analysis.missing_info,
  });

  return { analysis, reply: sanitizeReply(replyRaw) };
}

// ── Lead oluşturma ───────────────────────────────────────────────────────────

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
  const description = sanitizeLeadText(input.description);
  if (description.length < 5) throw new Error("Talep metni zorunludur.");
  if (input.event_type && !EVENT_TYPES.some((e) => e.id === input.event_type)) {
    throw new Error("Geçersiz etkinlik türü.");
  }

  const supabase = createServiceClient();
  const { data: created, error } = await supabase
    .from("leads")
    .insert({
      source: input.source,
      source_ref: input.source_ref?.trim().slice(0, 120) || null,
      customer_name: input.customer_name?.trim().slice(0, 120) || null,
      event_type: input.event_type || null,
      event_date: input.event_date || null,
      location: input.location?.trim().slice(0, 160) || null,
      budget_text: input.budget_text?.trim().slice(0, 160) || null,
      description,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("Bu kaynak referansıyla zaten bir lead var.");
    throw new Error(error.message);
  }

  await logEvent(created.id, "created", { source: input.source });

  // AI analiz + yanıt — hata lead'i düşürmez, needs_review'da kalır.
  try {
    const result = await runAnalysisAndReply(created);
    if (result) {
      await supabase
        .from("leads")
        .update({
          ai_analysis: result.analysis,
          suggested_reply: result.reply,
          reply_history: [{ text: result.reply, generated_at: new Date().toISOString(), edited: false }],
          status: "needs_review",
          // AI türü tahmin ettiyse ve insan girmemişse öneriyi alana yaz (insan değiştirebilir)
          ...(created.event_type ? {} : result.analysis.event_type_guess ? { event_type: result.analysis.event_type_guess } : {}),
        })
        .eq("id", created.id);
      await logEvent(created.id, "ai_analyzed", { probability: result.analysis.probability });
      await logEvent(created.id, "reply_generated", { chars: result.reply.length });
    }
  } catch (err) {
    console.error("Lead AI analiz hatası:", err);
  }

  revalidatePath("/admin/leads");
  return { id: created.id };
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
