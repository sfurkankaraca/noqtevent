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
