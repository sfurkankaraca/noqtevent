"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reprocessJunkArmutStep } from "./actions";

const MAX_ITERATIONS = 80;

export default function JunkFixBanner({ count }: { count: number }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [totals, setTotals] = useState({ processed: 0, fixed: 0, unfixable: 0 });
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const run = async () => {
    setRunning(true);
    setError(null);
    setFinished(false);
    let acc = { processed: 0, fixed: 0, unfixable: 0 };
    try {
      let done = false;
      for (let i = 0; i < MAX_ITERATIONS && !done; i++) {
        const r = await reprocessJunkArmutStep();
        acc = {
          processed: acc.processed + r.processed,
          fixed: acc.fixed + r.fixed,
          unfixable: acc.unfixable + r.unfixable,
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
    <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 space-y-2">
      <p className="text-sm text-red-800">
        {finished
          ? "Düzeltme turu tamamlandı — bu lead'ler artık &ldquo;Yeni&rdquo; durumunda, aşağıdaki &ldquo;Yeniden Analiz Et&rdquo; ile AI analizinden geçirilebilir."
          : `${count} talep, Armut'un eski parser tarafından tanınmayan bir e-posta şablonu yüzünden hatalı ayrıştırıldı (gerçek hizmet/konum/tarih bilgisi yok, yerine genel bir tanıtım cümlesi düşmüş).`}
      </p>
      {(running || totals.processed > 0) && (
        <p className="text-xs text-red-700">
          İşlenen: {totals.processed} · Düzeltilen: {totals.fixed} · Düzeltilemeyen: {totals.unfixable}
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!finished && (
        <button
          onClick={run}
          disabled={running}
          className="text-xs px-4 py-2 rounded-full bg-red-600 text-white font-medium hover:opacity-90 disabled:opacity-50"
        >
          {running ? "Düzeltiliyor…" : `Yeniden Ayrıştır (${count})`}
        </button>
      )}
    </div>
  );
}
