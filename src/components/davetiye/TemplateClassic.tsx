import Image from "next/image";
import RsvpForm from "./RsvpForm";

const BASE_URL = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function TemplateClassic({ inv }: { inv: Record<string, any> }) {
  const date = inv.wedding_date
    ? new Date(inv.wedding_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-[oklch(0.975_0.006_80)] text-foreground">
      {/* Cover photo */}
      {inv.cover_photo_url && (
        <div className="relative h-[60vh]">
          <Image src={inv.cover_photo_url} alt="Düğün" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[oklch(0.975_0.006_80)]" />
        </div>
      )}

      <div className="max-w-xl mx-auto px-8 py-20 text-center space-y-16">
        {/* Names */}
        <div>
          <p className="text-muted-foreground text-xs tracking-[0.3em] uppercase mb-6">ile Sizleri</p>
          <h1 className="text-5xl lg:text-7xl font-light leading-tight" style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>
            {inv.bride_name}
          </h1>
          <p className="text-foreground/30 text-2xl my-4" style={{ fontFamily: "Georgia, serif" }}>&amp;</p>
          <h1 className="text-5xl lg:text-7xl font-light leading-tight" style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>
            {inv.groom_name}
          </h1>
          <p className="text-muted-foreground mt-4 text-sm">düğünlerine davet etmekten mutluluk duymaktadır.</p>
        </div>

        {/* Date & Venue */}
        {(date || inv.venue_name) && (
          <div className="border-y border-border py-10 space-y-3">
            {date && (
              <p className="text-2xl font-light text-foreground" style={{ fontFamily: "Georgia, serif" }}>
                {date}
              </p>
            )}
            {inv.wedding_time && <p className="text-muted-foreground">{inv.wedding_time}</p>}
            {inv.venue_name && <p className="text-foreground font-medium">{inv.venue_name}</p>}
            {inv.venue_address && <p className="text-muted-foreground text-sm">{inv.venue_address}</p>}
            {inv.venue_maps_url && (
              <a
                href={inv.venue_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm text-foreground underline underline-offset-4 hover:opacity-70 transition-opacity"
              >
                Haritada Gör
              </a>
            )}
          </div>
        )}

        {inv.story && (
          <p className="text-muted-foreground leading-relaxed text-base font-light" style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>
            &ldquo;{inv.story}&rdquo;
          </p>
        )}

        {inv.dress_code && (
          <div>
            <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-1">Kıyafet</p>
            <p className="text-foreground">{inv.dress_code}</p>
          </div>
        )}

        {(inv.seating_plan_url || (Array.isArray(inv.seating_tables) && inv.seating_tables.length > 0)) && (
          <div className="text-left">
            <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4 text-center">Oturma Planı</p>
            {inv.seating_plan_url && (
              <img src={inv.seating_plan_url} alt="Oturma planı" className="w-full rounded-xl mb-4" />
            )}
            {Array.isArray(inv.seating_tables) && inv.seating_tables.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {inv.seating_tables.map((tbl: { name: string; capacity: number; guests: string[] }) => (
                  <div key={tbl.name} className="border border-border rounded-xl p-3">
                    <p className="text-muted-foreground text-xs uppercase tracking-widest mb-2">{tbl.name}</p>
                    <ul className="space-y-1">
                      {tbl.guests.map((g: string) => <li key={g} className="text-sm text-foreground">{g}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {inv.memory_drive_url && (
          <div className="text-center">
            <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-4">Memory Drive</p>
            <a
              href={inv.memory_drive_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-border rounded-full px-6 py-3 text-sm text-foreground hover:border-foreground/40 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="3"/></svg>
              Fotoğraf & Video Yükle
            </a>
          </div>
        )}

        {inv.rsvp_enabled && (
          <div className="text-left">
            <p className="text-xs tracking-[0.25em] uppercase text-muted-foreground mb-6 text-center">Katılım Bildirimi</p>
            <RsvpForm
              invitationId={inv.id}
              deadline={inv.rsvp_deadline}
              invitationUrl={`${BASE_URL}/davetiye/${inv.slug}`}
            />
          </div>
        )}

        <div className="pt-4">
          <p className="text-foreground/20 text-xs tracking-widest">NOQT.EVENTS</p>
        </div>
      </div>
    </div>
  );
}
