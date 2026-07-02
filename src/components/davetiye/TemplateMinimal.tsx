import Image from "next/image";
import RsvpForm from "./RsvpForm";

const BASE_URL = process.env.NEXT_PUBLIC_URL || "https://www.noqt.events";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function TemplateMinimal({ inv }: { inv: Record<string, any> }) {
  const date = inv.wedding_date
    ? new Date(inv.wedding_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="min-h-screen bg-white text-black">
      <div className="max-w-lg mx-auto px-8 py-24 lg:py-32">
        {/* Cover */}
        {inv.cover_photo_url && (
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-16">
            <Image src={inv.cover_photo_url} alt="Düğün" fill className="object-cover" priority />
          </div>
        )}

        {/* Title */}
        <div className="mb-16">
          <p className="text-black/30 text-[10px] tracking-[0.4em] uppercase mb-8">Düğün Daveti</p>
          <h1 className="text-4xl lg:text-5xl font-light leading-tight">
            {inv.bride_name} <span className="text-black/25">&amp;</span> {inv.groom_name}
          </h1>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-8 mb-16 border-t border-black/10 pt-10">
          {date && (
            <div>
              <p className="text-black/30 text-[10px] tracking-[0.3em] uppercase mb-2">Tarih</p>
              <p className="text-sm">{date}</p>
              {inv.wedding_time && <p className="text-black/50 text-sm">{inv.wedding_time}</p>}
            </div>
          )}
          {inv.venue_name && (
            <div>
              <p className="text-black/30 text-[10px] tracking-[0.3em] uppercase mb-2">Mekan</p>
              <p className="text-sm">{inv.venue_name}</p>
              {inv.venue_address && <p className="text-black/50 text-xs mt-1">{inv.venue_address}</p>}
            </div>
          )}
          {inv.dress_code && (
            <div>
              <p className="text-black/30 text-[10px] tracking-[0.3em] uppercase mb-2">Kıyafet</p>
              <p className="text-sm">{inv.dress_code}</p>
            </div>
          )}
          {inv.music_note && (
            <div>
              <p className="text-black/30 text-[10px] tracking-[0.3em] uppercase mb-2">Müzik</p>
              <p className="text-sm text-black/70">{inv.music_note}</p>
            </div>
          )}
        </div>

        {inv.story && (
          <p className="text-black/50 leading-relaxed text-sm mb-16 border-l-2 border-black/10 pl-6">
            {inv.story}
          </p>
        )}

        {inv.venue_maps_url && (
          <a
            href={inv.venue_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mb-12 text-xs border border-black/20 px-5 py-2.5 rounded-full text-black/60 hover:border-black/50 transition-colors"
          >
            Haritada Gör ↗
          </a>
        )}

        {(inv.seating_plan_url || (Array.isArray(inv.seating_tables) && inv.seating_tables.length > 0)) && (
          <div>
            <p className="text-black/30 text-[10px] tracking-[0.4em] uppercase mb-4">Oturma Planı</p>
            {inv.seating_plan_url && (
              <img src={inv.seating_plan_url} alt="Oturma planı" className="w-full rounded-2xl mb-4" />
            )}
            {Array.isArray(inv.seating_tables) && inv.seating_tables.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-8">
                {inv.seating_tables.map((tbl: { name: string; capacity: number; guests: string[] }) => (
                  <div key={tbl.name} className="border border-black/10 rounded-xl p-3">
                    <p className="text-black/30 text-[10px] tracking-widest uppercase mb-2">{tbl.name}</p>
                    <ul className="space-y-1">
                      {tbl.guests.map((g: string) => <li key={g} className="text-xs text-black/70">{g}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {inv.memory_drive_url && (
          <div>
            <p className="text-black/30 text-[10px] tracking-[0.4em] uppercase mb-3">Memory Drive</p>
            <a
              href={inv.memory_drive_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-black/15 rounded-full px-5 py-2.5 text-xs text-black/60 hover:border-black/40 transition-colors mb-8"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="8 21 12 17 16 21"/><line x1="12" y1="17" x2="12" y2="3"/></svg>
              Fotoğraf & Video Yükle
            </a>
          </div>
        )}

        {inv.rsvp_enabled && (
          <div>
            <p className="text-black/30 text-[10px] tracking-[0.4em] uppercase mb-6">Katılım Bildirimi</p>
            <RsvpForm
              invitationId={inv.id}
              deadline={inv.rsvp_deadline}
              invitationUrl={`${BASE_URL}/davetiye/${inv.slug}`}
            />
          </div>
        )}

        <div className="mt-20 pt-8 border-t border-black/10">
          <p className="text-black/20 text-[10px] tracking-widest">NOQT.EVENTS</p>
        </div>
      </div>
    </div>
  );
}
