"use client";

// "Onaylı başvuruları uygulamaya taşı" — dj_profiles (web) → artist_profiles
// (noqt Social arzı) toplu köprüsü. Önce SAYAR, kurucu onaylarsa uygular
// (50'şerlik sayfalarla, bkz. bulkPromoteApprovedDjProfiles).
// Yetki: her iki server action da requireAdmin() ile açılıyor.

import { useState, useTransition } from "react";
import { countPromotableDjProfiles, promoteApprovedDjProfiles } from "./actions";

export default function PromoteToAppButton() {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const run = () => {
    setMessage(null);
    startTransition(async () => {
      try {
        const { pending } = await countPromotableDjProfiles();
        if (pending === 0) {
          setMessage("✓ Taşınacak başvuru yok — onaylı sanatçıların hepsi uygulamada.");
          return;
        }
        if (
          !confirm(
            `${pending} onaylı başvurunun uygulamada karşılığı yok.\n\n` +
              "Bunlar noqt Social'a onaylı ve YAYINDA olarak taşınacak. " +
              "Uygulamada zaten var olan profillere dokunulmayacak (yalnız gizli kalanlar yayına alınır).\n\n" +
              "Devam edilsin mi?"
          )
        ) {
          setMessage(`${pending} başvuru taşınmayı bekliyor (uygulanmadı).`);
          return;
        }
        const res = await promoteApprovedDjProfiles();
        const fail = res.failed.length
          ? ` — ${res.failed.length} kayıt başarısız: ${res.failed.map((f) => f.name).join(", ")}`
          : "";
        setMessage(
          `✓ ${res.created} yeni taşındı, ${res.updated} kayıt yayına alındı, ${res.skipped} kayıt zaten hazırdı${fail}.`
        );
      } catch (e) {
        setMessage(`Hata: ${e instanceof Error ? e.message : "Bilinmeyen hata"}`);
      }
    });
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={run}
        disabled={isPending}
        className="inline-flex items-center gap-2 border border-border text-foreground px-4 py-2.5 rounded-full text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
      >
        {isPending ? "Taşınıyor…" : "📲 Onaylı Başvuruları Uygulamaya Taşı"}
      </button>

      {message && (
        <p className="absolute right-0 top-full mt-2 max-w-[420px] text-xs text-muted-foreground bg-white border border-border rounded-lg px-3 py-2 shadow-sm z-10">
          {message}
        </p>
      )}
    </div>
  );
}
