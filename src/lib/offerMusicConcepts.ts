import { MUSIC_CONCEPTS } from "@/components/planner/PlannerStore";

// Teklifte müşteriye sunulan müzik konsepti — planlayıcıdaki MUSIC_CONCEPTS'in
// teklif sayfası/PDF için sadeleştirilmiş, serileştirilebilir hali.
export type OfferMusicConcept = {
  id: string;
  name: string;
  emoji: string;
  categoryLabel: string;
  description: string;
  atmosphere: string[];
  musicalDirection: string[];
  energyLevel: number;
};

const CATEGORY_LABELS: Record<string, string> = {
  cocktail: "Kokteyl & Karşılama",
  celebration: "Ana Kutlama",
  traditional: "Geleneksel Dokunuşlar",
  "after-party": "After Party",
};

export const OFFER_MUSIC_CONCEPTS: OfferMusicConcept[] = MUSIC_CONCEPTS.map((c) => ({
  id: c.id,
  name: c.name,
  emoji: c.emoji,
  categoryLabel: CATEGORY_LABELS[c.category] ?? c.category,
  description: c.description,
  atmosphere: c.atmosphere,
  musicalDirection: c.musicalDirection,
  energyLevel: c.energyLevel,
}));

// Admin'in seçtiği sıra korunur; bilinmeyen id'ler atlanır
export function resolveOfferMusicConcepts(ids: unknown): OfferMusicConcept[] {
  if (!Array.isArray(ids)) return [];
  return ids
    .map((id) => OFFER_MUSIC_CONCEPTS.find((c) => c.id === id))
    .filter(Boolean) as OfferMusicConcept[];
}

// Liste fiyatı > geçerli fiyat ise iskonto bilgisi; yoksa null
export function calcDiscount(listPrice: unknown, fee: unknown): { listPrice: number; amount: number; rate: number } | null {
  const lp = Number(listPrice);
  const f = Number(fee);
  if (!Number.isFinite(lp) || !Number.isFinite(f) || lp <= 0 || lp <= f) return null;
  const amount = Math.round(lp - f);
  return { listPrice: Math.round(lp), amount, rate: Math.round((amount / lp) * 100) };
}
