"use client";

import { useState } from "react";

export type RiderItem = {
  item: string;
  qty: number;
  provided_by: "organizer" | "artist";
  notes: string;
};

const CATEGORY_PRESETS: Record<string, string[]> = {
  "🎧 DJ / Playback": [
    "Pioneer CDJ-3000",
    "Pioneer CDJ-2000NXS2",
    "Pioneer DJM-900NXS2",
    "Pioneer DJM-V10",
    "Rane Seventy-Two",
    "Denon SC6000",
  ],
  "🎹 Klavye / Synth": [
    "Nord Stage 4",
    "Roland FA-08",
    "Korg Kronos",
    "Yamaha CP88",
    "Arturia MiniFreak",
  ],
  "🎸 Enstrüman": [
    "Elektro Gitar Amplifikatörü",
    "Bas Amplifikatörü",
    "Akustik Gitar DI Box",
    "Davul Seti (akustik)",
    "Elektrik Davul Seti",
    "Keman Stand + DI",
  ],
  "🔊 Ses Sistemi": [
    "Line Array (sol/sağ)",
    "Subwoofer (2x)",
    "Monitoring Hoparlör (2x)",
    "In-Ear Monitor Sistemi",
    "Vocal Mikrofon (SM58)",
    "Condenser Mikrofon",
    "Mikrofon Stand",
    "DI Box",
    "Mixer (32ch+)",
  ],
  "💡 Sahne & Işık": [
    "DJ Booth / Sahne Masası",
    "LED Par (4x)",
    "Moving Head (4x)",
    "Haze Makinesi",
    "Laser Sistemi",
    "Projeksiyon",
    "LED Ekran",
  ],
  "🔌 Teknik": [
    "Power Strip (çoklu priz)",
    "Ethernet / Internet bağlantısı",
    "Soyunma Odası",
    "Teknik Asistan",
  ],
};

function blankItem(): RiderItem {
  return { item: "", qty: 1, provided_by: "organizer", notes: "" };
}

type Props = {
  value: RiderItem[];
  onChange: (items: RiderItem[]) => void;
  compact?: boolean;
};

export default function RiderBuilder({ value, onChange, compact = false }: Props) {
  const [showPresets, setShowPresets] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const update = (idx: number, patch: Partial<RiderItem>) => {
    onChange(value.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const remove = (idx: number) => onChange(value.filter((_, i) => i !== idx));

  const addPreset = (name: string) => {
    if (value.some((v) => v.item === name)) return;
    onChange([...value, { item: name, qty: 1, provided_by: "organizer", notes: "" }]);
  };

  const labelCls = "block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-1.5";
  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40";

  return (
    <div className="space-y-4">
      {/* Mevcut rider listesi */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((item, idx) => (
            <div
              key={idx}
              className="grid gap-2 p-3 rounded-xl border border-border bg-secondary/10"
              style={{ gridTemplateColumns: compact ? "1fr auto auto" : "1fr 60px 1fr auto" }}
            >
              {/* Ekipman adı */}
              <input
                value={item.item}
                onChange={(e) => update(idx, { item: e.target.value })}
                placeholder="Ekipman adı"
                className={inputCls}
              />

              {/* Adet */}
              <input
                type="number"
                min={1}
                max={99}
                value={item.qty}
                onChange={(e) => update(idx, { qty: Math.max(1, Number(e.target.value)) })}
                className={`${inputCls} text-center`}
                style={{ width: compact ? 56 : undefined }}
              />

              {/* Kim sağlıyor */}
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

              {/* Sil */}
              <button
                type="button"
                onClick={() => remove(idx)}
                className="p-2 text-muted-foreground hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>

              {/* Not (compact'ta gizli) */}
              {!compact && (
                <div className="col-span-4">
                  <input
                    value={item.notes}
                    onChange={(e) => update(idx, { notes: e.target.value })}
                    placeholder="Not (opsiyonel — ör. 'siyah kablolu', 'kapalı alanda')"
                    className={`${inputCls} text-xs`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Header satırı */}
      {value.length > 0 && !compact && (
        <div
          className="grid gap-2 px-3"
          style={{ gridTemplateColumns: "1fr 60px 1fr auto" }}
        >
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Ekipman</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide text-center">Adet</span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Kim sağlar?</span>
        </div>
      )}

      {/* Aksiyon butonları */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange([...value, blankItem()])}
          className="text-xs px-4 py-2 border border-dashed border-border rounded-full text-foreground hover:border-foreground/50 transition-colors"
        >
          + Ekipman Ekle
        </button>
        <button
          type="button"
          onClick={() => setShowPresets((p) => !p)}
          className="text-xs px-4 py-2 border border-border rounded-full text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors"
        >
          {showPresets ? "Kapat" : "Hazır Listeden Seç"}
        </button>
      </div>

      {/* Preset panel */}
      {showPresets && (
        <div className="rounded-xl border border-border bg-white p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {Object.keys(CATEGORY_PRESETS).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  activeCategory === cat
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground hover:border-foreground/40"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {activeCategory && (
            <div className="flex flex-wrap gap-2">
              {CATEGORY_PRESETS[activeCategory].map((preset) => {
                const already = value.some((v) => v.item === preset);
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => addPreset(preset)}
                    disabled={already}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      already
                        ? "border-border text-muted-foreground opacity-40 cursor-default"
                        : "border-border text-foreground hover:bg-foreground hover:text-background"
                    }`}
                  >
                    {already ? "✓ " : "+ "}{preset}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
