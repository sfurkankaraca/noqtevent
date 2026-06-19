"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { upsertTestimonial } from "./actions";

const COLOR_OPTIONS = [
  { label: "Sıcak Krem", value: "bg-[oklch(0.88_0.055_65)]", dark: false },
  { label: "Açık Gri-Mavi", value: "bg-[oklch(0.93_0.006_240)]", dark: false },
  { label: "Turuncu-Şeftali", value: "bg-[oklch(0.84_0.07_40)]", dark: false },
  { label: "Açık Mor", value: "bg-[oklch(0.90_0.025_320)]", dark: false },
  { label: "Açık Yeşil", value: "bg-[oklch(0.88_0.035_120)]", dark: false },
  { label: "Koyu Lacivert", value: "bg-[oklch(0.20_0.025_260)]", dark: true },
  { label: "Koyu Siyah", value: "bg-foreground", dark: true },
  { label: "Açık Beyaz", value: "bg-[oklch(0.97_0.005_80)]", dark: false },
];

type Testimonial = {
  id?: string;
  quote?: string;
  name?: string;
  event?: string;
  initials?: string;
  color?: string;
  dark?: boolean;
  rating?: number;
  is_active?: boolean;
  sort_order?: number;
};

export default function TestimonialForm({ testimonial }: { testimonial?: Testimonial }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(testimonial?.color ?? COLOR_OPTIONS[0].value);
  const isDark = COLOR_OPTIONS.find((c) => c.value === selectedColor)?.dark ?? false;

  const handleAction = async (fd: FormData) => {
    fd.set("color", selectedColor);
    fd.set("dark", String(isDark));
    setPending(true);
    setError(null);
    try {
      await upsertTestimonial(fd);
      router.push("/admin/testimonials");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
      setPending(false);
    }
  };

  return (
    <form action={handleAction} className="space-y-6 max-w-2xl">
      {testimonial?.id && <input type="hidden" name="id" value={testimonial.id} />}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}

      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <h2 className="font-medium text-foreground">Yorum</h2>

        <div>
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">
            Yorum Metni *
          </label>
          <textarea
            name="quote"
            required
            rows={4}
            defaultValue={testimonial?.quote ?? ""}
            placeholder="Müşteri yorumu…"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Ad *</label>
            <input
              type="text" name="name" required defaultValue={testimonial?.name ?? ""}
              placeholder="Selin & Mert"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Baş Harfler</label>
            <input
              type="text" name="initials" defaultValue={testimonial?.initials ?? ""}
              placeholder="SM" maxLength={3}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Etkinlik</label>
          <input
            type="text" name="event" defaultValue={testimonial?.event ?? ""}
            placeholder="Düğün — Bodrum Villa"
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Puan</label>
            <select name="rating" defaultValue={testimonial?.rating ?? 5}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40">
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Sıra</label>
            <input
              type="number" name="sort_order" defaultValue={testimonial?.sort_order ?? 0} min={0}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Aktif</label>
            <select name="is_active" defaultValue={testimonial?.is_active !== false ? "true" : "false"}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40">
              <option value="true">Evet</option>
              <option value="false">Hayır</option>
            </select>
          </div>
        </div>

        {/* Color picker */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">Avatar Rengi</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedColor(opt.value)}
                className={`relative w-9 h-9 rounded-full border-2 transition-all ${opt.value} ${
                  selectedColor === opt.value ? "border-foreground scale-110" : "border-transparent hover:border-foreground/30"
                }`}
                title={opt.label}
              >
                {selectedColor === opt.value && (
                  <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${opt.dark ? "text-white" : "text-foreground"}`}>✓</span>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Seçilen: {COLOR_OPTIONS.find((c) => c.value === selectedColor)?.label} {isDark ? "(koyu zemin)" : "(açık zemin)"}
          </p>
        </div>

        {/* Preview */}
        <div className="border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-3 uppercase tracking-wide font-medium">Önizleme</p>
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold ${selectedColor} ${isDark ? "text-white" : "text-foreground"}`}
          >
            {/* initials preview — read from form */}
            AB
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? "Kaydediliyor…" : testimonial?.id ? "Güncelle" : "Yorum Ekle"}
        </button>
        <Link href="/admin/testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">İptal</Link>
      </div>
    </form>
  );
}
