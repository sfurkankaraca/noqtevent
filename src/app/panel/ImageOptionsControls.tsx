"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ACCENT_HEX, ACCENT_LABEL, ACCENT_OPTIONS, type ImageAccentName, type ImageTheme } from "@/lib/panel/gorsel/theme";

// Etkinlik satırlarında (takvim + admin etkinlikler) ve haftalık/aylık
// takvim görseli bölümünde (takvim sayfası üstü + admin mekan düzenleme)
// tekrar eden "Story Görseli / Post Görseli" indirme linkleri + basit
// özelleştirme ("Görsel Ayarları" — kurucu talebi, "İKİNCİ KAPSAM EKLEMESİ").
// Varsayılan seçimlerle linkler HER ZAMAN tek tıkla çalışır — ayarlar
// isteğe bağlı bir <details> açılırında, akışı yavaşlatmıyor. Seçimler
// yalnız bu bileşenin local state'inde tutuluyor (kalıcılık YOK — v1'de
// entity başına varsayılan tercih yazmak kapsam dışı, bkz. final rapor).
export function ImageOptionsControls({
  basePath,
  disabled,
  disabledReason,
}: {
  /** Route path'i, opsiyonel querystring ile (ör. "/panel/takvim/gorsel?entityId=...&period=week"). */
  basePath: string;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [theme, setTheme] = useState<ImageTheme>("dark");
  const [accent, setAccent] = useState<ImageAccentName>("amber");
  const [showPhoto, setShowPhoto] = useState(true);
  const [showHandle, setShowHandle] = useState(false);

  if (disabled) {
    return <p className="text-xs text-muted-foreground">{disabledReason ?? "Bu dönemde onaylı etkinlik yok."}</p>;
  }

  const buildHref = (format: "story" | "post") => {
    const [pathname, existingQuery] = basePath.split("?");
    const sp = new URLSearchParams(existingQuery ?? "");
    sp.set("format", format);
    sp.set("theme", theme);
    sp.set("accent", accent);
    sp.set("showPhoto", showPhoto ? "1" : "0");
    sp.set("showHandle", showHandle ? "1" : "0");
    return `${pathname}?${sp.toString()}`;
  };

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="outline"
          render={
            <a href={buildHref("story")} target="_blank" rel="noopener noreferrer">
              Story Görseli
            </a>
          }
        />
        <Badge
          variant="outline"
          render={
            <a href={buildHref("post")} target="_blank" rel="noopener noreferrer">
              Post Görseli
            </a>
          }
        />
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground">Görsel Ayarları</summary>
        <div className="mt-2 space-y-2.5 rounded-lg border border-border bg-muted/40 p-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Tema</span>
            {(["dark", "light"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTheme(t)}
                className={`rounded-full border px-2.5 py-0.5 ${
                  theme === t ? "border-foreground bg-foreground text-background" : "border-border text-foreground"
                }`}
              >
                {t === "dark" ? "Koyu" : "Açık"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-muted-foreground">Vurgu</span>
            {ACCENT_OPTIONS.map((name) => (
              <button
                key={name}
                type="button"
                title={ACCENT_LABEL[name]}
                aria-label={ACCENT_LABEL[name]}
                onClick={() => setAccent(name)}
                style={{ backgroundColor: ACCENT_HEX[name] }}
                className={`h-5 w-5 rounded-full border-2 ${accent === name ? "border-foreground" : "border-transparent"}`}
              />
            ))}
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showPhoto} onChange={(e) => setShowPhoto(e.target.checked)} className="h-3.5 w-3.5" />
            Fotoğrafı göster
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={showHandle} onChange={(e) => setShowHandle(e.target.checked)} className="h-3.5 w-3.5" />
            Instagram kullanıcı adını ekle
          </label>
        </div>
      </details>
    </div>
  );
}
