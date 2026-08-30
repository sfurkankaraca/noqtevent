import { MUSIC_CONCEPTS } from "./PlannerStore";

export type EventPhase = "karsilama" | "anaKutlama" | "afterParti";

export type EventSlot = {
  label: string;
  conceptId: string;
  time?: string;
  phase?: EventPhase;
};

export type EventFlow = {
  name: string;
  slots: EventSlot[];
};

export type SectionTimes = {
  karsilama?: string;
  anaKutlama?: string;
};

const FLOWS: Record<string, EventFlow> = {
  wedding: {
    name: "Düğün Akışı",
    slots: [
      { label: "Misafir Karşılama", conceptId: "gun-batimi", time: "17:00", phase: "karsilama" },
      { label: "Kokteyl Saati", conceptId: "gun-batimi", time: "18:00", phase: "karsilama" },
      { label: "Akşam Yemeği", conceptId: "sohbet-arasi", time: "20:00", phase: "anaKutlama" },
      { label: "Kutlama Başlıyor", conceptId: "karisik-kaset", time: "22:00", phase: "anaKutlama" },
      { label: "Dans Pisti", conceptId: "disko-gecesi", time: "23:00", phase: "anaKutlama" },
      { label: "After Party", conceptId: "duezler-kaseti", time: "01:00", phase: "afterParti" },
    ],
  },
  "private-party": {
    name: "Villa Weekend Akışı",
    slots: [
      { label: "Varış", conceptId: "gun-batimi", time: "16:00", phase: "karsilama" },
      { label: "Kokteyl & Golden Hour", conceptId: "toprak-ritim", time: "18:00", phase: "karsilama" },
      { label: "Gece Başlıyor", conceptId: "disko-gecesi", time: "21:00", phase: "anaKutlama" },
      { label: "Geç Gece", conceptId: "kulup-modu", time: "00:00", phase: "afterParti" },
    ],
  },
  corporate: {
    name: "Kurumsal Etkinlik Akışı",
    slots: [
      { label: "Karşılama Kokteyli", conceptId: "sehirli-zarafet", time: "18:00", phase: "karsilama" },
      { label: "Akşam Yemeği", conceptId: "sohbet-arasi", time: "19:30", phase: "anaKutlama" },
      { label: "Kutlama", conceptId: "karisik-kaset", time: "22:00", phase: "anaKutlama" },
    ],
  },
  "brand-launch": {
    name: "Marka Lansmanı Akışı",
    slots: [
      { label: "Kapı Açılışı", conceptId: "sehirli-zarafet", time: "19:00", phase: "karsilama" },
      { label: "Sunum & Kokteyl", conceptId: "gun-batimi", time: "20:00", phase: "anaKutlama" },
      { label: "After Party", conceptId: "kulup-modu", time: "22:30", phase: "afterParti" },
    ],
  },
  opening: {
    name: "Açılış Akışı",
    slots: [
      { label: "Karşılama", conceptId: "sehirli-zarafet", time: "19:00", phase: "karsilama" },
      { label: "Kokteyl & Network", conceptId: "anadolu-esintileri", time: "20:00", phase: "karsilama" },
      { label: "Kutlama", conceptId: "disko-gecesi", time: "22:00", phase: "anaKutlama" },
    ],
  },
  cocktail: {
    name: "Kokteyl Resepsiyonu Akışı",
    slots: [
      { label: "Karşılama", conceptId: "sohbet-arasi", time: "18:00", phase: "karsilama" },
      { label: "Kokteyl Saati", conceptId: "gun-batimi", time: "19:00", phase: "anaKutlama" },
      { label: "Kapanış", conceptId: "sehirli-zarafet", time: "21:00", phase: "anaKutlama" },
    ],
  },
  sunset: {
    name: "Sunset Session Akışı",
    slots: [
      { label: "Varış", conceptId: "sohbet-arasi", time: "17:00", phase: "karsilama" },
      { label: "Golden Hour", conceptId: "gun-batimi", time: "18:30", phase: "karsilama" },
      { label: "Gece Geçişi", conceptId: "toprak-ritim", time: "20:00", phase: "anaKutlama" },
      { label: "Kulüp Modu", conceptId: "kulup-modu", time: "22:00", phase: "afterParti" },
    ],
  },
  "kina-gecesi": {
    name: "Kına Gecesi Akışı",
    slots: [
      { label: "Karşılama", conceptId: "anadolu-esintileri", time: "19:00", phase: "karsilama" },
      { label: "Kına Töreni", conceptId: "oyun-havalari", time: "20:30", phase: "anaKutlama" },
      { label: "Roman Havaları", conceptId: "roman-atesi", time: "22:00", phase: "anaKutlama" },
      { label: "Halaylar & Kapanış", conceptId: "halaylar", time: "23:30", phase: "anaKutlama" },
    ],
  },
  "after-party": {
    name: "After Party Akışı",
    slots: [
      { label: "Isınma", conceptId: "duezler-kaseti", time: "00:00", phase: "anaKutlama" },
      { label: "Pik Saat", conceptId: "kulup-modu", time: "01:30", phase: "anaKutlama" },
      { label: "Sabaha Karşı", conceptId: "gece-kulubu", time: "03:00", phase: "anaKutlama" },
    ],
  },
};

const DEFAULT_FLOW: EventFlow = {
  name: "Etkinlik Akışı",
  slots: [
    { label: "Karşılama", conceptId: "gun-batimi", phase: "karsilama" },
    { label: "Ana Etkinlik", conceptId: "karisik-kaset", phase: "anaKutlama" },
    { label: "Kutlama", conceptId: "disko-gecesi", phase: "anaKutlama" },
  ],
};

// Gece yarısından sonraki saatler (06:00 öncesi) etkinlik günü akışında ertesi güne sayılır
function toMinutes(time: string | undefined): number | null {
  if (!time) return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  let total = h * 60 + min;
  if (h < 6) total += 24 * 60;
  return total;
}

function toTimeString(mins: number): string {
  const m = ((mins % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

// Şablon saatlerini müşterinin seçtiği bölüm başlangıçlarına kaydırır ve sırayı kronolojik tutar
function applySectionTimes(slots: EventSlot[], sectionTimes?: SectionTimes): EventSlot[] {
  const deltas: Partial<Record<EventPhase, number>> = {};

  (["karsilama", "anaKutlama"] as const).forEach((phase) => {
    const userTime = toMinutes(sectionTimes?.[phase]);
    if (userTime == null) return;
    const anchor = slots.find((s) => s.phase === phase && s.time);
    const baseTime = toMinutes(anchor?.time);
    if (baseTime == null) return;
    deltas[phase] = userTime - baseTime;
  });

  // After parti için ayrı saat sorulmuyor; ana kutlama ile birlikte kayar
  if (deltas.anaKutlama != null && deltas.afterParti == null) {
    deltas.afterParti = deltas.anaKutlama;
  }

  let prev: number | null = null;
  return slots.map((slot) => {
    let mins = toMinutes(slot.time);
    if (mins == null) return slot;
    const delta = slot.phase != null ? deltas[slot.phase] : undefined;
    if (delta != null) mins += delta;
    if (prev != null && mins < prev) mins = prev;
    prev = mins;
    return { ...slot, time: toTimeString(mins) };
  });
}

export function getEventFlow(
  eventType: string,
  selectedConceptIds: string[],
  sectionTimes?: SectionTimes
): EventFlow {
  // Nişan, düğüne en yakın akış — kendi tanımı yoksa düğün akışını kullan
  const baseFlow = FLOWS[eventType] ?? (eventType === "engagement" ? FLOWS.wedding : DEFAULT_FLOW);

  let slots = baseFlow.slots;

  if (selectedConceptIds.length > 0) {
    // Substitute flow slots with user-selected concepts where energy level is compatible
    slots = slots.map((slot) => {
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
  }

  return { ...baseFlow, slots: applySectionTimes(slots, sectionTimes) };
}
