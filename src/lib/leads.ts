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
  landing_viewed: "🔗 Müşteri landing sayfasını görüntüledi",
  landing_submitted: "📝 Müşteri landing formunu doldurdu",
};

// ── AI analiz çıktısı doğrulama ──────────────────────────────────────────────

export type LeadAnalysis = {
  event_type_guess: string | null;
  intent: "hot" | "warm" | "cold" | null;
  urgency: "this_week" | "this_month" | "flexible" | null;
  budget_signal: "stated" | "implied_low" | "implied_high" | "none";
  missing_info: string[];
  probability: number; // 1-5 — AI'nın SADECE talep kalitesi (netlik/aciliyet/bütçe) yargısı
  recommended_package: string | null;
  sales_notes: string;
  analyzed_at: string;
  model: string;
  // Coğrafi skor deterministik hesaplanır (AI'dan gelmez) — bkz. geoTierFromLocation.
  // final_score = quality (probability) + geo birleşimi; listede/sıralamada gösterilen budur.
  geo_tier?: number; // 1-5
  final_score?: number; // 1-5, tabloda gösterilen ve sıralanan skor
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

// ── Coğrafi skor (founder kararı 2026-07-21) ─────────────────────────────────
// Kayseri merkezli bir işiz — aynı taleple bile olsa Kayseri/Kapadokya bölgesi
// bir müşteri, uzak bir ilden gelen müşteriden daha değerlidir (lojistik maliyet,
// hız, mevcut ilişki ağı). Bu YAPAY ZEKÂ'DAN GELMEZ: konum metninden deterministik
// eşlenir, böylece aynı şehir her zaman aynı skoru alır ve model bunu "unutamaz"
// ya da tutarsız yorumlayamaz.
//
// Kademeler saha gerçeğine göre kurulur, hassas mesafe hesabı değildir:
//  5 — Kayseri (merkez)
//  4 — Nevşehir/Kapadokya ve doğrudan komşu iller (aynı gün ulaşım, mevcut ağ)
//  3 — Orta Anadolu / bir günlük mesafe (bilinen ama uzak)
//  2 — Büyük metropoller (İstanbul/İzmir/Ankara vb.) — hacim var ama lojistik maliyetli
//  1 — Çok uzak / yurt dışı — pratikte hizmet zor
const GEO_TIER_5 = ["kayseri"];
const GEO_TIER_4 = ["nevsehir", "nevşehir", "sivas", "nigde", "niğde", "kirsehir", "kırşehir", "yozgat", "malatya", "kahramanmaras", "kahramanmaraş", "aksaray"];
const GEO_TIER_3 = ["konya", "adana", "elazig", "elazığ", "tokat", "amasya", "corum", "çorum", "gaziantep", "erzincan", "mersin", "osmaniye", "kirikkale", "kırıkkale"];
const GEO_TIER_2 = ["istanbul", "ankara", "izmir", "bursa", "antalya", "kocaeli", "eskisehir", "eskişehir", "samsun", "trabzon", "gebze", "kadikoy", "kadıköy", "besiktas", "beşiktaş"];
// Geri kalan her şey (81 il listesindeki uzak iller + tanınmayan metin) tier 1.

function normalizeCityText(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/i̇/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

// Konum metninden ("Kayseri, Melikgazi" veya "Ankara, Çankaya (12 KM)" gibi
// serbest metinlerden) il adını çıkarıp kademeye eşler. Tanınmayan/boş konum
// cezalandırılmaz da ödüllendirilmez de — nötr orta değer (3) döner.
export function geoTierFromLocation(location: string | null): number {
  if (!location) return 3;
  const norm = normalizeCityText(location);
  const hit = (list: string[]) => list.some((c) => norm.includes(normalizeCityText(c)));
  if (hit(GEO_TIER_5)) return 5;
  if (hit(GEO_TIER_4)) return 4;
  if (hit(GEO_TIER_3)) return 3;
  if (hit(GEO_TIER_2)) return 2;
  return 1;
}

// Kalite (AI'nın talep netliği/aciliyet/bütçe yargısı) ile coğrafi kademeyi
// eşit ağırlıkla birleştirir — founder kararı: konum "en önemli şeylerden biri",
// tek belirleyici değil. 1-5 aralığına yuvarlanır.
export function combineLeadScore(qualityProbability: number, geoTier: number): number {
  const q = Math.min(5, Math.max(1, qualityProbability));
  const g = Math.min(5, Math.max(1, geoTier));
  return Math.min(5, Math.max(1, Math.round((q + g) / 2)));
}

// ── Portfolyo linki (founder kararı 2026-07-21) ─────────────────────────────
// Pazar yeri müşterileri NOQT'u tanımaz — yanıta güven varlığı olarak portfolyo
// linki eklenir. Link ASLA AI'dan gelmez: AI [PORTFOLYO] yer tutucusu koyar,
// gerçek URL burada deterministik yerleştirilir (kaynak bazlı UTM ile).

export const SOURCES_WITH_PORTFOLIO = ["armut", "gigbi", "bark"] as const;
export const PORTFOLIO_PLACEHOLDER = "[PORTFOLYO]";

export function portfolioLinkFor(source: string): string {
  return `https://www.noqt.events/?utm_source=${encodeURIComponent(source)}&utm_medium=lead_reply`;
}

// Kişiye özel landing (founder kararı 2026-07-21): müşteri jenerik siteye değil,
// kendi talebine özel /t/[token] sayfasına gider — orada güven unsurları + eksik
// bilgileri bırakabileceği mini form var. Token varsa yanıt linki budur.
export function landingLinkFor(source: string, landingToken: string): string {
  return `https://www.noqt.events/t/${landingToken}?utm_source=${encodeURIComponent(source)}&utm_medium=lead_reply`;
}

export function needsPortfolioLink(source: string): boolean {
  return (SOURCES_WITH_PORTFOLIO as readonly string[]).includes(source);
}

// Yer tutucuyu gerçek linkle değiştirir; AI unutmuşsa sona doğal bir cümle ekler.
// landingToken verilirse kişiye özel landing linki, verilmezse jenerik portfolyo linki.
export function injectPortfolioLink(reply: string, source: string, landingToken?: string | null): string {
  const link = landingToken ? landingLinkFor(source, landingToken) : portfolioLinkFor(source);
  if (reply.includes(PORTFOLIO_PLACEHOLDER)) {
    return reply.split(PORTFOLIO_PLACEHOLDER).join(link);
  }
  return `${reply}\n\nÇalışmalarımıza ve talebinize özel sayfanıza buradan göz atabilirsiniz: ${link}`;
}

// Önerilen yanıt temizliği: AI-artığı ve yabancı linkleri temizle, uzunluğu sınırla.
// Kendi domain'imiz korunur — portfolyo linki (enjekte edilmiş veya elle eklenmiş) silinmez.
export function sanitizeReply(raw: string): string {
  return (raw ?? "")
    .replace(/https?:\/\/\S+/g, (url) => (url.includes("noqt.events") ? url : ""))
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

// ── Eski/pasif lead tespiti (founder kararı 2026-07-21) ──────────────────────
// Armut gibi pazar yerlerinde bir ilan "maksimum teklif sayısına ulaşınca"
// kapanır — geçmiş taraması (backfill) ile içeri alınan, hiç işlem görmemiş
// ve uzun süre önce gelmiş talepler artık gerçekte ölüdür. Bunları canlı
// inbox'tan ayırmazsak yüzlerce eski talep, gerçek/güncel olanları gömer.
export const STALE_THRESHOLD_DAYS = 14;
const PRE_CONTACT_STATUSES = ["new", "needs_review", "proposal_ready"];

export function isStaleLead(lead: {
  status: string;
  created_at: string;
  event_date: string | null;
}, now = new Date()): boolean {
  if (!PRE_CONTACT_STATUSES.includes(lead.status)) return false;
  if (lead.event_date && new Date(lead.event_date) < now) return true;
  const ageDays = (now.getTime() - new Date(lead.created_at).getTime()) / 86_400_000;
  return ageDays > STALE_THRESHOLD_DAYS;
}

// ── Gerçek "geliş" (talep) tarihi vs. sistem giriş zamanı ────────────────────
// "created_at" yalnızca lead'in BİZE ne zaman düştüğünü gösterir — backfill
// gibi geçmiş taraması sırasında bu, gerçek talep zamanından tamamen kopuk
// olabilir (bir yıllık e-posta tek günde işlenebilir). Armut için Gmail'in
// kendi zaman damgası (raw_source_payload.internal_date) gerçek "geliş"
// anıdır; bu alanı taşımayan kaynaklarda (WhatsApp/Website/Manuel) created_at
// zaten doğrudur (o an gerçekten geldiği an). "Tarih" (event_date) bambaşka
// bir şey — müşterinin talep ettiği HİZMET tarihi, bu fonksiyonla karıştırılmaz.
// İki şekilde de kabul eder: düz "internal_date" alanı (PostgREST JSON-path
// seçimiyle — raw_source_payload'ın TAMAMINI (her satırda ~8000 karakter ham
// e-posta metni) çekmeden sadece bu sayıyı almak için tercih edilir, bkz.
// page.tsx/DashboardStrip.tsx) ya da iç içe raw_source_payload.internal_date
// (tek satır çekimlerinde, ör. lead detay sayfası zaten "*" kullanıyor).
export function demandDate(lead: {
  created_at: string;
  internal_date?: number | null;
  raw_source_payload?: { internal_date?: number } | null;
}): Date {
  const internal = lead.internal_date ?? lead.raw_source_payload?.internal_date;
  if (typeof internal === "number" && internal > 0) return new Date(internal);
  return new Date(lead.created_at);
}
