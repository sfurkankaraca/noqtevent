"use client";

import { useState, useTransition } from "react";
import { submitReview } from "./actions";

export default function ReviewForm({
  slug, clientName, artistName,
}: {
  slug: string;
  clientName: string;
  artistName: string;
}) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [quote, setQuote] = useState("");
  const [name, setName] = useState(clientName ?? "");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      try {
        await submitReview({ slug, rating, quote, name: name.trim() });
        setDone(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Bir hata oluştu");
      }
    });
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40";

  return (
    <div className="min-h-screen bg-[oklch(0.975_0.006_80)]">
      <div className="max-w-lg mx-auto px-6 py-16">
        <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium mb-3 text-center">NOQT Experience</p>
        <h1
          className="text-3xl text-foreground leading-tight mb-2 text-center"
          style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
        >
          Etkinliğiniz nasıldı?
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          {artistName} ile geçirdiğiniz deneyimi bizimle paylaşın
        </p>

        {done ? (
          <div className="bg-white rounded-2xl border border-border p-8 text-center space-y-2">
            <p className="text-2xl">🙏</p>
            <p className="text-sm font-semibold text-foreground">Teşekkür ederiz!</p>
            <p className="text-xs text-muted-foreground">Değerlendirmeniz incelendikten sonra sitemizde yayınlanabilir.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
            <div>
              <label className="block text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2 text-center">Puanınız</label>
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-3xl leading-none transition-transform hover:scale-110"
                    aria-label={`${n} yıldız`}
                  >
                    {(hoverRating || rating) >= n ? "★" : "☆"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">Ad Soyad</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ad Soyad" className={inputCls} />
            </div>

            <div>
              <label className="block text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2">Yorumunuz</label>
              <textarea
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                placeholder="Deneyiminizi birkaç kelimeyle anlatın..."
                rows={4}
                className={`${inputCls} resize-none`}
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="w-full py-3.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isPending ? "Gönderiliyor…" : "Değerlendirmemi Gönder"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
