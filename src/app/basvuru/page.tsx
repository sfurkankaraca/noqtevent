"use client";

import { useState } from "react";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";

const PERFORMER_TYPES = [
  { id: "dj", label: "DJ", emoji: "🎧", desc: "Elektronik müzik, set performansı" },
  { id: "artist", label: "Solo Sanatçı", emoji: "🎤", desc: "Şarkıcı, enstrümantalist" },
  { id: "trio", label: "Trio / Grup", emoji: "🎶", desc: "Küçük müzik grubu" },
  { id: "dance", label: "Dans Ekibi", emoji: "💃", desc: "Gösteri, dans performansı" },
  { id: "band", label: "Bando / Orkestra", emoji: "🎺", desc: "Büyük müzik topluluğu" },
];

export default function BasvuruPage() {
  const [selectedType, setSelectedType] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("performer_type", selectedType || "dj");

    try {
      const res = await fetch("/api/basvuru", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Bir hata oluştu.");
      setSuccess(true);
      form.reset();
      setSelectedType("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 bg-[oklch(0.975_0.006_80)] min-h-screen">
        <div className="max-w-2xl mx-auto px-6">
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-10 bg-foreground/30" />
              <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
                Sanatçı / Partner Başvurusu
              </span>
            </div>
            <h1
              className="text-4xl text-foreground leading-tight"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              NOQT ile sahne al.
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              DJ, solo sanatçı, müzik grubu, dans ekibi veya orkestra olarak platformumuza katılmak için başvurunu ilet.
              Ekibimiz başvurunu inceleyip en kısa sürede dönüş yapacak.
            </p>
          </div>

          {success ? (
            <div className="bg-white rounded-2xl border border-border p-10 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Başvurun Alındı!</h2>
              <p className="text-muted-foreground text-sm">
                Ekibimiz başvurunu inceleyecek ve en kısa sürede seninle iletişime geçecek.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-border p-8 space-y-6">
              {/* Performer type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Sanatçı / Ekip Türü <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {PERFORMER_TYPES.map((pt) => (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => setSelectedType(pt.id)}
                      className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-colors ${
                        selectedType === pt.id
                          ? "border-foreground bg-foreground/5"
                          : "border-border hover:border-foreground/40"
                      }`}
                    >
                      <span className="text-xl">{pt.emoji}</span>
                      <span className="text-xs font-medium text-foreground">{pt.label}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">{pt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Ad / Sahne Adı <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  required
                  placeholder="DJ Nova, Ece Güler, The Jazz Trio…"
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/60 transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  E-posta <span className="text-red-500">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="ornek@mail.com"
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/60 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Şehir</label>
                  <input
                    name="city"
                    placeholder="İstanbul"
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/60 transition-colors"
                  />
                </div>
                {/* Speciality */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Uzmanlık / Tarz</label>
                  <input
                    name="speciality"
                    placeholder="Deep House, Latin Dans, Caz…"
                    className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/60 transition-colors"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Hakkında</label>
                <textarea
                  name="bio"
                  rows={4}
                  placeholder="Kendinizi tanıtın, deneyimlerinizden bahsedin…"
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/60 transition-colors resize-none"
                />
              </div>

              {/* Links */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Bağlantılar (isteğe bağlı)</p>
                <input
                  name="instagram_url"
                  type="url"
                  placeholder="Instagram profil linki"
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/60 transition-colors"
                />
                <input
                  name="spotify_url"
                  type="url"
                  placeholder="Spotify / SoundCloud / Mixcloud linki"
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/60 transition-colors"
                />
                <input
                  name="website_url"
                  type="url"
                  placeholder="Kişisel website"
                  className="w-full border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/60 transition-colors"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading || !selectedType}
                className="w-full bg-foreground text-background py-3.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Gönderiliyor…" : "Başvuruyu Gönder"}
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
