// Sales OS — paylaşılan lead işleme çekirdeği.
// Hem admin manuel girişi (actions.ts) hem cron ingestion (lead-ingest) bunu kullanır:
// tek insert yolu, tek AI analiz+yanıt yolu, tek olay günlüğü disiplini.
// Auth İÇERMEZ — çağıran katman kendi guard'ını uygular (requireAdmin / CRON_SECRET).

import { createServiceClient } from "@/lib/supabase";
import { analyzeLeadRaw, draftLeadReply, TEXT_MODEL } from "@/lib/aiContent";
import { EVENT_TYPES } from "@/components/planner/PlannerStore";
import { EVENT_TYPE_LABELS } from "@/lib/eventTypeLabels";
import {
  URGENCY_LABELS,
  validateLeadAnalysis,
  sanitizeReply,
  sanitizeLeadText,
  needsPortfolioLink,
  injectPortfolioLink,
  type LeadAnalysis,
} from "@/lib/leads";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LeadRow = Record<string, any>;

export async function logLeadEvent(leadId: string, type: string, data: Record<string, unknown> = {}) {
  const supabase = createServiceClient();
  await supabase.from("lead_events").insert({ lead_id: leadId, type, data });
}

// Analiz + yanıt üretimi — AI yoksa/hata verirse null döner, lead düşmez.
export async function runAnalysisAndReply(lead: LeadRow): Promise<{
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
    includePortfolio: needsPortfolioLink(lead.source),
  });

  // Sıra önemli: önce temizle (AI'ın uydurduğu URL'ler gider),
  // sonra kişiye özel landing linkini deterministik yerleştir.
  let reply = sanitizeReply(replyRaw);
  if (needsPortfolioLink(lead.source)) {
    reply = injectPortfolioLink(reply, lead.source, lead.landing_token).slice(0, 900);
  }

  return { analysis, reply };
}

export type IngestLeadInput = {
  source: string;
  source_ref?: string | null;
  customer_name?: string | null;
  event_type?: string | null;
  event_date?: string | null;
  location?: string | null;
  budget_text?: string | null;
  description: string;
  raw_source_payload?: Record<string, unknown> | null;
  created_via: string; // olay günlüğü için: 'manual' | 'gmail'
};

export type IngestResult =
  | { outcome: "created"; id: string }
  | { outcome: "duplicate" }
  | { outcome: "invalid"; reason: string };

// Tek insert yolu: dedupe + insert + created olayı + AI analiz/yanıt.
export async function ingestLead(input: IngestLeadInput): Promise<IngestResult> {
  const description = sanitizeLeadText(input.description);
  if (description.length < 5) return { outcome: "invalid", reason: "Talep metni boş." };
  if (input.event_type && !EVENT_TYPES.some((e) => e.id === input.event_type)) {
    return { outcome: "invalid", reason: "Geçersiz etkinlik türü." };
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
      raw_source_payload: input.raw_source_payload ?? null,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") return { outcome: "duplicate" };
    return { outcome: "invalid", reason: error.message };
  }

  await logLeadEvent(created.id, "created", { via: input.created_via, source: input.source });

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
          ...(created.event_type ? {} : result.analysis.event_type_guess ? { event_type: result.analysis.event_type_guess } : {}),
        })
        .eq("id", created.id);
      await logLeadEvent(created.id, "ai_analyzed", { probability: result.analysis.probability });
      await logLeadEvent(created.id, "reply_generated", { chars: result.reply.length });
    }
  } catch (err) {
    console.error("Lead AI analiz hatası:", err);
  }

  return { outcome: "created", id: created.id };
}
