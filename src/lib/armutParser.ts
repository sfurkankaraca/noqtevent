// Armut bildirim e-postası → NormalizedLead adaptörü.
// İKİ farklı gerçek şablon canlı ingestion'dan doğrulandı:
//
//  Varyant A (etiketli):
//   "Yeni iş Fırsatı!" / "Merhaba Furkan," / "1 yeni iş fırsatın var!"
//   <Hizmet adı>  →  "Yer:" <şehir, ilçe (mesafe)>  →  "Zaman:" <8 Ağustos 2026>
//   "Detaylar:" <müşterinin asıl talebi>  →  "Teklif ver" + pazarlama şablonu
//
//  Varyant B (etiketsiz — 2026-07-21'de yakalandı):
//   "1 yeni iş fırsatın var!"
//   "Talepleri inceleyip ilgilendiklerine hemen teklif ver."  (sabit tanıtım cümlesi)
//   <Şehir, İlçe,>  →  <"Sadece fiyat bakıyorum" / tarih ifadesi>  →  <mesafe "### KM - # saat">
//   <Hizmet / detay soru-cevapları tek satırda, "/" ile ayrık>
//   "TEKLİF VER" (büyük harf) + pazarlama şablonu
//
// TASARIM İLKESİ: parser asla lead kaybettirmez — hiçbir varyant tanınmazsa
// ham metin description olur; AI analizi eksikleri zaten işaretler.

export type ParsedArmutLead = {
  customer_name: string | null;
  location: string | null;
  event_date: string | null; // YYYY-MM-DD
  description: string;
  looksLikeLead: boolean; // talep bildirimi mi, gürültü mü (fatura/pazarlama)
  armut_job_url: string | null; // "Teklif ver" butonunun linki — Armut panelinde talebi bulmak için
};

// Gmail mesaj gövdesinden (base64url decode edilmiş HTML) multipart parçaları çıkarır.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractGmailParts(payload: any): { text: string; html: string | null } {
  const decode = (b64: string) => Buffer.from(b64, "base64url").toString("utf8");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const walk = (part: any, mime: string): string | null => {
    if (!part) return null;
    if (part.mimeType === mime && part.body?.data) return decode(part.body.data);
    for (const child of part.parts ?? []) {
      const found = walk(child, mime);
      if (found) return found;
    }
    return null;
  };
  const html = walk(payload, "text/html");
  const plain = walk(payload, "text/plain");
  if (plain) return { text: plain, html };
  if (html) return { text: htmlToText(html), html };
  if (payload?.body?.data) {
    const raw = decode(payload.body.data);
    return { text: htmlToText(raw), html: raw };
  }
  return { text: "", html: null };
}

// Türkçe büyük İ (nokta) ASCII regex'lerde küçük İ'ye katlanmaz (bkz. SQL'de
// yaşanan aynı hata) — "TEKLİF VER" gibi tamamı büyük harfli metinleri
// karşılaştırmadan önce normalize ediyoruz.
function trLower(text: string): string {
  return text.toLocaleLowerCase("tr-TR");
}

// "Teklif ver" CTA'sının href'i — Armut panelinde ilgili talebi doğrudan açar.
// Müşteri adı e-postada olmadığından bu, talebi bulmanın tek güvenilir yolu.
export function extractArmutJobUrl(html: string | null): string | null {
  if (!html) return null;
  const anchorRe = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = anchorRe.exec(html))) {
    const innerText = trLower(m[2].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
    if (/teklif\s*ver/.test(innerText)) {
      return m[1].replace(/&amp;/g, "&");
    }
  }
  return null;
}

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
    .replace(/&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

const NOISE_SUBJECT_HINTS = ["fatura", "ödeme", "odeme", "kampanya", "indirim", "bülten", "bulten", "şifre", "sifre"];
// Şablondaki pazarlama kuyruğunun başladığı satırlar (varyant B'de büyük harfli olabilir → trLower ile karşılaştırılır)
const TAIL_MARKERS_RE = /^(teklif ver|tüm iş fırsat|hızlı teklif|nasıl daha çok|teklif verme ücret|hemen indir|bizi takip)/;
function isTailMarker(line: string): boolean {
  return TAIL_MARKERS_RE.test(trLower(line));
}
// Varyant B'nin sabit tanıtım cümlesi — hizmet adı sanılmasın diye açıkça atlanır.
const GENERIC_TAGLINE_RE = /talepleri\s+inceleyip|ilgilendiklerine\s+(hemen\s+)?teklif/;
// "716.955 KM - 1 saat" gibi mesafe/süre satırları — bilgi taşımaz, atlanır.
const DISTANCE_LINE_RE = /^\d[\d.,]*\s*km\b/i;
// Varyant B'de "Zaman" için tipik durum ifadeleri (etiket yokken tanımak için)
const TIME_STATUS_HINTS = ["sadece fiyat bakıyorum", "içinde", "hafta", "yarın", "bugün"];

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

// Şehir/ilçe satırı sezgisi: "İzmir, Torbalı," gibi virgülle ayrılmış, büyük
// harfle başlayan 2-4 kısa kelime — soru işareti veya rakam içermez.
function looksLikeLocationLine(line: string): boolean {
  if (/[?!]/.test(line) || /\d/.test(line)) return false;
  const parts = line.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length < 1 || parts.length > 4) return false;
  return parts.every((p) => /^[A-ZÇĞİÖŞÜ][a-zçğıöşü]*$/.test(p) && p.length <= 24);
}

export function parseArmutEmail(input: {
  subject: string;
  from: string;
  bodyText: string;
  html?: string | null;
}): ParsedArmutLead {
  const subject = (input.subject ?? "").toLowerCase();
  const lines = (input.bodyText ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const fullText = lines.join("\n");
  const armut_job_url = extractArmutJobUrl(input.html ?? null);

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
      armut_job_url,
    };
  }

  const oppIdx = lines.findIndex((l) => /iş fırsatın var/i.test(l));
  const afterOpp = oppIdx >= 0 ? lines.slice(oppIdx + 1) : lines;

  // ── Varyant A: "Yer:"/"Zaman:"/"Detaylar:" etiketleri ──
  let service: string | null = afterOpp.find(
    (l) => l.length > 2 && !/^merhaba/i.test(l) && !/iş fırsat/i.test(l) && !isTailMarker(l) && !GENERIC_TAGLINE_RE.test(trLower(l))
  ) ?? null;
  if (service) {
    const variant = service.match(/^Yeni bir (.+?) talebi geldi/i);
    if (variant) service = variant[1].trim();
  }

  const rawLocationLabeled = labelValue(lines, /^yer\s*:/i) ?? labelValue(lines, /^yer$/i);
  const rawTimeLabeled = labelValue(lines, /^zaman\s*:/i) ?? labelValue(lines, /^zaman$/i);

  let detailsLabeled: string | null = null;
  const detIdx = lines.findIndex((l) => /^detaylar\s*:?\s*/i.test(l));
  if (detIdx >= 0) {
    const inline = lines[detIdx].replace(/^detaylar\s*:?\s*/i, "").trim();
    const rest: string[] = inline ? [inline] : [];
    for (const l of lines.slice(detIdx + 1)) {
      if (isTailMarker(l)) break;
      rest.push(l);
    }
    detailsLabeled = rest.join(" ").trim() || null;
  }

  let location: string | null = null;
  let rawTime: string | null = null;
  let details: string | null = null;

  if (rawLocationLabeled || rawTimeLabeled || detailsLabeled) {
    // Varyant A tanındı.
    location = rawLocationLabeled
      ? rawLocationLabeled.replace(/\s*\([^)]*km[^)]*\)\s*/gi, "").trim() || null
      : null;
    rawTime = rawTimeLabeled;
    details = detailsLabeled;
  } else {
    // ── Varyant B: etiketsiz, sırayla konum → durum/tarih → mesafe → hizmet+detay ──
    const candidates = afterOpp.filter((l) => !isTailMarker(l) && !GENERIC_TAGLINE_RE.test(trLower(l)));

    const locIdx = candidates.findIndex(looksLikeLocationLine);
    if (locIdx >= 0) {
      location = candidates[locIdx].replace(/,\s*$/, "");
    }

    const timeIdx = candidates.findIndex(
      (l, i) => i !== locIdx && !DISTANCE_LINE_RE.test(l) && TIME_STATUS_HINTS.some((h) => trLower(l).includes(h))
    );
    if (timeIdx >= 0) rawTime = candidates[timeIdx];

    // Hizmet+detay: konum/zaman/mesafe satırları dışında kalan ilk anlamlı satır.
    const serviceLine = candidates.find(
      (l, i) => i !== locIdx && i !== timeIdx && !DISTANCE_LINE_RE.test(l) && l.length > 3
    );
    if (serviceLine) {
      const firstSlash = serviceLine.indexOf("/");
      if (firstSlash > 0) {
        service = serviceLine.slice(0, firstSlash).trim();
        details = serviceLine.slice(firstSlash + 1).trim();
      } else {
        service = serviceLine;
      }
    }
  }

  const event_date = parseTurkishDate(rawTime ?? fullText);

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
    armut_job_url,
  };
}
