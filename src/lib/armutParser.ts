// Armut bildirim e-postası → NormalizedLead adaptörü.
// Gerçek şablon (2026-07 canlı ingestion'dan doğrulandı):
//   "Yeni iş Fırsatı!" / "Merhaba Furkan," / "1 yeni iş fırsatın var!"
//   <Hizmet adı>  →  "Yer:" <şehir, ilçe (mesafe)>  →  "Zaman:" <8 Ağustos 2026>
//   "Detaylar:" <müşterinin asıl talebi>  →  "Teklif ver" + pazarlama şablonu
// TASARIM İLKESİ: parser asla lead kaybettirmez — şablon tanınmazsa ham metin
// description olur; AI analizi eksikleri zaten işaretler.

export type ParsedArmutLead = {
  customer_name: string | null;
  location: string | null;
  event_date: string | null; // YYYY-MM-DD
  description: string;
  looksLikeLead: boolean; // talep bildirimi mi, gürültü mü (fatura/pazarlama)
};

const TR_MONTHS: Record<string, string> = {
  ocak: "01", şubat: "02", subat: "02", mart: "03", nisan: "04", mayıs: "05", mayis: "05",
  haziran: "06", temmuz: "07", ağustos: "08", agustos: "08", eylül: "09", eylul: "09",
  ekim: "10", kasım: "11", kasim: "11", aralık: "12", aralik: "12",
};

// "12 Eylül 2026" → YYYY-MM-DD (yıl yoksa null — uydurmayız)
function parseTurkishDate(text: string): string | null {
  const m = text.match(/(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)\s+(\d{4})/i);
  if (!m) return null;
  const day = m[1].padStart(2, "0");
  const month = TR_MONTHS[m[2].toLowerCase()];
  return month ? `${m[3]}-${month}-${day}` : null;
}

// HTML e-postayı temiz satırlara indirger (bağımlılıksız).
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|td|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

const NOISE_SUBJECT_HINTS = ["fatura", "ödeme", "odeme", "kampanya", "indirim", "bülten", "bulten", "şifre", "sifre"];
// Şablondaki pazarlama kuyruğunun başladığı satırlar
const TAIL_MARKERS = /^(teklif ver|tüm iş fırsat|hızlı teklif|nasıl daha çok|teklif verme ücret|hemen indir|bizi takip)/i;

// "Etiket:" satırının inline veya bir sonraki satırdaki değerini bulur.
function labelValue(lines: string[], label: RegExp): string | null {
  for (let i = 0; i < lines.length; i++) {
    if (!label.test(lines[i])) continue;
    const inline = lines[i].replace(label, "").trim();
    if (inline) return inline;
    const next = lines[i + 1]?.trim();
    if (next && !/^[A-ZĞÜŞİÖÇa-zğüşıöç ]+:$/.test(next)) return next;
  }
  return null;
}

export function parseArmutEmail(input: {
  subject: string;
  from: string;
  bodyText: string;
}): ParsedArmutLead {
  const subject = (input.subject ?? "").toLowerCase();
  const lines = (input.bodyText ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const fullText = lines.join("\n");

  const isNoise = NOISE_SUBJECT_HINTS.some((h) => subject.includes(h));
  const isArmutTemplate = lines.some((l) => /iş fırsat/i.test(l));
  const looksLikeLead =
    !isNoise && (isArmutTemplate || /talep|hizmet|etkinlik|düğün|dugun|organizasyon|dj/i.test(fullText));

  if (!isArmutTemplate) {
    // Genel yedek yol: tanınmayan format — ham metin + jenerik alan çıkarımı
    const nameMatch = fullText.match(/(?:ad soyad|müşteri|musteri|isim)\s*[:\-]\s*([^\n|,]{2,60})/i);
    const locMatch = fullText.match(/(?:konum|şehir|sehir|adres)\s*[:\-]\s*([^\n|,]{2,80})/i);
    return {
      customer_name: nameMatch ? nameMatch[1].trim() : null,
      location: locMatch ? locMatch[1].trim() : null,
      event_date: parseTurkishDate(fullText),
      description: fullText.slice(0, 4000),
      looksLikeLead,
    };
  }

  // ── Armut şablon yolu ──
  // Hizmet adı: "... iş fırsatın var" satırından sonraki ilk anlamlı satır
  let service: string | null = null;
  const oppIdx = lines.findIndex((l) => /iş fırsatın var/i.test(l));
  if (oppIdx >= 0) {
    service = lines.slice(oppIdx + 1).find(
      (l) => l.length > 2 && !/^merhaba/i.test(l) && !TAIL_MARKERS.test(l)
    ) ?? null;
  }

  // Yer: "Ankara, Mamak (253.7 KM)" → mesafe parantezi atılır
  const rawLocation = labelValue(lines, /^yer\s*:/i) ?? labelValue(lines, /^yer$/i);
  const location = rawLocation
    ? rawLocation.replace(/\s*\([^)]*km[^)]*\)\s*/gi, "").trim() || null
    : null;

  const rawTime = labelValue(lines, /^zaman\s*:/i) ?? labelValue(lines, /^zaman$/i);
  const event_date = parseTurkishDate(rawTime ?? fullText);

  // Detaylar: "Detaylar:" ile pazarlama kuyruğu arasındaki satırlar
  let details: string | null = null;
  const detIdx = lines.findIndex((l) => /^detaylar\s*:?\s*/i.test(l));
  if (detIdx >= 0) {
    const inline = lines[detIdx].replace(/^detaylar\s*:?\s*/i, "").trim();
    const rest: string[] = inline ? [inline] : [];
    for (const l of lines.slice(detIdx + 1)) {
      if (TAIL_MARKERS.test(l)) break;
      rest.push(l);
    }
    details = rest.join(" ").trim() || null;
  }

  const description =
    [
      service && `Hizmet: ${service}`,
      location && `Yer: ${location}`,
      rawTime && `Zaman: ${rawTime}`,
      details && `Detaylar: ${details}`,
    ]
      .filter(Boolean)
      .join("\n") || fullText.slice(0, 4000);

  return {
    customer_name: null, // Armut müşteri adını e-postada vermez (telefonla ulaşılır)
    location,
    event_date,
    description: description.slice(0, 4000),
    looksLikeLead,
  };
}
