// Tek seferlik: mevcut tüm lead'lerin ai_analysis.geo_tier / final_score alanlarını
// geriye dönük hesaplar. Saf hesap (src/lib/leads.ts'teki geoTierFromLocation/
// combineLeadScore ile birebir aynı mantık — modül çözümleme sorunlarına karşı
// buraya gömülü), AI çağrısı yok, maliyetsiz.
// Kullanım: npx tsx scripts/recompute_lead_scores.mts
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY gerekli (env olarak ver).");
  process.exit(1);
}
const supabase = createClient(url, key);

const GEO_TIER_5 = ["kayseri"];
const GEO_TIER_4 = ["nevsehir", "nevşehir", "sivas", "nigde", "niğde", "kirsehir", "kırşehir", "yozgat", "malatya", "kahramanmaras", "kahramanmaraş", "aksaray"];
const GEO_TIER_3 = ["konya", "adana", "elazig", "elazığ", "tokat", "amasya", "corum", "çorum", "gaziantep", "erzincan", "mersin", "osmaniye", "kirikkale", "kırıkkale"];
const GEO_TIER_2 = ["istanbul", "ankara", "izmir", "bursa", "antalya", "kocaeli", "eskisehir", "eskişehir", "samsun", "trabzon", "gebze", "kadikoy", "kadıköy", "besiktas", "beşiktaş"];

function normalizeCityText(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/i̇/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}

function geoTierFromLocation(location: string | null): number {
  if (!location) return 3;
  const norm = normalizeCityText(location);
  const hit = (list: string[]) => list.some((c) => norm.includes(normalizeCityText(c)));
  if (hit(GEO_TIER_5)) return 5;
  if (hit(GEO_TIER_4)) return 4;
  if (hit(GEO_TIER_3)) return 3;
  if (hit(GEO_TIER_2)) return 2;
  return 1;
}

function combineLeadScore(qualityProbability: number, geoTier: number): number {
  const q = Math.min(5, Math.max(1, qualityProbability));
  const g = Math.min(5, Math.max(1, geoTier));
  return Math.min(5, Math.max(1, Math.round((q + g) / 2)));
}

async function main() {
  const { data: leads, error } = await supabase
    .from("leads")
    .select("id, location, ai_analysis")
    .not("ai_analysis", "is", null);

  if (error) throw error;

  let updated = 0;
  for (const lead of leads ?? []) {
    const analysis = (lead.ai_analysis ?? {}) as Record<string, unknown>;
    const probability = typeof analysis.probability === "number" ? analysis.probability : 3;
    const geoTier = geoTierFromLocation(lead.location as string | null);
    const finalScore = combineLeadScore(probability, geoTier);

    if (analysis.geo_tier === geoTier && analysis.final_score === finalScore) continue;

    const { error: updErr } = await supabase
      .from("leads")
      .update({ ai_analysis: { ...analysis, geo_tier: geoTier, final_score: finalScore } })
      .eq("id", lead.id);
    if (updErr) {
      console.error(`Güncelleme hatası (${lead.id}):`, updErr.message);
      continue;
    }
    updated++;
  }

  console.log(`Toplam ${leads?.length ?? 0} lead tarandı, ${updated} tanesi güncellendi.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
