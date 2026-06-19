import Link from "next/link";
import Navigation from "@/components/layout/Navigation";
import Footer from "@/components/layout/Footer";

export default function BasvuruLandingPage() {
  return (
    <>
      <Navigation />
      <main className="pt-24 pb-20 bg-[oklch(0.975_0.006_80)] min-h-screen">
        <div className="max-w-2xl mx-auto px-6">
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-10 bg-foreground/30" />
              <span className="text-xs tracking-[0.25em] uppercase text-muted-foreground font-medium">
                Başvuru
              </span>
            </div>
            <h1
              className="text-4xl text-foreground leading-tight"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)", fontWeight: 400 }}
            >
              NOQT ekosisteminе katıl.
            </h1>
            <p className="mt-4 text-muted-foreground leading-relaxed text-sm">
              Sanatçı mısın, hizmet ortağı mı? Aşağıdan kategorini seç, başvurunu tamamla.
              Ekibimiz inceleyecek, onay sonrası profilin yayına girecek.
            </p>
          </div>

          <div className="space-y-4">
            <Link
              href="/basvuru/sanatci"
              className="group flex items-center gap-6 bg-white rounded-2xl border border-border p-6 hover:border-foreground/30 transition-all hover:shadow-md"
            >
              <div className="text-4xl">🎭</div>
              <div className="flex-1">
                <h2 className="font-semibold text-foreground text-lg mb-1">Sanatçı / Performansçı</h2>
                <p className="text-sm text-muted-foreground">
                  DJ, solo sanatçı, müzik grubu, dans ekibi, bando, sunucu veya moderatör
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {["🎧 DJ", "🎤 Solo", "🎶 Grup", "💃 Dans", "🎺 Bando", "🎙️ Sunucu", "🗣️ Moderatör"].map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground">{t}</span>
                  ))}
                </div>
              </div>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors text-lg">→</span>
            </Link>

            <Link
              href="/basvuru/partner"
              className="group flex items-center gap-6 bg-white rounded-2xl border border-border p-6 hover:border-foreground/30 transition-all hover:shadow-md"
            >
              <div className="text-4xl">🤝</div>
              <div className="flex-1">
                <h2 className="font-semibold text-foreground text-lg mb-1">Hizmet Ortağı / Partner</h2>
                <p className="text-sm text-muted-foreground">
                  Fotoğrafçı, dekorasyon, catering, mekan, ulaşım, güzellik ve daha fazlası
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {["📸 Fotoğraf", "🌸 Dekor", "🍽️ Catering", "🏛️ Mekan", "🚗 Ulaşım", "💄 Güzellik"].map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground">{t}</span>
                  ))}
                </div>
              </div>
              <span className="text-muted-foreground group-hover:text-foreground transition-colors text-lg">→</span>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
