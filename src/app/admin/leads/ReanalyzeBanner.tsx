"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reanalyzeStuckLeadsStep } from "./actions";

const MAX_ITERATIONS = 60; // güvenlik sınırı — kalıcı hata veren bir lead'e sonsuz döngü olmasın

export default function ReanalyzeBanner({ count }: { count: number }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [totals, setTotals] = useState({ processed: 0, succeeded: 0, failed: 0 });
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const run = async () => {
    setRunning(true);
    setError(null);
    setFinished(false);
    let acc = { processed: 0, succeeded: 0, failed: 0 };
    try {
      let done = false;
      for (let i = 0; i < MAX_ITERATIONS && !done; i++) {
        const r = await reanalyzeStuckLeadsStep();
        acc = {
          processed: acc.processed + r.processed,
          succeeded: acc.succeeded + r.succeeded,
          failed: acc.failed + r.failed,
        };
        setTotals(acc);
        done = r.done || r.processed === 0;
      }
      setFinished(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata oluştu.");
    } finally {
      setRunning(false);
    }
  };

  if (count === 0 && !finished) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4 space-y-2">
      <p className="text-sm text-blue-800">
        {finished
          ? "Yeniden analiz turu tamamlandı."
          : `${count} talep AI analizinden geçemedi (yoğun yük sırasında geçici hata) — durumları "Yeni" olarak takılı kaldı, önerilen yanıtları yok.`}
      </p>
      {(running || totals.processed > 0) && (
        <p className="text-xs text-blue-700">
          İşlenen: {totals.processed} · Başarılı: {totals.succeeded} · Başarısız: {totals.failed}
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!finished && (
        <button
          onClick={run}
          disabled={running}
          className="text-xs px-4 py-2 rounded-full bg-blue-600 text-white font-medium hover:opacity-90 disabled:opacity-50"
        >
          {running ? "Yeniden analiz ediliyor…" : "Yeniden Analiz Et"}
        </button>
      )}
    </div>
  );
}
