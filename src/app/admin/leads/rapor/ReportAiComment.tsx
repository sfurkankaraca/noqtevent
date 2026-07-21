"use client";

import { useState, useTransition } from "react";
import { generateLeadReportComment } from "../actions";

// Basit markdown → HTML değil; güvenli düz render: başlıklar bold, maddeler satır.
function renderLite(md: string) {
  return md.split("\n").map((line, i) => {
    const bold = line.match(/^\*\*(.+)\*\*$/);
    if (bold) return <p key={i} className="text-sm font-semibold text-foreground mt-4 first:mt-0">{bold[1]}</p>;
    const bullet = line.match(/^[-•]\s+(.*)$/);
    if (bullet) {
      return (
        <p key={i} className="text-sm text-foreground leading-relaxed pl-4 relative">
          <span className="absolute left-0">•</span>
          {bullet[1].replace(/\*\*(.+?)\*\*/g, "$1")}
        </p>
      );
    }
    if (!line.trim()) return null;
    return <p key={i} className="text-sm text-foreground leading-relaxed">{line.replace(/\*\*(.+?)\*\*/g, "$1")}</p>;
  });
}

export default function ReportAiComment({ statsJson, samples }: { statsJson: string; samples: string[] }) {
  const [comment, setComment] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const generate = () =>
    startTransition(async () => {
      setError(null);
      try {
        const text = await generateLeadReportComment(statsJson, samples);
        setComment(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Yorum üretilemedi.");
      }
    });

  return (
    <div className="bg-foreground text-background rounded-3xl p-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[10px] tracking-[0.35em] uppercase text-background/50">
          AI Satış Değerlendirmesi
        </p>
        <button
          onClick={generate}
          disabled={pending}
          className="text-xs px-4 py-1.5 rounded-full bg-background/10 border border-background/20 hover:bg-background/20 transition-colors disabled:opacity-50"
        >
          {pending ? "Yorumlanıyor…" : comment ? "↻ Yeniden Yorumla" : "✨ Yorumla"}
        </button>
      </div>
      {error && <p className="text-xs text-red-300 mt-3">{error}</p>}
      {comment ? (
        <div className="mt-4 space-y-1 [&_p]:text-background/90">{renderLite(comment)}</div>
      ) : (
        !pending && (
          <p className="text-sm text-background/60 mt-3 leading-relaxed">
            &ldquo;Yorumla&rdquo; ile bu sayfadaki istatistikler ve son taleplerin içerikleri üzerinden
            fırsat/risk değerlendirmesi ve haftalık aksiyon önerileri üretilir.
          </p>
        )
      )}
    </div>
  );
}
