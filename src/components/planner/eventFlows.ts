import { MUSIC_CONCEPTS } from "./PlannerStore";

export type EventSlot = {
  label: string;
  conceptId: string;
  time?: string;
};

export type EventFlow = {
  name: string;
  slots: EventSlot[];
};

const FLOWS: Record<string, EventFlow> = {
  wedding: {
    name: "Düğün Akışı",
    slots: [
      { label: "Misafir Karşılama", conceptId: "gun-batimi", time: "17:00" },
      { label: "Kokteyl Saati", conceptId: "gun-batimi", time: "18:00" },
      { label: "Akşam Yemeği", conceptId: "sohbet-arasi", time: "20:00" },
      { label: "Kutlama Başlıyor", conceptId: "karisik-kaset", time: "22:00" },
      { label: "Dans Pisti", conceptId: "disko-gecesi", time: "23:00" },
      { label: "After Party", conceptId: "duezler-kaseti", time: "01:00" },
    ],
  },
  "private-party": {
    name: "Villa Weekend Akışı",
    slots: [
      { label: "Varış", conceptId: "gun-batimi", time: "16:00" },
      { label: "Kokteyl & Golden Hour", conceptId: "toprak-ritim", time: "18:00" },
      { label: "Gece Başlıyor", conceptId: "disko-gecesi", time: "21:00" },
      { label: "Geç Gece", conceptId: "kulup-modu", time: "00:00" },
    ],
  },
  corporate: {
    name: "Kurumsal Etkinlik Akışı",
    slots: [
      { label: "Karşılama Kokteyli", conceptId: "sehirli-zarafet", time: "18:00" },
      { label: "Akşam Yemeği", conceptId: "sohbet-arasi", time: "19:30" },
      { label: "Kutlama", conceptId: "karisik-kaset", time: "22:00" },
    ],
  },
  "brand-launch": {
    name: "Marka Lansmanı Akışı",
    slots: [
      { label: "Kapı Açılışı", conceptId: "sehirli-zarafet", time: "19:00" },
      { label: "Sunum & Kokteyl", conceptId: "gun-batimi", time: "20:00" },
      { label: "After Party", conceptId: "kulup-modu", time: "22:30" },
    ],
  },
  opening: {
    name: "Açılış Akışı",
    slots: [
      { label: "Karşılama", conceptId: "sehirli-zarafet", time: "19:00" },
      { label: "Kokteyl & Network", conceptId: "anadolu-esintileri", time: "20:00" },
      { label: "Kutlama", conceptId: "disko-gecesi", time: "22:00" },
    ],
  },
  cocktail: {
    name: "Kokteyl Resepsiyonu Akışı",
    slots: [
      { label: "Karşılama", conceptId: "sohbet-arasi", time: "18:00" },
      { label: "Kokteyl Saati", conceptId: "gun-batimi", time: "19:00" },
      { label: "Kapanış", conceptId: "sehirli-zarafet", time: "21:00" },
    ],
  },
  sunset: {
    name: "Sunset Session Akışı",
    slots: [
      { label: "Varış", conceptId: "sohbet-arasi", time: "17:00" },
      { label: "Golden Hour", conceptId: "gun-batimi", time: "18:30" },
      { label: "Gece Geçişi", conceptId: "toprak-ritim", time: "20:00" },
      { label: "Kulüp Modu", conceptId: "kulup-modu", time: "22:00" },
    ],
  },
  "after-party": {
    name: "After Party Akışı",
    slots: [
      { label: "Isınma", conceptId: "duezler-kaseti", time: "00:00" },
      { label: "Pik Saat", conceptId: "kulup-modu", time: "01:30" },
      { label: "Sabaha Karşı", conceptId: "gece-kulubu", time: "03:00" },
    ],
  },
};

const DEFAULT_FLOW: EventFlow = {
  name: "Etkinlik Akışı",
  slots: [
    { label: "Karşılama", conceptId: "gun-batimi" },
    { label: "Ana Etkinlik", conceptId: "karisik-kaset" },
    { label: "Kutlama", conceptId: "disko-gecesi" },
  ],
};

export function getEventFlow(
  eventType: string,
  selectedConceptIds: string[]
): EventFlow {
  const baseFlow = FLOWS[eventType] ?? DEFAULT_FLOW;

  if (selectedConceptIds.length === 0) return baseFlow;

  // Substitute flow slots with user-selected concepts where energy level is compatible
  const substituted = baseFlow.slots.map((slot) => {
    const baseConcept = MUSIC_CONCEPTS.find((c) => c.id === slot.conceptId);
    if (!baseConcept) return slot;

    const match = selectedConceptIds
      .map((id) => MUSIC_CONCEPTS.find((c) => c.id === id))
      .filter(Boolean)
      .find((c) => {
        if (!c) return false;
        return Math.abs(c.energyLevel - baseConcept.energyLevel) <= 3;
      });

    return match ? { ...slot, conceptId: match.id } : slot;
  });

  return { ...baseFlow, slots: substituted };
}
