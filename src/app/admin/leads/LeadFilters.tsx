"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

type Option = { value: string; label: string };

const SORT_OPTIONS: Option[] = [
  { value: "smart", label: "Akıllı sıralama (varsayılan)" },
  { value: "date_desc", label: "Geliş — en yeni önce" },
  { value: "date_asc", label: "Geliş — en eski önce" },
  { value: "score_desc", label: "Skor — yüksekten düşüğe" },
  { value: "score_asc", label: "Skor — düşükten yükseğe" },
  { value: "event_date_asc", label: "Etkinlik tarihi — yaklaşan önce" },
];

const selectCls =
  "px-3.5 py-2 rounded-full text-xs border border-border bg-white text-foreground hover:border-foreground/40 transition-colors focus:outline-none focus:border-foreground/40";

export default function LeadFilters({ cities, types }: { cities: Option[]; types: Option[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const set = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  };

  const hasActiveFilter = searchParams.get("city") || searchParams.get("type") || (searchParams.get("sort") && searchParams.get("sort") !== "smart");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={searchParams.get("city") ?? ""}
        onChange={(e) => set("city", e.target.value)}
        className={selectCls}
      >
        <option value="">Tüm şehirler</option>
        {cities.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      <select
        value={searchParams.get("type") ?? ""}
        onChange={(e) => set("type", e.target.value)}
        className={selectCls}
      >
        <option value="">Tüm etkinlik türleri</option>
        {types.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      <select
        value={searchParams.get("sort") ?? "smart"}
        onChange={(e) => set("sort", e.target.value)}
        className={selectCls}
      >
        {SORT_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {hasActiveFilter && (
        <button
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete("city");
            params.delete("type");
            params.delete("sort");
            router.push(`${pathname}?${params.toString()}`);
          }}
          className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 decoration-border transition-colors"
        >
          filtreleri temizle
        </button>
      )}
    </div>
  );
}
