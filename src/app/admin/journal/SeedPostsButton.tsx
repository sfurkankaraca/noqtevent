"use client";

import { useState, useTransition } from "react";
import { seedDefaultPosts } from "./actions";

export default function SeedPostsButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ added: number; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await seedDefaultPosts();
        setResult(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Bir hata oluştu");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-2 border border-border text-foreground px-4 py-2.5 rounded-full text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
      >
        {isPending ? "Ekleniyor…" : "SEO Yazılarını Ekle"}
      </button>
      {result && (
        <span className="text-xs text-muted-foreground">
          {result.added > 0 ? `${result.added} yazı eklendi` : ""}
          {result.skipped > 0 ? `${result.added > 0 ? ", " : ""}${result.skipped} zaten vardı` : ""}
        </span>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
