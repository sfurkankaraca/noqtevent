"use client";

import { useState, useTransition } from "react";
import { applyRiderTemplateToAll } from "./actions";

const TARGETS: { type: "dj" | "artist"; label: string; emoji: string }[] = [
  { type: "dj", label: "Tüm DJ'lere Uygula", emoji: "🎧" },
  { type: "artist", label: "Tüm Solo Sanatçılara Uygula", emoji: "🎤" },
];

export default function ApplyRiderTemplateButton() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  const run = (type: "dj" | "artist", label: string) => {
    if (!confirm(`${label.replace("Uygula", "").trim()} standart rider şablonu uygulanacak.\n\nSadece rider'ı BOŞ olan kayıtlar doldurulacak, mevcut rider'ı olanlara dokunulmayacak. Devam edilsin mi?`)) return;
    setResult(null);
    startTransition(async () => {
      try {
        const res = await applyRiderTemplateToAll(type);
        setResult(`✓ ${res.updated} kayıt dolduruldu, ${res.skipped} kayıt zaten rider'ı olduğu için atlandı.`);
      } catch (e) {
        setResult(`Hata: ${e instanceof Error ? e.message : "Bilinmeyen hata"}`);
      }
    });
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={isPending}
        className="inline-flex items-center gap-2 border border-border text-foreground px-4 py-2.5 rounded-full text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
      >
        {isPending ? "Uygulanıyor…" : "📋 Rider Şablonunu Toplu Uygula"}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-20 bg-white rounded-xl border border-border shadow-lg p-1.5 min-w-[220px]">
          {TARGETS.map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => run(t.type, t.label)}
              className="w-full text-left px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary transition-colors"
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      )}

      {result && (
        <p className="absolute right-0 top-full mt-14 text-xs text-muted-foreground bg-white border border-border rounded-lg px-3 py-2 shadow-sm whitespace-nowrap z-10">
          {result}
        </p>
      )}
    </div>
  );
}
