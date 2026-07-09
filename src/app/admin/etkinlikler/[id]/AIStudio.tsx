"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type OutputType = "concept_doc" | "project_brief" | "sponsor_doc" | "strategy" | "poster";
type Output = { type: OutputType; content: string | null };

const TYPE_META: Record<OutputType, { label: string; kind: "text" | "image" }> = {
  concept_doc: { label: "Konsept & Dekor Önerileri", kind: "text" },
  project_brief: { label: "Proje Dosyası", kind: "text" },
  sponsor_doc: { label: "Sponsor Dosyası", kind: "text" },
  strategy: { label: "Paylaşım & Reklam Stratejisi", kind: "text" },
  poster: { label: "Afiş", kind: "image" },
};

export default function AIStudio({ projectId }: { projectId: string }) {
  const [outputs, setOutputs] = useState<Record<string, Output>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/event-projects/${projectId}/ai`);
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) {
          const map: Record<string, Output> = {};
          for (const o of json.outputs ?? []) map[o.type] = o;
          setOutputs(map);
        }
      } catch {
        // sessiz geç — henüz üretilmiş içerik yok
      }
    })();
    return () => { cancelled = true; };
  }, [projectId]);

  const handleGenerate = async (type: OutputType) => {
    setLoading((p) => ({ ...p, [type]: true }));
    setError(null);
    try {
      const res = await fetch(`/api/event-projects/${projectId}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Üretilemedi");
      setOutputs((p) => ({ ...p, [type]: json.output }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setLoading((p) => ({ ...p, [type]: false }));
    }
  };

  const handleCopy = (type: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadText = (type: string, content: string) => {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">AI İçerik Stüdyosu</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Etkinlik detaylarından proje dosyası, sponsor dosyası, paylaşım stratejisi ve afiş üretir.
        </p>
      </div>

      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

      <div className="space-y-4">
        {(Object.keys(TYPE_META) as OutputType[]).map((type) => {
          const meta = TYPE_META[type];
          const output = outputs[type];
          const isLoading = !!loading[type];
          return (
            <div key={type} className="border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">{meta.label}</p>
                <button onClick={() => handleGenerate(type)} disabled={isLoading}
                  className="text-xs px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-secondary transition-colors disabled:opacity-50">
                  {isLoading ? "Oluşturuluyor…" : output?.content ? "Yeniden Oluştur" : "Oluştur"}
                </button>
              </div>

              {output?.content && meta.kind === "text" && (
                <div className="space-y-2">
                  <div className="max-h-56 overflow-y-auto text-xs text-muted-foreground whitespace-pre-wrap bg-secondary/10 rounded-lg p-3">
                    {output.content}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleCopy(type, output.content!)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-secondary transition-colors">
                      {copied === type ? "✓ Kopyalandı" : "Kopyala"}
                    </button>
                    <button onClick={() => handleDownloadText(type, output.content!)}
                      className="text-xs px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-secondary transition-colors">
                      .md indir
                    </button>
                  </div>
                </div>
              )}

              {output?.content && meta.kind === "image" && (
                <div className="space-y-2">
                  <div className="relative w-40 aspect-[3/4] rounded-lg overflow-hidden border border-border">
                    <Image src={output.content} alt="Afiş" fill className="object-cover" unoptimized />
                  </div>
                  <a href={output.content} target="_blank" rel="noopener noreferrer"
                    className="inline-block text-xs px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-secondary transition-colors">
                    Aç / İndir ↗
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
