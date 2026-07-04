"use client";

import { useState, useTransition } from "react";
import { upsertPackage, deletePackage, type PackageRow } from "./actions";

type Props = {
  pkg: PackageRow;
  onDone?: () => void;
};

export default function PackageForm({ pkg, onDone }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [priceFrom, setPriceFrom] = useState(pkg.price_from?.toString() ?? "");
  const [priceNote, setPriceNote] = useState(pkg.price_note ?? "");
  const [tag, setTag] = useState(pkg.tag ?? "");
  const [isActive, setIsActive] = useState(pkg.is_active);
  const [name, setName] = useState(pkg.name);
  const [description, setDescription] = useState(pkg.description ?? "");
  const [includes, setIncludes] = useState<string[]>(pkg.includes ?? []);
  const [suitable, setSuitable] = useState<string[]>(pkg.suitable ?? []);
  const [ctaText, setCtaText] = useState(pkg.cta_text ?? "Teklif Al");
  const [ctaHref, setCtaHref] = useState(pkg.cta_href ?? "/planla");

  const save = () => {
    setError(null);
    startTransition(async () => {
      try {
        await upsertPackage({
          id: pkg.id,
          slug: pkg.slug,
          name,
          tag: tag || null,
          emoji: pkg.emoji,
          description: description || null,
          includes,
          suitable,
          price_from: priceFrom ? parseFloat(priceFrom) : null,
          price_note: priceNote || null,
          cta_text: ctaText || null,
          cta_href: ctaHref || null,
          color: pkg.color,
          is_dark: pkg.is_dark,
          is_active: isActive,
          sort_order: pkg.sort_order,
        });
        onDone?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Hata oluştu");
      }
    });
  };

  const remove = () => {
    if (!confirm(`"${pkg.name}" paketini silmek istediğinize emin misiniz?`)) return;
    startTransition(async () => {
      try {
        await deletePackage(pkg.id);
        onDone?.();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Hata oluştu");
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Paket Adı</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Etiket (tag)</label>
          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
            placeholder="En Çok Tercih"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Açıklama</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm resize-none"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Başlangıç Fiyatı (₺) — boş bırakırsan fiyat gösterilmez
          </label>
          <input
            type="number"
            value={priceFrom}
            onChange={(e) => setPriceFrom(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
            placeholder="örn. 25000"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Fiyat Notu (küçük yazı)
          </label>
          <input
            value={priceNote}
            onChange={(e) => setPriceNote(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
            placeholder="Kişisel teklif için"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">CTA Butonu Metni</label>
          <input
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">CTA Butonu Linki</label>
          <input
            value={ctaHref}
            onChange={(e) => setCtaHref(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Dahil olanlar (her satıra bir madde)
        </label>
        <textarea
          value={includes.join("\n")}
          onChange={(e) => setIncludes(e.target.value.split("\n").filter(Boolean))}
          rows={5}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm font-mono resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">
          Uygun etkinlikler (her satıra bir tane)
        </label>
        <textarea
          value={suitable.join("\n")}
          onChange={(e) => setSuitable(e.target.value.split("\n").filter(Boolean))}
          rows={3}
          className="w-full border border-border rounded-lg px-3 py-2 text-sm font-mono resize-none"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`active-${pkg.id}`}
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="rounded"
        />
        <label htmlFor={`active-${pkg.id}`} className="text-sm">Aktif (sitede görünsün)</label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={save}
          disabled={isPending}
          className="bg-foreground text-background px-5 py-2 rounded-full text-sm font-medium hover:opacity-80 disabled:opacity-50 transition-opacity"
        >
          {isPending ? "Kaydediliyor…" : "Kaydet"}
        </button>
        <button
          onClick={remove}
          disabled={isPending}
          className="text-sm text-red-600 hover:underline disabled:opacity-50"
        >
          Sil
        </button>
      </div>
    </div>
  );
}
