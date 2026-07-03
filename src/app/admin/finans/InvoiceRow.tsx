"use client";

import { useState, useTransition } from "react";
import { markPaymentInvoiced, markPaymentUninvoiced } from "./actions";

export default function InvoiceRow({
  paymentId, invoiced, invoiceNote,
}: {
  paymentId: string;
  invoiced: boolean;
  invoiceNote: string | null;
}) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(invoiceNote ?? "");
  const [isPending, startTransition] = useTransition();

  if (invoiced) {
    return (
      <div className="flex items-center justify-end gap-2">
        <span className="text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
          ✓ Faturalandı{invoiceNote ? ` · ${invoiceNote}` : ""}
        </span>
        <button
          onClick={() => startTransition(() => markPaymentUninvoiced(paymentId))}
          disabled={isPending}
          className="text-[11px] text-muted-foreground hover:text-foreground"
        >
          Geri al
        </button>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="flex items-center justify-end gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Fatura no (opsiyonel)"
          className="w-32 text-xs px-2 py-1 rounded-lg border border-border"
        />
        <button
          onClick={() => startTransition(async () => { await markPaymentInvoiced(paymentId, note); setEditing(false); })}
          disabled={isPending}
          className="text-[11px] bg-foreground text-background px-3 py-1.5 rounded-full disabled:opacity-50"
        >
          Kaydet
        </button>
        <button onClick={() => setEditing(false)} className="text-[11px] text-muted-foreground">Vazgeç</button>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <button
        onClick={() => setEditing(true)}
        className="text-[11px] px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
      >
        Faturalandı İşaretle
      </button>
    </div>
  );
}
