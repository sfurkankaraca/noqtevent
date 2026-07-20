// Sales OS — Katman 1/2 saf mantık: durum makinesi, allowlist'ler, AI çıktı
// doğrulama, takip günü hesabı. DB erişimi yok; her şey saf fonksiyon.
// AI çıktısına asla doğrudan güvenilmez — her alan buradaki doğrulayıcılardan geçer.

export const LEAD_SOURCES = [
  { id: "armut", label: "Armut" },
  { id: "gigbi", label: "Gigbi" },
  { id: "bark", label: "Bark" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "instagram", label: "Instagram" },
  { id: "website", label: "Website" },
  { id: "manual", label: "Manuel" },
] as const;

export const LEAD_STATUSES = [
  "new", "needs_review", "proposal_ready", "sent", "waiting", "won", "lost", "archived",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Yeni",
  needs_review: "İncelenecek",
  proposal_ready: "Yanıt Hazır",
  sent: "Gönderildi",
  waiting: "Bekliyor",
  won: "Kazanıldı",
  lost: "Kaybedildi",
  archived: "Arşiv",
};

export const LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-blue-50 text-blue-700 border-blue-200",
  needs_review: "bg-amber-50 text-amber-700 border-amber-200",
  proposal_ready: "bg-violet-50 text-violet-700 border-violet-200",
  sent: "bg-sky-50 text-sky-700 border-sky-200",
  waiting: "bg-orange-50 text-orange-700 border-orange-200",
  won: "bg-green-50 text-green-700 border-green-200",
  lost: "bg-red-50 text-red-700 border-red-200",
  archived: "bg-gray-100 text-gray-500 border-gray-200",
};

// İzinli durum geçişleri — UI yalnızca bunları sunar, action da bunları doğrular.
export const LEAD_TRANSITIONS: Record<LeadStatus, LeadStatus[]> = {
  new: ["needs_review", "proposal_ready", "archived"],
  needs_review: ["proposal_ready", "archived"],
  proposal_ready: ["sent", "archived"],
  sent: ["waiting", "won", "lost", "archived"],
  waiting: ["sent", "won", "lost", "archived"],
  won: ["archived"],
  lost: ["archived"],
  archived: ["new"],
};

export const LEAD_EVENT_LABELS: Record<string, string> = {
  created: "Lead oluşturuldu",
  ai_analyzed: "AI analizi tamamlandı",
  reply_generated: "Yanıt üretildi",
  reply_edited: "Yanıt düzenlendi",
  marked_sent: "Gönderildi olarak işaretlendi",
  customer_replied: "Müşteri yanıt verdi",
  followup_sent: "Takip mesajı gönderildi",
  call_made: "Arama yapıldı",
  status_changed: "Durum değişti",
  note_added: "Not eklendi",
};

// ── AI analiz çıktısı doğrulama ──────────────────────────────────────────────

export type LeadAnalysis = {
  event_type_guess: string | null;
  intent: "hot" | "warm" | "cold" | null;
  urgency: "this_week" | "this_month" | "flexible" | null;
  budget_signal: "stated" | "implied_low" | "implied_high" | "none";
  missing_info: string[];
  probability: number; // 1-5
  recommended_package: string | null;
  sales_notes: string;
  analyzed_at: string;
  model: string;
};

const INTENTS = ["hot", "warm", "cold"] as const;
const URGENCIES = ["this_week", "this_month", "flexible"] as const;
const BUDGET_SIGNALS = ["stated", "implied_low", "implied_high", "none"] as const;

export const INTENT_LABELS: Record<string, string> = {
  hot: "🔥 Sıcak", warm: "🌤 Ilık", cold: "❄️ Soğuk",
};
export const URGENCY_LABELS: Record<string, string> = {
  this_week: "Bu hafta", this_month: "Bu ay", flexible: "Esnek",
};
export const BUDGET_SIGNAL_LABELS: Record<string, string> = {
  stated: "Belirtilmiş", implied_low: "Düşük ima", implied_high: "Yüksek ima", none: "Sinyal yok",
};

export function validateLeadAnalysis(
  raw: unknown,
  opts: { validEventTypes: string[]; validPackages: string[]; model: string }
): LeadAnalysis {
  const obj = (raw ?? {}) as Record<string, unknown>;

  const eventGuess =
    typeof obj.event_type_guess === "string" && opts.validEventTypes.includes(obj.event_type_guess)
      ? obj.event_type_guess
      : null;

  const intent = INTENTS.includes(obj.intent as (typeof INTENTS)[number])
    ? (obj.intent as LeadAnalysis["intent"])
    : null;

  const urgency = URGENCIES.includes(obj.urgency as (typeof URGENCIES)[number])
    ? (obj.urgency as LeadAnalysis["urgency"])
    : null;

  const budgetSignal = BUDGET_SIGNALS.includes(obj.budget_signal as (typeof BUDGET_SIGNALS)[number])
    ? (obj.budget_signal as LeadAnalysis["budget_signal"])
    : "none";

  const missing = Array.isArray(obj.missing_info)
    ? obj.missing_info
        .filter((m): m is string => typeof m === "string")
        .map((m) => m.trim().slice(0, 60))
        .filter(Boolean)
        .slice(0, 5)
    : [];

  const probNum = typeof obj.probability === "number" ? Math.round(obj.probability) : 3;
  const probability = Math.min(5, Math.max(1, probNum));

  const pkg =
    typeof obj.recommended_package === "string" && opts.validPackages.includes(obj.recommended_package)
      ? obj.recommended_package
      : null;

  const notes =
    typeof obj.sales_notes === "string"
      ? obj.sales_notes.replace(/\s+/g, " ").trim().slice(0, 240)
      : "";

  return {
    event_type_guess: eventGuess,
    intent,
    urgency,
    budget_signal: budgetSignal,
    missing_info: missing,
    probability,
    recommended_package: pkg,
    sales_notes: notes,
    analyzed_at: new Date().toISOString(),
    model: opts.model,
  };
}

// Önerilen yanıt temizliği: link/AI-artığı temizle, uzunluğu sınırla.
export function sanitizeReply(raw: string): string {
  return (raw ?? "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/^["'\s]+|["'\s]+$/g, "")
    .trim()
    .slice(0, 900);
}

export function sanitizeLeadText(text: string, max = 4000): string {
  return (text ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
}

// ── Takip motoru (saf hesap — cron yok, otomasyon yok) ──────────────────────
// waiting durumundaki lead için hangi takip adımının zamanı geldi (1/2/3), yoksa null.

export const FOLLOWUP_SCHEDULE_DAYS = [1, 3, 7] as const;

export function followupDue(lead: {
  status: string;
  sent_at: string | null;
  last_followup_at: string | null;
  followup_count: number;
}, now = new Date()): number | null {
  if (lead.status !== "waiting" && lead.status !== "sent") return null;
  if (lead.followup_count >= FOLLOWUP_SCHEDULE_DAYS.length) return null;
  const anchor = lead.last_followup_at ?? lead.sent_at;
  if (!anchor) return null;
  const days = (now.getTime() - new Date(anchor).getTime()) / 86_400_000;
  const threshold = FOLLOWUP_SCHEDULE_DAYS[lead.followup_count];
  return days >= threshold ? lead.followup_count + 1 : null;
}
