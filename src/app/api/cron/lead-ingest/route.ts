import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createServiceClient } from "@/lib/supabase";
import { ingestLead } from "@/lib/leadPipeline";
import { parseArmutEmail, htmlToText } from "@/lib/armutParser";

export const maxDuration = 300;

// Sales OS Hafta 2 — Gmail ingestion cron'u (vercel.json: 10 dakikada bir).
// Armut bildirim e-postalarını okur, parse eder, ortak pipeline'a verir.
// Idempotent: source_ref = gmail mesaj id'si → aynı e-posta ikinci kez lead olmaz.
// Kayıp yok: parse edilemeyen lead-benzeri e-posta ham metniyle düşer.

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

const GMAIL_QUERY = 'from:(armut.com) -in:spam';
const MAX_MESSAGES_PER_RUN = 10; // AI maliyet tavanı: koşu başına en fazla 10 yeni lead

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function headerValue(payload: any, name: string): string {
  const h = (payload?.headers ?? []).find(
    (h: { name?: string }) => h.name?.toLowerCase() === name.toLowerCase()
  );
  return h?.value ?? "";
}

// multipart gövdeden düz metin çıkar: önce text/plain, yoksa text/html → metin
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractBody(payload: any): string {
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
  const plain = walk(payload, "text/plain");
  if (plain) return plain;
  const html = walk(payload, "text/html");
  if (html) return htmlToText(html);
  if (payload?.body?.data) return htmlToText(decode(payload.body.data));
  return "";
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const refreshToken = process.env.GOOGLE_GMAIL_REFRESH_TOKEN;
  if (!refreshToken) {
    return NextResponse.json({
      skipped: true,
      reason: "GOOGLE_GMAIL_REFRESH_TOKEN tanımlı değil — /api/admin/gmail-auth ile bir kez yetkilendir.",
    });
  }

  const supabase = createServiceClient();
  const { data: state } = await supabase
    .from("ingestion_state")
    .select("*")
    .eq("source", "armut-gmail")
    .maybeSingle();

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2.setCredentials({ refresh_token: refreshToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2 });

  const counts = { scanned: 0, created: 0, duplicate: 0, noise: 0, errors: 0 };
  let newestInternalDate = state?.last_internal_date ? Number(state.last_internal_date) : 0;

  try {
    // İmleç: son işlenen mesajın internalDate'inden yenileri; ilk koşuda son 2 gün.
    const afterSec = newestInternalDate
      ? Math.floor(newestInternalDate / 1000)
      : Math.floor(Date.now() / 1000) - 2 * 86400;
    const q = `${GMAIL_QUERY} after:${afterSec}`;

    const list = await gmail.users.messages.list({ userId: "me", q, maxResults: 25 });
    const ids = (list.data.messages ?? []).map((m) => m.id!).filter(Boolean);

    for (const id of ids) {
      if (counts.created >= MAX_MESSAGES_PER_RUN) break;
      counts.scanned++;
      try {
        const msg = await gmail.users.messages.get({ userId: "me", id, format: "full" });
        const payload = msg.data.payload;
        const internalDate = Number(msg.data.internalDate ?? 0);
        const subject = headerValue(payload, "Subject");
        const from = headerValue(payload, "From");
        const bodyText = extractBody(payload);

        const parsed = parseArmutEmail({ subject, from, bodyText });
        if (!parsed.looksLikeLead) {
          counts.noise++;
          if (internalDate > newestInternalDate) newestInternalDate = internalDate;
          continue;
        }

        const result = await ingestLead({
          source: "armut",
          source_ref: `gmail-${id}`,
          customer_name: parsed.customer_name,
          event_date: parsed.event_date,
          location: parsed.location,
          description: parsed.description,
          raw_source_payload: {
            gmail_id: id,
            subject,
            from,
            internal_date: internalDate,
            // parser evrimi için ham gövde — ileride yeniden işlenebilir
            body: bodyText.slice(0, 8000),
          },
          created_via: "gmail",
        });

        if (result.outcome === "created") counts.created++;
        else if (result.outcome === "duplicate") counts.duplicate++;
        else counts.errors++;

        if (internalDate > newestInternalDate) newestInternalDate = internalDate;
      } catch (err) {
        counts.errors++;
        console.error(`lead-ingest mesaj hatası (${id}):`, err);
      }
    }

    await supabase.from("ingestion_state").upsert({
      source: "armut-gmail",
      last_checked_at: new Date().toISOString(),
      last_internal_date: newestInternalDate || null,
      last_error: null,
    });

    return NextResponse.json({ ok: true, ...counts });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";
    await supabase.from("ingestion_state").upsert({
      source: "armut-gmail",
      last_checked_at: new Date().toISOString(),
      last_error: message.slice(0, 500),
    });
    console.error("lead-ingest hatası:", err);
    return NextResponse.json({ ok: false, error: message, ...counts }, { status: 500 });
  }
}
