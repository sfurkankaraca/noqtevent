import { createServiceClient } from "@/lib/supabase";
import { parseArmutEmail } from "@/lib/armutParser";

// Founder katkısı (2026-07-21): Armut'un etiketsiz ikinci şablonu tanınmadan
// önce ~2300 lead, tanıtım cümlesini hizmet adı sanan hatalı bir açıklamayla
// içeri girdi (armutParser.ts'teki düzeltmeye bkz). Bu, o lead'leri STORED
// ham metinden (Gmail'e tekrar gitmeden) düzeltilmiş parser'la yeniden
// ayrıştırır. AI çağrısı YAPMAZ — sadece status='new'a çeker ki mevcut
// "Yeniden Analiz Et" (ReanalyzeBanner) mekanizması onları normal akışla
// analiz etsin. İki ayrı mekanizma yerine tek AI-çağırma yolu.

const JUNK_SIGNATURE = "Talepleri inceleyip";
const PAGE_SIZE = 50;

export type JunkReprocessStepResult = {
  done: boolean;
  processed: number;
  fixed: number;
  unfixable: number;
  remaining: number;
};

export async function reprocessJunkArmutStep(): Promise<JunkReprocessStepResult> {
  const supabase = createServiceClient();

  const { data: batch, count } = await supabase
    .from("leads")
    .select("id, description, raw_source_payload", { count: "exact" })
    .eq("source", "armut")
    .like("description", `%${JUNK_SIGNATURE}%`)
    .limit(PAGE_SIZE);

  if (!batch || batch.length === 0) {
    return { done: true, processed: 0, fixed: 0, unfixable: 0, remaining: 0 };
  }

  let fixed = 0;
  let unfixable = 0;

  for (const lead of batch) {
    const rawBody = lead.raw_source_payload?.body as string | undefined;
    const subject = (lead.raw_source_payload?.subject as string | undefined) ?? "";
    const from = (lead.raw_source_payload?.from as string | undefined) ?? "";

    if (!rawBody) {
      unfixable++;
      continue;
    }

    const parsed = parseArmutEmail({ subject, from, bodyText: rawBody });

    // Yeniden ayrıştırma da aynı hatalı imzayı üretirse (nadiren, üçüncü bir
    // varyant olabilir) — dokunma, bir sonraki parser düzeltmesini bekle.
    if (parsed.description.includes(JUNK_SIGNATURE)) {
      unfixable++;
      continue;
    }

    await supabase
      .from("leads")
      .update({
        location: parsed.location,
        event_date: parsed.event_date,
        description: parsed.description,
        status: "new", // ReanalyzeBanner bu lead'leri normal akışla analiz edecek
        ai_analysis: null,
        suggested_reply: null,
        reply_history: [],
      })
      .eq("id", lead.id);
    fixed++;
  }

  const remaining = Math.max(0, (count ?? batch.length) - batch.length);
  return { done: remaining === 0, processed: batch.length, fixed, unfixable, remaining };
}
