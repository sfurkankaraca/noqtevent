import { google } from "googleapis";
import { createServiceClient } from "@/lib/supabase";
import { ingestLead } from "@/lib/leadPipeline";
import { parseArmutEmail, extractGmailParts } from "@/lib/armutParser";

// Sales OS — tam geçmiş Armut e-posta taraması, tek sayfalık adım.
// Hem /api/admin/leads-backfill route'u hem admin panelindeki "Tüm Geçmişi Çek"
// butonu (server action) bu fonksiyonu çağırır — tek mantık, iki tetikleyici.

function headerValue(payload: unknown, name: string): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const h = ((payload as any)?.headers ?? []).find(
    (h: { name?: string }) => h.name?.toLowerCase() === name.toLowerCase()
  );
  return h?.value ?? "";
}

const GMAIL_QUERY = "from:(armut.com) -in:spam";
const PAGE_SIZE = 30;

export type BackfillStepResult = {
  done: boolean;
  has_more: boolean;
  total_processed: number;
  scanned: number;
  created: number;
  duplicate: number;
  noise: number;
  errors: number;
  already_complete?: boolean;
};

export async function runArmutBackfillStep(opts: { reset?: boolean } = {}): Promise<BackfillStepResult> {
  const refreshToken = process.env.GOOGLE_GMAIL_REFRESH_TOKEN;
  if (!refreshToken) throw new Error("GOOGLE_GMAIL_REFRESH_TOKEN tanımlı değil.");

  const supabase = createServiceClient();

  if (opts.reset) {
    await supabase.from("ingestion_state").upsert({
      source: "armut-gmail",
      backfill_page_token: null,
      backfill_done: false,
      backfill_processed: 0,
    });
  }

  const { data: state } = await supabase
    .from("ingestion_state")
    .select("*")
    .eq("source", "armut-gmail")
    .maybeSingle();

  if (state?.backfill_done) {
    return {
      done: true, has_more: false, already_complete: true,
      total_processed: state.backfill_processed ?? 0,
      scanned: 0, created: 0, duplicate: 0, noise: 0, errors: 0,
    };
  }

  const oauth2 = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  oauth2.setCredentials({ refresh_token: refreshToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2 });

  const counts = { scanned: 0, created: 0, duplicate: 0, noise: 0, errors: 0 };

  const list = await gmail.users.messages.list({
    userId: "me",
    q: GMAIL_QUERY,
    maxResults: PAGE_SIZE,
    pageToken: state?.backfill_page_token || undefined,
  });

  const ids = (list.data.messages ?? []).map((m) => m.id!).filter(Boolean);

  for (const id of ids) {
    counts.scanned++;
    try {
      const msg = await gmail.users.messages.get({ userId: "me", id, format: "full" });
      const payload = msg.data.payload;
      const internalDate = Number(msg.data.internalDate ?? 0);
      const subject = headerValue(payload, "Subject");
      const from = headerValue(payload, "From");
      const { text: bodyText, html: bodyHtml } = extractGmailParts(payload);

      const parsed = parseArmutEmail({ subject, from, bodyText, html: bodyHtml });
      if (!parsed.looksLikeLead) {
        counts.noise++;
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
          gmail_id: id, subject, from, internal_date: internalDate,
          armut_job_url: parsed.armut_job_url, body: bodyText.slice(0, 8000),
        },
        created_via: "gmail-backfill",
      });

      if (result.outcome === "created") counts.created++;
      else if (result.outcome === "duplicate") counts.duplicate++;
      else counts.errors++;
    } catch (err) {
      counts.errors++;
      console.error(`armut backfill mesaj hatası (${id}):`, err);
    }
  }

  const nextPageToken = list.data.nextPageToken ?? null;
  const done = !nextPageToken;
  const totalProcessed = (state?.backfill_processed ?? 0) + counts.scanned;

  await supabase.from("ingestion_state").upsert({
    source: "armut-gmail",
    backfill_page_token: nextPageToken,
    backfill_done: done,
    backfill_processed: totalProcessed,
    last_checked_at: new Date().toISOString(),
    last_error: null,
  });

  return { done, has_more: !done, total_processed: totalProcessed, ...counts };
}
