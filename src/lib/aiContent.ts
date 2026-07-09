import { generateText, generateImage } from "ai";
import { CATEGORY_LABELS, type ChecklistCategory, type CategoryDecision } from "./checklistTemplate";

// Vercel AI Gateway üzerinden — güncel model ID'leri https://ai-gateway.vercel.sh/v1/models ile teyit edildi
export const TEXT_MODEL = "anthropic/claude-sonnet-5";
export const IMAGE_MODEL = "google/imagen-4.0-fast-generate-001";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventProjectRow = Record<string, any>;
export type ChecklistItemRow = { category: ChecklistCategory; title: string; assigned_to: string | null };

export function buildEventContext(project: EventProjectRow, items: ChecklistItemRow[]): string {
  const lines: string[] = [];
  lines.push(`Müşteri: ${project.client_name}`);
  if (project.event_type) lines.push(`Etkinlik türü: ${project.event_type}`);
  if (project.event_date) lines.push(`Tarih: ${project.event_date}`);
  if (project.event_time) lines.push(`Saat: ${project.event_time}`);
  if (project.guest_count) lines.push(`Misafir sayısı: ${project.guest_count}`);
  if (project.venue_name) lines.push(`Mekan: ${project.venue_name}${project.venue_city ? ` (${project.venue_city})` : ""}`);
  if (project.budget) lines.push(`Bütçe: ${Number(project.budget).toLocaleString("tr-TR")} ₺`);

  const decisions = (project.decisions ?? {}) as Record<string, CategoryDecision>;
  const categoriesInUse = new Set(items.map((i) => i.category));
  if (categoriesInUse.size > 0) {
    lines.push("", "Dahil edilen kategoriler:");
    for (const cat of categoriesInUse) {
      const d = decisions[cat];
      const label = CATEGORY_LABELS[cat] ?? cat;
      const parts = [d?.vendor, d?.assignee ? `Sorumlu: ${d.assignee}` : null, d?.note].filter(Boolean);
      lines.push(`- ${label}${parts.length ? ` — ${parts.join(", ")}` : ""}`);
    }
  }
  return lines.join("\n");
}

async function textGateway(system: string, prompt: string): Promise<string> {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error("AI Gateway anahtarı tanımlı değil. Vercel proje ayarlarından AI_GATEWAY_API_KEY ekleyin.");
  }
  const { text } = await generateText({ model: TEXT_MODEL, system, prompt });
  return text;
}

export async function generateProjectBrief(context: string): Promise<string> {
  return textGateway(
    "Sen deneyimli bir etkinlik organizatörüsün. Verilen etkinlik bilgilerinden, organizatörün kullanacağı " +
    "detaylı bir Türkçe proje dosyası metni hazırlıyorsun. Markdown formatında, başlıklar ve maddeler kullan.",
    `Aşağıdaki etkinlik bilgilerinden kapsamlı bir proje dosyası hazırla (etkinlik özeti, aşama aşama plan, riskler ve öneriler dahil):\n\n${context}`
  );
}

export async function generateSponsorDoc(context: string): Promise<string> {
  return textGateway(
    "Sen bir etkinlik sponsorluk uzmanısın. Verilen etkinlik bilgilerinden, potansiyel sponsor firmalara sunulacak " +
    "ikna edici bir Türkçe sponsorluk dosyası metni hazırlıyorsun. Markdown formatında; etkinlik tanıtımı, hedef kitle, " +
    "sponsorluk paketleri (örnek: altın/gümüş/bronz) ve sponsorlara sağlanacak görünürlük/karşılıkları içersin.",
    `Aşağıdaki etkinlik bilgilerinden bir sponsorluk dosyası hazırla:\n\n${context}`
  );
}

export async function generateStrategyDoc(context: string): Promise<string> {
  return textGateway(
    "Sen bir dijital pazarlama ve etkinlik tanıtım uzmanısın. Verilen etkinlik bilgilerinden Türkçe bir paylaşım ve " +
    "reklam stratejisi metni hazırlıyorsun. Markdown formatında; sosyal medya paylaşım takvimi, içerik fikirleri, " +
    "hedef kitle/reklam hedefleme önerileri ve bütçe dağılımı içersin.",
    `Aşağıdaki etkinlik bilgilerinden bir paylaşım/reklam stratejisi hazırla:\n\n${context}`
  );
}

export async function generatePosterImage(context: string): Promise<{ uint8Array: Uint8Array; mediaType: string }> {
  if (!process.env.AI_GATEWAY_API_KEY) {
    throw new Error("AI Gateway anahtarı tanımlı değil. Vercel proje ayarlarından AI_GATEWAY_API_KEY ekleyin.");
  }
  const { image } = await generateImage({
    model: IMAGE_MODEL,
    prompt: `Şık, modern bir etkinlik afişi tasarımı. Etkinlik detayları:\n${context}\n` +
      "Görselde metin/yazı olmasın, sadece atmosferi ve konsepti yansıtan estetik bir kompozisyon olsun.",
    aspectRatio: "3:4",
  });
  return { uint8Array: image.uint8Array, mediaType: image.mediaType };
}
