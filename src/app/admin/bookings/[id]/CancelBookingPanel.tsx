"use client";

import { useState, useTransition } from "react";
import { cancelBookingWithRefund } from "../actions";
import { daysUntil, NON_REFUNDABLE_WINDOW_DAYS } from "@/lib/bookingTerms";

export default function CancelBookingPanel({
  bookingId, totalPaid, eventDate,
}: {
  bookingId: string;
  totalPaid: number;
  eventDate: string | null;
}) {
  const days = daysUntil(eventDate);
  const withinNonRefundableWindow = days !== null && days <= NON_REFUNDABLE_WINDOW_DAYS && days >= 0;
  const suggested = withinNonRefundableWindow ? 0 : totalPaid;

  const [open, setOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState(String(suggested));
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        Booking iptal edildi. İade bilgisi Finans sayfasında görüntülenebilir.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-sm px-4 py-2 rounded-full font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
      >
        İptal Et
      </button>
    );
  }

  const handleConfirm = () => {
    const amt = parseFloat(refundAmount) || 0;
    setErr(null);
    startTransition(async () => {
      try {
        await cancelBookingWithRefund(bookingId, amt, reason);
        setDone(true);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Hata");
      }
    });
  };

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-3">
      <p className="text-sm font-semibold text-foreground">Booking&apos;i İptal Et</p>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Toplam tahsil edilen: <strong className="text-foreground">{totalPaid.toLocaleString("tr-TR")} ₺</strong>
        {days !== null && (
          <> · Etkinliğe {days} gün kaldı{withinNonRefundableWindow && (
            <span className="text-amber-700"> — koşullara göre kapora iade edilmeyebilir ({NON_REFUNDABLE_WINDOW_DAYS} gün kuralı)</span>
          )}</>
        )}
      </p>

      <div>
        <label className="block text-[10px] tracking-wide uppercase text-muted-foreground mb-1">İade Tutarı (₺)</label>
        <input
          type="number" min={0} max={totalPaid} step="0.01"
          value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          iyzico ile tahsil edilmişse otomatik iade denenir; banka havalesiyse manuel iade kaydı açılır (Finans sayfasında görünür).
        </p>
      </div>

      <div>
        <label className="block text-[10px] tracking-wide uppercase text-muted-foreground mb-1">İptal Sebebi</label>
        <input
          value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="Ör. müşteri talebi, tarih değişikliği..."
          className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm"
        />
      </div>

      {err && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{err}</p>}

      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={isPending}
          className="text-sm px-4 py-2 rounded-full font-medium bg-red-600 text-white hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending ? "İptal ediliyor…" : "İptali Onayla"}
        </button>
        <button onClick={() => setOpen(false)} disabled={isPending} className="text-sm px-4 py-2 text-muted-foreground hover:text-foreground">
          Vazgeç
        </button>
      </div>
    </div>
  );
}
