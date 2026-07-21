// Armut bildirim e-postası → NormalizedLead adaptörü.
// TASARIM İLKESİ: parser asla lead kaybettirmez — alan çıkaramazsa ham metin
// description olarak kalır ve AI analizi eksikleri zaten işaretler.
// Armut şablon değiştirirse en kötü durumda "az yapılandırılmış" lead düşer, sıfır değil.

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

// "12 Eylül 2026" / "12 eylül" → YYYY-MM-DD (yıl yoksa null — uydurmayız)
function parseTurkishDate(text: string): string | null {
  const m = text.match(/(\d{1,2})\s+(ocak|şubat|subat|mart|nisan|mayıs|mayis|haziran|temmuz|ağustos|agustos|eylül|eylul|ekim|kasım|kasim|aralık|aralik)\s+(\d{4})/i);
  if (!m) return null;
  const day = m[1].padStart(2, "0");
  const month = TR_MONTHS[m[2].toLowerCase()];
  return month ? `${m[3]}-${month}-${day}` : null;
}

// HTML e-postayı düz metne indirger (bağımlılıksız, yeterince iyi).
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const LEAD_SUBJECT_HINTS = ["talep", "yeni iş", "yeni is", "hizmet isteği", "hizmet istegi", "teklif iste"];
const NOISE_SUBJECT_HINTS = ["fatura", "ödeme", "odeme", "kampanya", "indirim", "bülten", "bulten", "şifre", "sifre"];

export function parseArmutEmail(input: {
  subject: string;
  from: string;
  bodyText: string; // düz metin (htmlToText'ten geçmiş olabilir)
}): ParsedArmutLead {
  const subject = (input.subject ?? "").toLowerCase();
  const text = (input.bodyText ?? "").trim();

  const isNoise = NOISE_SUBJECT_HINTS.some((h) => subject.includes(h));
  const hasLeadHint = LEAD_SUBJECT_HINTS.some((h) => subject.includes(h));
  // Gürültü değilse ve konu ipucu varsa VEYA gövde soru/talep kokuyorsa lead say
  const looksLikeLead = !isNoise && (hasLeadHint || /hizmet|etkinlik|düğün|dugun|organizasyon|dj/i.test(text));

  // "Ad Soyad:" / "Müşteri:" / "İsim:" kalıpları
  const nameMatch =
    text.match(/(?:ad soyad|müşteri|musteri|isim|ad)\s*[:\-]\s*([^\n|,]{2,60})/i);
  const customer_name = nameMatch ? nameMatch[1].trim().replace(/\s{2,}/g, " ") : null;

  // "Konum:" / "Şehir:" / "İlçe/Şehir" kalıpları
  const locMatch = text.match(/(?:konum|şehir|sehir|il|adres)\s*[:\-]\s*([^\n|,]{2,80})/i);
  const location = locMatch ? locMatch[1].trim() : null;

  const event_date = parseTurkishDate(text);

  return {
    customer_name,
    location,
    event_date,
    description: text.slice(0, 4000),
    looksLikeLead,
  };
}
