"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveStaleLeads } from "./actions";

export default function StaleBanner({ count }: { count: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const archive = () => {
    startTransition(async () => {
      setError(null);
      try {
        const { archived } = await archiveStaleLeads();
        setDone(archived);
        setConfirming(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Hata oluştu.");
      }
    });
  };

  if (done !== null) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-700 rounded-2xl px-5 py-3 text-sm">
        ✓ {done} eski talep arşivlendi. Gerekirse arşivden tek tek geri alabilirsin.
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 space-y-2">
      <p className="text-sm text-amber-800">
        Bu {count} talep {"14+"} gündür işlem görmemiş veya etkinlik tarihi geçmiş — muhtemelen Armut&apos;ta
        çoktan kapanmış ilanlar. Arşivlemek canlı inbox&apos;ı sadeleştirir; arşivleme geri alınabilir (silinmez).
      </p>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="text-xs px-4 py-2 rounded-full bg-amber-600 text-white font-medium hover:opacity-90"
        >
          Tümünü Arşivle ({count})
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xs text-amber-800">Emin misin? {count} talep arşivlenecek.</span>
          <button
            onClick={archive}
            disabled={pending}
            className="text-xs px-4 py-1.5 rounded-full bg-amber-600 text-white font-medium hover:opacity-90 disabled:opacity-50"
          >
            {pending ? "Arşivleniyor…" : "Evet, arşivle"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-xs px-4 py-1.5 rounded-full border border-amber-300 text-amber-700"
          >
            Vazgeç
          </button>
        </div>
      )}
    </div>
  );
}
