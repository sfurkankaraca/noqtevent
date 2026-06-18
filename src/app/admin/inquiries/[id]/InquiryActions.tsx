"use client";

import { useTransition, useState } from "react";
import { updateInquiryStatus, updateAdminNotes, assignDj } from "../actions";

const STATUS_OPTIONS = [
  { value: "new", label: "Yeni", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "contacted", label: "İletişime Geçildi", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "confirmed", label: "Onaylandı", color: "bg-green-50 text-green-700 border-green-200" },
  { value: "cancelled", label: "İptal", color: "bg-red-50 text-red-700 border-red-200" },
];

type Dj = { id: string; name: string };

export function StatusBadge({ status }: { status: string }) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status) ?? STATUS_OPTIONS[0];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${opt.color}`}>
      {opt.label}
    </span>
  );
}

export function InquiryActions({
  inquiryId,
  currentStatus,
  currentNotes,
  djs,
  assignedDjId,
}: {
  inquiryId: string;
  currentStatus: string;
  currentNotes: string | null;
  djs: Dj[];
  assignedDjId: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [notes, setNotes] = useState(currentNotes ?? "");
  const [notesSaved, setNotesSaved] = useState(false);

  function handleStatus(value: string) {
    startTransition(async () => {
      await updateInquiryStatus(inquiryId, value);
    });
  }

  function handleDj(djId: string) {
    startTransition(async () => {
      await assignDj(inquiryId, djId || null);
    });
  }

  function handleSaveNotes() {
    startTransition(async () => {
      await updateAdminNotes(inquiryId, notes);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-4">
      {/* Status */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Durum</h3>
        <div className="flex flex-wrap gap-2">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatus(opt.value)}
              disabled={isPending}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer disabled:opacity-50 ${
                currentStatus === opt.value
                  ? opt.color + " ring-2 ring-offset-1 ring-current"
                  : "bg-secondary text-muted-foreground border-border hover:bg-secondary/60"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Assign DJ */}
      {djs.length > 0 && (
        <div className="bg-white rounded-2xl border border-border p-6 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">DJ Atama</h3>
          <select
            defaultValue={assignedDjId ?? ""}
            onChange={(e) => handleDj(e.target.value)}
            disabled={isPending}
            className="w-full text-sm border border-border rounded-xl px-3 py-2 text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-foreground/20 disabled:opacity-50"
          >
            <option value="">— DJ seç —</option>
            {djs.map((dj) => (
              <option key={dj.id} value={dj.id}>
                {dj.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Admin notes */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Admin Notları</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="İç kullanım notları... (müşteriye gösterilmez)"
          className="w-full text-sm border border-border rounded-xl px-3 py-2 text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-foreground/20"
        />
        <button
          onClick={handleSaveNotes}
          disabled={isPending}
          className="text-xs px-4 py-2 bg-foreground text-background rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          {notesSaved ? "Kaydedildi ✓" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}
