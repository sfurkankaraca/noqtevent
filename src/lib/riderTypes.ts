// Rider veri modeli ve normalizasyonu — hem client bileşenlerden (RiderBuilder)
// hem server action/component'lardan (booking wizard, presskit) güvenle
// import edilebilsin diye "use client" İÇERMEYEN düz bir modülde tutulur.
export type RiderItem = {
  category: string;
  options: string[];
  preferredOption?: string; // alternatifler arasında birincil tercih
  required: boolean;        // zorunlu mu, opsiyonel mi
  qty: number;
  provided_by: "organizer" | "artist";
  notes: string;
};

function riderItem(category: string, options: string[]): RiderItem {
  return { category, options, preferredOption: undefined, required: true, qty: 1, provided_by: "organizer", notes: "" };
}

// Hızlı başlangıç şablonları — admin panelde "Şablon Uygula" ile tek tıkla yüklenir.
export const RIDER_TEMPLATES: Record<string, { label: string; emoji: string; items: RiderItem[] }> = {
  dj: {
    label: "DJ Standart Rider",
    emoji: "🎧",
    items: [
      riderItem("🎧 DJ Player", [
        "Pioneer CDJ-3000",
        "Pioneer CDJ-2000NXS2",
        "Rane Seventy-Two",
        "Pioneer XDJ RX3",
        "Pioneer XDJ AZ",
      ]),
      riderItem("🎚️ DJ Mixer", [
        "Pioneer DJM-900NXS2",
        "Pioneer DJM-V10",
      ]),
      riderItem("🔊 Ses Sistemi (PA)", [
        "Line Array (sol/sağ)",
        "Monitör Hoparlör (2x)",
        "Subwoofer (2x)",
      ]),
      riderItem("🔌 Teknik Altyapı", [
        "Power Strip (çoklu priz)",
        "Ethernet / Internet bağlantısı",
        "Teknik Asistan",
      ]),
      riderItem("💡 Sahne & Işık", [
        "DJ Booth / Sahne Masası",
      ]),
    ],
  },
  artist: {
    label: "Solo Sanatçı Standart Rider",
    emoji: "🎤",
    items: [
      riderItem("🎤 Vokal Mikrofon", [
        "Shure SM58",
        "Shure Beta 58A",
        "Sennheiser e935",
      ]),
      riderItem("🎙️ Enstrüman Mikrofonu / DI", [
        "Condenser Mikrofon",
        "DI Box",
      ]),
      riderItem("🔊 Ses Sistemi (PA)", [
        "Line Array (sol/sağ)",
        "Monitör Hoparlör (2x)",
      ]),
      riderItem("🎛️ Mixer (FOH)", [
        "Dijital Mixer (32ch+)",
        "Analog Mixer (16-24ch)",
      ]),
      riderItem("🔌 Teknik Altyapı", [
        "Power Strip (çoklu priz)",
        "Ethernet / Internet bağlantısı",
      ]),
    ],
  },
};

// Eski format {item, qty, provided_by, notes} ile yeni format {category, options}
// arasında uyum — DB'de eski şekilde kayıtlı rider verisi güvenle geçsin.
export function normalizeRiderItems(raw: unknown[]): RiderItem[] {
  return raw.map((r) => {
    const item = r as Partial<RiderItem> & { item?: string };
    const options = Array.isArray(item.options) && item.options.length > 0
      ? item.options
      : item.item
      ? [item.item]
      : [];
    return {
      category: item.category || item.item || "",
      options,
      preferredOption: item.preferredOption && options.includes(item.preferredOption) ? item.preferredOption : undefined,
      required: item.required ?? true,
      qty: item.qty ?? 1,
      provided_by: item.provided_by ?? "organizer",
      notes: item.notes ?? "",
    };
  });
}
