"use client";

import { useRef, useState } from "react";
import Image from "next/image";

type Concept = {
  id?: string;
  slug?: string;
  name?: string;
  emoji?: string;
  category?: string;
  description?: string;
  atmosphere?: string[];
  musical_direction?: string[];
  cover_image_url?: string | null;
  color?: string;
  is_dark?: boolean;
  is_signature?: boolean;
  energy_level?: number;
  sort_order?: number;
  is_active?: boolean;
  spotify_playlist_url?: string | null;
};

const CATEGORIES = [
  { value: "cocktail", label: "Kokteyl & Karşılama" },
  { value: "celebration", label: "Modern Kutlama" },
  { value: "traditional", label: "Geleneksel" },
  { value: "after-party", label: "After Party" },
];

export default function ConceptForm({
  concept,
  action,
}: {
  concept?: Concept;
  action: (fd: FormData) => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(concept?.cover_image_url ?? null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    const fd = new FormData(formRef.current!);
    await action(fd);
    setPending(false);
  }

  const inputCls = "w-full text-sm border border-border rounded-xl px-3 py-2 text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-foreground/20";
  const labelCls = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {concept?.id && <input type="hidden" name="id" value={concept.id} />}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Konsept Adı *</label>
          <input name="name" required defaultValue={concept?.name ?? ""} className={inputCls} placeholder="Gün Batımı" />
        </div>
        <div>
          <label className={labelCls}>Emoji</label>
          <input name="emoji" defaultValue={concept?.emoji ?? ""} className={inputCls} placeholder="🌅" maxLength={4} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Slug (URL) *</label>
          <input name="slug" required defaultValue={concept?.slug ?? ""} className={inputCls} placeholder="gun-batimi" />
        </div>
        <div>
          <label className={labelCls}>Kategori *</label>
          <select name="category" required defaultValue={concept?.category ?? "cocktail"} className={inputCls}>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Açıklama</label>
        <textarea name="description" rows={3} defaultValue={concept?.description ?? ""} className={inputCls + " resize-none"} placeholder="Bu konseptin atmosferi ve ruhu..." />
      </div>

      <div>
        <label className={labelCls}>Atmosfer (virgülle ayır)</label>
        <input name="atmosphere" defaultValue={(concept?.atmosphere ?? []).join(", ")} className={inputCls} placeholder="Sıcak, Duygusal, Modern, Estetik" />
      </div>

      <div>
        <label className={labelCls}>Müzik Yönü (virgülle ayır)</label>
        <input name="musical_direction" defaultValue={(concept?.musical_direction ?? []).join(", ")} className={inputCls} placeholder="Organic House, Afro House" />
      </div>

      <div>
        <label className={labelCls}>Spotify Playlist URL</label>
        <input
          name="spotify_playlist_url"
          type="url"
          defaultValue={concept?.spotify_playlist_url ?? ""}
          className={inputCls}
          placeholder="https://open.spotify.com/playlist/..."
        />
        <p className="text-xs text-muted-foreground mt-1">Konsept sayfasında embed olarak görünür.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Renk (Tailwind class)</label>
          <input name="color" defaultValue={concept?.color ?? "bg-secondary"} className={inputCls} placeholder="bg-[oklch(0.88_0.055_65)]" />
        </div>
        <div>
          <label className={labelCls}>Enerji Seviyesi (1-10)</label>
          <input name="energy_level" type="number" min={1} max={10} defaultValue={concept?.energy_level ?? 5} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Sıralama</label>
          <input name="sort_order" type="number" defaultValue={concept?.sort_order ?? 0} className={inputCls} />
        </div>
        <div className="space-y-2 pt-5">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="is_signature" value="true" defaultChecked={concept?.is_signature ?? false} className="rounded" />
            İmza konsept
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="is_dark" value="true" defaultChecked={concept?.is_dark ?? false} className="rounded" />
            Koyu arka plan
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" name="is_active" value="true" defaultChecked={concept?.is_active ?? true} className="rounded" />
            Aktif (public görünsün)
          </label>
        </div>
      </div>

      {/* Cover image */}
      <div>
        <label className={labelCls}>Kapak Görseli</label>
        {preview && (
          <div className="relative w-full h-40 rounded-xl overflow-hidden mb-2 bg-secondary">
            <Image src={preview} alt="Önizleme" fill className="object-cover" unoptimized />
          </div>
        )}
        <input
          type="file"
          name="cover_image"
          accept="image/*"
          className="text-sm text-muted-foreground"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setPreview(URL.createObjectURL(f));
          }}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-foreground text-background px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      >
        {pending ? "Kaydediliyor..." : concept?.id ? "Güncelle" : "Konsept Ekle"}
      </button>
    </form>
  );
}
