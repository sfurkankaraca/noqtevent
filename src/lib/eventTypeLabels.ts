// Planlayıcı etkinlik türü id → Türkçe etiket. Tek kaynak.
// EVENT_TYPES (src/components/planner/PlannerStore.ts) ile uyumlu tutulmalı.
// Saf veri olduğundan hem server (e-posta, admin RSC) hem client'tan güvenle
// import edilir — PlannerStore "use client" olduğu için runtime değeri
// server'a taşınamaz, bu yüzden ayrı bir modül.
export const EVENT_TYPE_LABELS: Record<string, string> = {
  wedding: "Düğün",
  engagement: "Nişan",
  "kina-gecesi": "Kına Gecesi",
  corporate: "Kurumsal Etkinlik",
  opening: "Açılış Etkinliği",
  "brand-launch": "Marka Lansmanı",
  "private-party": "Özel Parti",
  cocktail: "Mezuniyet",
  birthday: "Doğum Günü",
  bride: "Bride / Bekarlığa Veda",
  "morning-party": "Morning Party",
  "after-party": "After Party",
  // Eski kayıtlar için (artık planlayıcıda yok):
  sunset: "Sunset Session",
};

export function eventTypeLabel(id: string | null | undefined): string {
  if (!id) return "—";
  return EVENT_TYPE_LABELS[id] ?? id;
}
