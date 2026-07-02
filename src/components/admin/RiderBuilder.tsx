"use client";

import { useState } from "react";
import { normalizeRiderItems, type RiderItem } from "@/lib/riderTypes";

export type { RiderItem };
export { normalizeRiderItems };

const CATEGORY_PRESETS: Record<string, string[]> = {
  "🎧 DJ Player": [
    "Pioneer CDJ-3000",
    "Pioneer CDJ-2000NXS2",
    "Pioneer XDJ-RX3",
    "Pioneer XDJ-AZ",
    "Rane Seventy-Two",
    "Denon SC6000",
  ],
  "🎚️ DJ Mixer": [
    "Pioneer DJM-900NXS2",
    "Pioneer DJM-V10",
    "Rane Seventy-Two Mixer",
    "Allen & Heath Xone",
  ],
  "🎹 Klavye / Synth": [
    "Nord Stage 4",
    "Roland FA-08",
    "Korg Kronos",
    "Yamaha CP88",
    "Arturia MiniFreak",
  ],
  "🎸 Enstrüman Amfisi": [
    "Elektro Gitar Amplifikatörü",
    "Bas Amplifikatörü",
    "Akustik Gitar DI Box",
  ],
  "🥁 Davul Seti": [
    "Akustik Davul Seti",
    "Elektrik Davul Seti",
    "Cajon",
  ],
  "🎤 Vokal Mikrofon": [
    "Shure SM58",
    "Shure Beta 58A",
    "Sennheiser e935",
  ],
  "🎙️ Enstrüman Mikrofonu / DI": [
    "Condenser Mikrofon",
    "DI Box",
    "Keman/Violin DI",
  ],
  "🔊 Ses Sistemi (PA)": [
    "Line Array (sol/sağ)",
    "Subwoofer (2x)",
    "Monitör Hoparlör (2x)",
    "In-Ear Monitor Sistemi",
  ],
  "🎛️ Mixer (FOH)": [
    "Dijital Mixer (32ch+)",
    "Analog Mixer (16-24ch)",
  ],
  "💡 Sahne & Işık": [
    "DJ Booth / Sahne Masası",
    "LED Par (4x)",
    "Moving Head (4x)",
    "Haze Makinesi",
    "Laser Sistemi",
  ],
  "🔌 Teknik Altyapı": [
    "Power Strip (çoklu priz)",
    "Ethernet / Internet bağlantısı",
    "Soyunma Odası",
    "Teknik Asistan",
  ],
};

function blankItem(): RiderItem {
  return { category: "", options: [], preferredOption: undefined, required: true, qty: 1, provided_by: "organizer", notes: "" };
}

type Props = {
  value: RiderItem[];
  onChange: (items: RiderItem[]) => void;
  compact?: boolean;
};

export default function RiderBuilder({ value, onChange, compact = false }: Props) {
  const [customOptionInput, setCustomOptionInput] = useState<Record<number, string>>({});

  const update = (idx: number, patch: Partial<RiderItem>) => {
    onChange(value.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  const toggleOption = (idx: number, option: string) => {
    const current = value[idx].options ?? [];
    const removing = current.includes(option);
    const nextOptions = removing ? current.filter((o) => o !== option) : [...current, option];
    const patch: Partial<RiderItem> = { options: nextOptions };
    if (removing && value[idx].preferredOption === option) patch.preferredOption = undefined;
    update(idx, patch);
  };

  const addCustomOption = (idx: number) => {
    const text = (customOptionInput[idx] ?? "").trim();
    if (!text) return;
    const current = value[idx].options ?? [];
    if (!current.includes(text)) update(idx, { options: [...current, text] });
    setCustomOptionInput((p) => ({ ...p, [idx]: "" }));
  };

  const setPreferred = (idx: number, option: string) => {
    update(idx, { preferredOption: value[idx].preferredOption === option ? undefined : option });
  };

  const addCategoryRow = (category = "") => {
    onChange([...value, { ...blankItem(), category }]);
  };

  const inputCls = "px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40";

  return (
    <div className="space-y-3">
      {value.map((item, idx) => {
        const presetOptions = CATEGORY_PRESETS[item.category] ?? [];
        const itemOptions = item.options ?? [];

        return (
          <div key={idx} className="rounded-xl border border-border bg-secondary/10 p-3 space-y-3">
            {/* Kategori adı + adet + kim sağlar + sil */}
            <div className="grid gap-2" style={{ gridTemplateColumns: compact ? "1fr auto auto" : "1fr 60px 1fr auto" }}>
              <input
                value={item.category}
                onChange={(e) => update(idx, { category: e.target.value })}
                placeholder="Kategori adı (ör. DJ Player)"
                className={`${inputCls} font-medium`}
              />
              <input
                type="number" min={1} max={99}
                value={item.qty}
                onChange={(e) => update(idx, { qty: Math.max(1, Number(e.target.value)) })}
                className={`${inputCls} text-center`}
                style={{ width: compact ? 56 : undefined }}
              />
              {!compact && (
                <select
                  value={item.provided_by}
                  onChange={(e) => update(idx, { provided_by: e.target.value as "organizer" | "artist" })}
                  className={inputCls}
                >
                  <option value="organizer">Organizatör sağlar</option>
                  <option value="artist">Sanatçı getirir</option>
                </select>
              )}
              <button type="button" onClick={() => remove(idx)}
                className="p-2 text-muted-foreground hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Zorunlu mu */}
            {!compact && (
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => update(idx, { required: !item.required })}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                    item.required
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-border text-muted-foreground hover:border-foreground/40"
                  }`}
                >
                  {item.required ? "Zorunlu" : "Opsiyonel"}
                </button>
              </div>
            )}

            {/* Kabul edilebilir alternatifler */}
            <div className="pl-1">
              {itemOptions.length > 0 && (
                <>
                  <p className="text-[11px] text-muted-foreground mb-1.5">
                    Seçili ekipmanlar <span className="opacity-70">(★ ile birincil tercihi işaretle)</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {itemOptions.map((opt) => {
                      const preferred = item.preferredOption === opt;
                      return (
                        <span key={opt} className={`inline-flex items-center gap-1.5 text-xs pl-1 pr-2.5 py-1 rounded-full ${
                          preferred ? "bg-foreground text-background" : "bg-secondary text-foreground"
                        }`}>
                          <button
                            type="button"
                            onClick={() => setPreferred(idx, opt)}
                            title={preferred ? "Birincil tercih" : "Birincil tercih yap"}
                            className={`leading-none ${preferred ? "opacity-100" : "opacity-40 hover:opacity-80"}`}
                          >
                            {preferred ? "★" : "☆"}
                          </button>
                          {opt}
                          <button type="button" onClick={() => toggleOption(idx, opt)} className="opacity-60 hover:opacity-100 leading-none">×</button>
                        </span>
                      );
                    })}
                  </div>
                </>
              )}

              <p className="text-[11px] text-muted-foreground mb-1.5">
                {itemOptions.length > 0 ? "Ekle:" : "Kabul edilebilir alternatifler"}{" "}
                <span className="opacity-70">(birden fazla seçilebilir — herhangi biri yeterli)</span>
              </p>

              {presetOptions.filter((o) => !itemOptions.includes(o)).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {presetOptions.filter((o) => !itemOptions.includes(o)).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleOption(idx, opt)}
                      className="text-xs px-2.5 py-1 rounded-full border border-border text-foreground hover:border-foreground/40 transition-all"
                    >
                      + {opt}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-1.5">
                <input
                  value={customOptionInput[idx] ?? ""}
                  onChange={(e) => setCustomOptionInput((p) => ({ ...p, [idx]: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomOption(idx); } }}
                  placeholder="Listede yoksa kendi alternatifini yaz…"
                  className={`${inputCls} flex-1 text-xs py-1.5`}
                />
                <button type="button" onClick={() => addCustomOption(idx)}
                  className="text-xs px-3 py-1.5 rounded-xl border border-border text-foreground hover:bg-secondary transition-colors">
                  Ekle
                </button>
              </div>
            </div>

            {/* Not */}
            {!compact && (
              <input
                value={item.notes}
                onChange={(e) => update(idx, { notes: e.target.value })}
                placeholder="Not (opsiyonel — ör. 'siyah kablolu', 'kapalı alanda')"
                className={`${inputCls} w-full text-xs`}
              />
            )}
          </div>
        );
      })}

      {/* Yeni kategori ekle */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => addCategoryRow()}
          className="text-xs px-4 py-2 border border-dashed border-border rounded-full text-foreground hover:border-foreground/50 transition-colors"
        >
          + Kategori Ekle
        </button>
        {Object.keys(CATEGORY_PRESETS)
          .filter((cat) => !value.some((v) => v.category === cat))
          .map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => addCategoryRow(cat)}
              className="text-xs px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            >
              + {cat}
            </button>
          ))}
      </div>
    </div>
  );
}
