import Image from "next/image";
import RsvpForm from "./RsvpForm";

const BASE_URL = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function TemplateModern({ inv }: { inv: Record<string, any> }) {
  const date = inv.wedding_date
    ? new Date(inv.wedding_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      {/* Hero */}
      <div className="relative h-screen flex items-end">
        {inv.cover_photo_url ? (
          <Image
            src={inv.cover_photo_url}
            alt="Düğün"
            fill
            className="object-cover opacity-50"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] to-[#0d0d0d]" />
        )}
        <div className="relative z-10 max-w-2xl mx-auto px-8 pb-20 w-full">
          <p className="text-white/40 text-xs tracking-[0.3em] uppercase mb-6">Davet</p>
          <h1 className="text-6xl lg:text-8xl font-light leading-none" style={{ fontFamily: "Georgia, serif" }}>
            {inv.bride_name}
            <span className="block text-white/30 text-4xl lg:text-5xl my-3">&amp;</span>
            {inv.groom_name}
          </h1>
          {date && (
            <p className="text-white/60 text-lg mt-8 tracking-wide">{date}{inv.wedding_time ? ` · ${inv.wedding_time}` : ""}</p>
          )}
          {inv.venue_name && (
            <p className="text-white/40 text-sm mt-2">{inv.venue_name}</p>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="max-w-2xl mx-auto px-8 py-20 space-y-16">
        {inv.story && (
          <section>
            <p className="text-white/30 text-xs tracking-[0.25em] uppercase mb-4">Hikayemiz</p>
            <p className="text-white/70 leading-relaxed text-lg font-light">{inv.story}</p>
          </section>
        )}

        {inv.venue_name && (
          <section>
            <p className="text-white/30 text-xs tracking-[0.25em] uppercase mb-4">Mekan</p>
            <p className="text-white text-lg">{inv.venue_name}</p>
            {inv.venue_address && <p className="text-white/50 text-sm mt-1">{inv.venue_address}</p>}
            {inv.venue_maps_url && (
              <a
                href={inv.venue_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-sm border border-white/20 px-5 py-2.5 rounded-full text-white/70 hover:border-white/50 transition-colors"
              >
                Haritada Gör ↗
              </a>
            )}
          </section>
        )}

        {inv.dress_code && (
          <section>
            <p className="text-white/30 text-xs tracking-[0.25em] uppercase mb-2">Kıyafet</p>
            <p className="text-white/70">{inv.dress_code}</p>
          </section>
        )}

        {inv.music_note && (
          <section>
            <p className="text-white/30 text-xs tracking-[0.25em] uppercase mb-2">Müzik</p>
            <p className="text-white/70">{inv.music_note}</p>
          </section>
        )}

        {(inv.seating_plan_url || (Array.isArray(inv.seating_tables) && inv.seating_tables.length > 0)) && (
          <section>
            <p className="text-white/30 text-xs tracking-[0.25em] uppercase mb-6">Oturma Planı</p>
            {inv.seating_plan_url && (
              <img src={inv.seating_plan_url} alt="Oturma planı" className="w-full rounded-xl mb-6 opacity-90" />
            )}
            {Array.isArray(inv.seating_tables) && inv.seating_tables.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {inv.seating_tables.map((tbl: { name: string; capacity: number; guests: string[] }) => (
                  <div key={tbl.name} className="border border-white/10 rounded-xl p-4">
                    <p className="text-white/50 text-xs uppercase tracking-widest mb-2">{tbl.name}</p>
                    <ul className="space-y-1">
                      {tbl.guests.map((g: string) => (
                        <li key={g} className="text-sm text-white/70">{g}</li>
                      ))}
                    </ul>
                    {tbl.guests.length === 0 && (
                      <p className="text-white/20 text-xs italic">Henüz atanmadı</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {inv.memory_drive_url && (
          <section>
            <p className="text-white/30 text-xs tracking-[0.25em] uppercase mb-4">Memory Drive</p>
            <a
              href={inv.memory_drive_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 border border-white/20 rounded-full px-6 py-3 text-sm text-white/70 hover:border-white/50 hover:text-white transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="3"/></svg>
              Fotoğraf & Video Yükle
            </a>
          </section>
        )}

        {inv.rsvp_enabled && (
          <section>
            <p className="text-white/30 text-xs tracking-[0.25em] uppercase mb-6">Katılım Bildirimi</p>
            <RsvpForm
              invitationId={inv.id}
              deadline={inv.rsvp_deadline}
              invitationUrl={`${BASE_URL}/davetiye/${inv.slug}`}
              dark
            />
          </section>
        )}

        <div className="pt-8 border-t border-white/10 text-center">
          <p className="text-white/20 text-xs tracking-widest">NOQT.EVENTS</p>
        </div>
      </div>
    </div>
  );
}
