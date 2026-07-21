"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { backfillArmutStep } from "../actions";

export default function BackfillButton() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [totals, setTotals] = useState({ processed: 0, created: 0, duplicate: 0, noise: 0, errors: 0 });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<boolean | null>(null);

  const run = async (reset?: boolean) => {
    setRunning(true);
    setError(null);
    setDone(null);
    if (reset) setTotals({ processed: 0, created: 0, duplicate: 0, noise: 0, errors: 0 });
    let acc = reset ? { processed: 0, created: 0, duplicate: 0, noise: 0, errors: 0 } : totals;
    try {
      let isDone = false;
      let firstCall = true;
      while (!isDone) {
        const r = await backfillArmutStep(firstCall ? reset : undefined);
        firstCall = false;
        acc = {
          processed: r.total_processed,
          created: acc.created + r.created,
          duplicate: acc.duplicate + r.duplicate,
          noise: acc.noise + r.noise,
          errors: acc.errors + r.errors,
        };
        setTotals(acc);
        isDone = r.done;
      }
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Backfill hatası.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-medium text-foreground">Tüm Geçmiş Armut E-postalarını Çek</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gmail&apos;deki tüm Armut bildirimlerini (tarih sınırı yok) tarar, analiz eder, inbox&apos;a ekler.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => run(false)}
            disabled={running}
            className="px-4 py-2 rounded-full bg-foreground text-background text-xs font-medium hover:opacity-90 disabled:opacity-50"
          >
            {running ? "Taranıyor…" : "Devam Et / Başlat"}
          </button>
          <button
            onClick={() => run(true)}
            disabled={running}
            className="px-4 py-2 rounded-full border border-border text-xs text-muted-foreground hover:border-foreground/40 disabled:opacity-50"
          >
            Baştan Başlat
          </button>
        </div>
      </div>
      {(running || totals.processed > 0 || done !== null) && (
        <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>Taranan: <b className="text-foreground">{totals.processed}</b></span>
          <span>Yeni lead: <b className="text-foreground">{totals.created}</b></span>
          <span>Zaten vardı: <b className="text-foreground">{totals.duplicate}</b></span>
          <span>Gürültü: <b className="text-foreground">{totals.noise}</b></span>
          {totals.errors > 0 && <span className="text-red-600">Hata: <b>{totals.errors}</b></span>}
          {done && <span className="text-green-700 font-medium">✓ Tamamlandı</span>}
        </div>
      )}
      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 mt-3">{error}</p>}
    </div>
  );
}
