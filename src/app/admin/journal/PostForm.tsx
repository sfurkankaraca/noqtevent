"use client";

import { useRef, useState } from "react";
import Image from "next/image";

type Post = {
  id?: string;
  slug?: string;
  title?: string;
  category?: string;
  excerpt?: string;
  content?: string;
  cover_image_url?: string | null;
  color?: string;
  read_time?: string;
  is_featured?: boolean;
  is_published?: boolean;
};

const BG_COLORS = [
  "bg-[oklch(0.88_0.05_75)]", "bg-[oklch(0.92_0.02_320)]",
  "bg-[oklch(0.94_0.01_200)]", "bg-[oklch(0.91_0.025_160)]",
  "bg-[oklch(0.90_0.04_55)]", "bg-[oklch(0.93_0.008_280)]",
  "bg-secondary",
];

export default function PostForm({
  post,
  action,
}: {
  post?: Post;
  action: (fd: FormData) => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [preview, setPreview] = useState<string | null>(post?.cover_image_url ?? null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    await action(new FormData(formRef.current!));
    setPending(false);
  }

  const inputCls = "w-full text-sm border border-border rounded-xl px-3 py-2 text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-foreground/20";
  const labelCls = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      {post?.id && <input type="hidden" name="id" value={post.id} />}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Başlık *</label>
          <input name="title" required defaultValue={post?.title ?? ""} className={inputCls} placeholder="Makale başlığı" />
        </div>
        <div>
          <label className={labelCls}>Slug (URL) *</label>
          <input name="slug" required defaultValue={post?.slug ?? ""} className={inputCls} placeholder="makale-basligi" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Kategori</label>
          <input name="category" defaultValue={post?.category ?? ""} className={inputCls} placeholder="Düğün Müziği" />
        </div>
        <div>
          <label className={labelCls}>Okuma Süresi</label>
          <input name="read_time" defaultValue={post?.read_time ?? ""} className={inputCls} placeholder="5 dk" />
        </div>
      </div>

      <div>
        <label className={labelCls}>Özet</label>
        <textarea name="excerpt" rows={2} defaultValue={post?.excerpt ?? ""} className={inputCls + " resize-none"} placeholder="Kısa özet (liste sayfasında görünür)" />
      </div>

      <div>
        <label className={labelCls}>İçerik (Markdown)</label>
        <textarea name="content" rows={14} defaultValue={post?.content ?? ""} className={inputCls + " resize-none font-mono text-xs"} placeholder="## Başlık&#10;&#10;İçerik buraya..." />
      </div>

      <div>
        <label className={labelCls}>Kart Rengi</label>
        <div className="flex gap-2 flex-wrap">
          {BG_COLORS.map((c) => (
            <label key={c} className="cursor-pointer">
              <input type="radio" name="color" value={c} defaultChecked={post?.color === c || (!post?.color && c === "bg-secondary")} className="sr-only" />
              <div className={`w-8 h-8 rounded-lg border-2 ${c} ${post?.color === c ? "border-foreground" : "border-transparent"}`} />
            </label>
          ))}
        </div>
      </div>

      {/* Cover image */}
      <div>
        <label className={labelCls}>Kapak Görseli</label>
        {preview && (
          <div className="relative w-full h-48 rounded-xl overflow-hidden mb-2 bg-secondary">
            <Image src={preview} alt="Önizleme" fill className="object-cover" unoptimized />
          </div>
        )}
        <input
          type="file" name="cover_image" accept="image/*"
          className="text-sm text-muted-foreground"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) setPreview(URL.createObjectURL(f));
          }}
        />
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" name="is_featured" value="true" defaultChecked={post?.is_featured ?? false} className="rounded" />
          Öne çıkan yazı
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" name="is_published" value="true" defaultChecked={post?.is_published ?? false} className="rounded" />
          Yayınla (public görünsün)
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="bg-foreground text-background px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
      >
        {pending ? "Kaydediliyor..." : post?.id ? "Güncelle" : "Yazı Ekle"}
      </button>
    </form>
  );
}
