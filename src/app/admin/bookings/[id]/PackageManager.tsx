"use client";

import { useRef, useState, useTransition } from "react";
import { applyOfferPackage, saveOfferPackages, type OfferPackagePayload } from "../actions";
import type { OfferPackage } from "@/lib/offerPackages";

type LineDraft = { key: number; title: string; description: string; amount: string };
type PackageDraft = {
  key: number;
  id: string | null;
  title: string;
  subtitle: string;
  fee: string;
  isRecommended: boolean;
  lines: LineDraft[];
};

// Yeni paket eklerken hazır başlıklar — admin isterse üzerine yazar
const PRESET_TITLES = ["Klasik", "Premium", "Full Prodüksiyon"];

const inputCls =
  "w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40";

export default function PackageManager({
  bookingId,
  packages: initialPackages,
  selectedPackageId,
  packageSelectedAt,
  offerSlug,
}: {
  bookingId: string;
  packages: OfferPackage[];
  selectedPackageId: string | null;
  packageSelectedAt: string | null;
  offerSlug: string | null;
}) {
  // Liste anahtarları yalnızca React reconciliation için. Başlangıç kayıtları
  // index'i kullanır; sonradan eklenenler çakışmasın diye sayaç 1000'den başlar.
  const keyRef = useRef(1000);
  const newKey = () => ++keyRef.current;

  const [packages, setPackages] = useState<PackageDraft[]>(() =>
    initialPackages.map((p, pi) => ({
      key: pi,
      id: p.id,
      title: p.title,
      subtitle: p.subtitle ?? "",
      fee: String(p.fee ?? ""),
      isRecommended: p.is_recommended,
      lines: p.lines.map((l, li) => ({
        key: li,
        title: l.title,
        description: l.description ?? "",
        amount: l.amount ? String(l.amount) : "",
      })),
    }))
  );

  const [open, setOpen] = useState(initialPackages.length > 0);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [applying, setApplying] = useState(false);

  const selected = initialPackages.find((p) => p.id === selectedPackageId) ?? null;

  const addPackage = () => {
    const title = PRESET_TITLES[packages.length] ?? "";
    setPackages((prev) => [
      ...prev,
      { key: newKey(), id: null, title, subtitle: "", fee: "", isRecommended: false, lines: [] },
    ]);
    setOpen(true);
  };

  const updatePackage = (key: number, patch: Partial<PackageDraft>) =>
    setPackages((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  const removePackage = (key: number) => setPackages((prev) => prev.filter((p) => p.key !== key));

  const movePackage = (key: number, dir: -1 | 1) =>
    setPackages((prev) => {
      const i = prev.findIndex((p) => p.key === key);
      const j = i + dir;
      if (i === -1 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const addLine = (pkgKey: number) =>
    setPackages((prev) =>
      prev.map((p) =>
        p.key === pkgKey
          ? { ...p, lines: [...p.lines, { key: newKey(), title: "", description: "", amount: "" }] }
          : p
      )
    );

  const updateLine = (pkgKey: number, lineKey: number, patch: Partial<LineDraft>) =>
    setPackages((prev) =>
      prev.map((p) =>
        p.key === pkgKey
          ? { ...p, lines: p.lines.map((l) => (l.key === lineKey ? { ...l, ...patch } : l)) }
          : p
      )
    );

  const removeLine = (pkgKey: number, lineKey: number) =>
    setPackages((prev) =>
      prev.map((p) => (p.key === pkgKey ? { ...p, lines: p.lines.filter((l) => l.key !== lineKey) } : p))
    );

  const handleSave = () => {
    setError(null);
    for (const p of packages) {
      if (!p.title.trim()) { setError("Her pakete bir başlık girin."); return; }
      if (!(parseFloat(p.fee) > 0)) { setError(`"${p.title || "İsimsiz"}" paketi için 0'dan büyük fiyat girin.`); return; }
    }
    const payload: OfferPackagePayload[] = packages.map((p) => ({
      id: p.id,
      title: p.title.trim(),
      subtitle: p.subtitle.trim() || null,
      fee: parseFloat(p.fee) || 0,
      is_recommended: p.isRecommended,
      lines: p.lines
        .filter((l) => l.title.trim())
        .map((l) => ({
          title: l.title.trim(),
          description: l.description.trim() || null,
          amount: parseFloat(l.amount) || null,
        })),
    }));

    startTransition(async () => {
      const result = await saveOfferPackages(bookingId, payload);
      if (!result.ok) { setError(result.error); return; }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  const handleApply = async (packageId: string) => {
    setError(null);
    setApplying(true);
    const result = await applyOfferPackage(bookingId, packageId);
    setApplying(false);
    if (!result.ok) setError(result.error);
  };

  const fmt = (n: number) => n.toLocaleString("tr-TR");

  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center justify-between w-full text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
      >
        <span>Çok Seçenekli Teklif (Paketler)</span>
        <span>{open ? "−" : "+"}</span>
      </button>

      {!open && (
        <p className="text-xs text-muted-foreground">
          {initialPackages.length === 0
            ? "Henüz paket yok — müşteriye tek fiyat gösterilir."
            : `${initialPackages.length} paket tanımlı${selected ? ` · Müşteri seçti: ${selected.title}` : ""}`}
        </p>
      )}

      {selected && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-800 space-y-0.5">
          <p className="font-medium">
            ✓ Seçilen paket: {selected.title} — {fmt(selected.fee)} ₺
          </p>
          {packageSelectedAt && (
            <p>{new Date(packageSelectedAt).toLocaleString("tr-TR")} tarihinde seçildi</p>
          )}
          <p className="text-green-700/80">Bu tutar booking ücretine yazıldı; sözleşme ve ödeme buna göre ilerler.</p>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 leading-relaxed">{error}</p>
      )}

      {open && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            Müşteriye A/B/C şeklinde birkaç paket sunun. Teklif sayfasında paketleri yan yana görüp
            birini seçer; seçtiği paketin bedeli booking ücreti olur ve sözleşme/ödeme akışı
            buna göre devam eder.
            {!offerSlug && " Paketlerin görünmesi için önce yukarıdan teklif linki oluşturun."}
          </p>

          {packages.map((p, idx) => (
            <div key={p.key} className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] px-2 py-1 rounded-full font-medium uppercase tracking-wide bg-secondary text-muted-foreground">
                  Paket {idx + 1}
                </span>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => movePackage(p.key, -1)} disabled={idx === 0}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30">↑</button>
                  <button type="button" onClick={() => movePackage(p.key, 1)} disabled={idx === packages.length - 1}
                    className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-30">↓</button>
                  <button type="button" onClick={() => removePackage(p.key)}
                    className="text-xs text-muted-foreground hover:text-red-600 transition-colors">Kaldır ✕</button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <input value={p.title} onChange={(e) => updatePackage(p.key, { title: e.target.value })}
                  placeholder="Paket adı — örn. Premium" className={`${inputCls} col-span-2`} />
                <input type="number" min="0" value={p.fee}
                  onChange={(e) => updatePackage(p.key, { fee: e.target.value })}
                  placeholder="Fiyat ₺" className={inputCls} />
              </div>
              <input value={p.subtitle} onChange={(e) => updatePackage(p.key, { subtitle: e.target.value })}
                placeholder="Kısa açıklama — örn. 200 kişiye kadar, 5 saat" className={inputCls} />

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={p.isRecommended}
                  onChange={(e) => updatePackage(p.key, { isRecommended: e.target.checked })}
                  className="rounded border-border" />
                <span className="text-xs text-foreground">Önerilen paket olarak işaretle</span>
              </label>

              <div className="space-y-2">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Kapsam</p>
                {p.lines.map((l) => (
                  <div key={l.key} className="grid grid-cols-[1fr_auto] gap-2 items-start">
                    <div className="space-y-1.5">
                      <input value={l.title} onChange={(e) => updateLine(p.key, l.key, { title: e.target.value })}
                        placeholder="Madde — örn. 5 saat DJ performansı" className={inputCls} />
                      <input value={l.description} onChange={(e) => updateLine(p.key, l.key, { description: e.target.value })}
                        placeholder="Detay (opsiyonel)" className={`${inputCls} text-xs`} />
                    </div>
                    <button type="button" onClick={() => removeLine(p.key, l.key)}
                      className="text-xs text-muted-foreground hover:text-red-600 transition-colors pt-2">✕</button>
                  </div>
                ))}
                <button type="button" onClick={() => addLine(p.key)}
                  className="text-xs px-3 py-1.5 rounded-full border border-border text-foreground hover:bg-secondary transition-colors">
                  + Kapsam Maddesi
                </button>
              </div>

              {p.id && p.id !== selectedPackageId && (
                <button type="button" onClick={() => handleApply(p.id!)} disabled={applying}
                  className="w-full py-2 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                  {applying ? "Uygulanıyor…" : "Bu paketi müşteri adına kesinleştir"}
                </button>
              )}
            </div>
          ))}

          <div className="flex gap-2">
            <button type="button" onClick={addPackage}
              className="flex-1 py-2 rounded-xl border border-border text-sm text-foreground hover:bg-secondary transition-colors">
              + Paket Ekle
            </button>
            <button type="button" onClick={handleSave} disabled={isPending}
              className="flex-1 py-2 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
              {isPending ? "Kaydediliyor…" : saved ? "✓ Kaydedildi" : "Paketleri Kaydet"}
            </button>
          </div>
          {packages.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Kaydetmek paketleri tamamen siler — müşteriye yine tek fiyat gösterilir.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
