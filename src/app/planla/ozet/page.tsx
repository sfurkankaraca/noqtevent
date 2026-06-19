"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  MUSIC_CONCEPTS,
  EVENT_TYPES,
  PARTNER_SERVICES,
  type PlannerData,
} from "@/components/planner/PlannerStore";

function getEventLabel(id: string) {
  return EVENT_TYPES.find((e) => e.id === id)?.label ?? id;
}

function getConceptsByIds(ids: string[]) {
  return ids
    .map((id) => MUSIC_CONCEPTS.find((c) => c.id === id))
    .filter(Boolean) as typeof MUSIC_CONCEPTS;
}

function getServiceLabel(id: string) {
  return PARTNER_SERVICES.find((s) => s.id === id)?.label ?? id;
}

function getServicesByCategory(ids: string[]) {
  const groups: Record<string, string[]> = {};
  ids.forEach((id) => {
    const svc = PARTNER_SERVICES.find((s) => s.id === id);
    if (!svc) return;
    if (!groups[svc.category]) groups[svc.category] = [];
    groups[svc.category].push(svc.label);
  });
  return groups;
}

const SECTION_LABELS: Record<string, { label: string; emoji: string; desc: string }> = {
  karsilama: { label: "Karşılama & Kokteyl", emoji: "🥂", desc: "Misafir kabulü ve ilk izlenim" },
  anaKutlama: { label: "Ana Kutlama", emoji: "✨", desc: "Gecenin kalbi" },
  afterParti: { label: "After Parti", emoji: "🌙", desc: "Kapanış ve dans zirve" },
};

export default function OzetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Yükleniyor…</div>}>
      <OzetContent />
    </Suspense>
  );
}

function OzetContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<PlannerData | null>(null);
  const [generatedAt] = useState(() => new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }));

  useEffect(() => {
    const raw = searchParams.get("d");
    if (!raw) return;
    try {
      const decoded = JSON.parse(decodeURIComponent(escape(atob(raw))));
      setData(decoded);
    } catch {
      // invalid data
    }
  }, [searchParams]);

  if (!data) return null;

  const sectionEntries = [
    { key: "karsilama", section: data.eventSections.karsilama },
    { key: "anaKutlama", section: data.eventSections.anaKutlama },
    { key: "afterParti", section: data.eventSections.afterParti },
  ].filter((s) => s.section.conceptIds.length > 0);

  const serviceGroups = getServicesByCategory(data.services);
  const hasServices = data.services.length > 0;

  return (
    <>
      {/* Print button — hidden in print */}
      <div className="print:hidden fixed bottom-6 right-6 z-50 flex gap-3">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-foreground text-background px-5 py-3 rounded-full text-sm font-medium shadow-lg hover:opacity-90 transition-opacity"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
          </svg>
          PDF Olarak Kaydet
        </button>
        <button
          onClick={() => window.close()}
          className="flex items-center gap-2 border border-border bg-white text-foreground px-4 py-3 rounded-full text-sm font-medium shadow-lg hover:bg-secondary transition-colors"
        >
          Kapat
        </button>
      </div>

      <div className="min-h-screen bg-white font-sans print:text-[11pt]">
        <style>{`
          @media print {
            @page { margin: 15mm 15mm 15mm 15mm; size: A4; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .page-break { page-break-before: always; }
          }
        `}</style>

        {/* ─── HEADER ─── */}
        <header className="px-12 pt-10 pb-8 border-b border-gray-200 flex items-start justify-between print:px-0 print:pt-0">
          <div>
            <div className="text-2xl font-bold tracking-tight text-gray-900" style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: "28px" }}>
              NOQT
            </div>
            <div className="text-xs text-gray-400 tracking-widest uppercase mt-0.5">Deneyim Stüdyosu</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-400 uppercase tracking-widest">Etkinlik Deneyim Taslağı</div>
            <div className="text-xs text-gray-400 mt-1">{generatedAt}</div>
          </div>
        </header>

        <main className="px-12 py-8 space-y-8 print:px-0">

          {/* ─── HERO TITLE ─── */}
          <div className="border-l-4 border-gray-900 pl-5">
            <h1 className="text-3xl text-gray-900 leading-tight" style={{ fontFamily: "Georgia, serif", fontWeight: 400 }}>
              {getEventLabel(data.eventType)} Deneyimi
            </h1>
            {data.eventDate && (
              <p className="text-gray-500 mt-1 text-sm">
                📅 {new Date(data.eventDate + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            )}
          </div>

          {/* ─── MÜŞTERİ BİLGİLERİ + ETKİNLİK DETAYLARI ─── */}
          <div className="grid grid-cols-2 gap-6">
            {/* Müşteri */}
            <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Müşteri Bilgileri</h2>
              <Row label="Ad Soyad" value={`${data.name} ${data.surname}`} />
              <Row label="E-posta" value={data.email} />
              <Row label="Telefon" value={data.phone} />
              {data.eventDate && (
                <Row label="Etkinlik Tarihi" value={new Date(data.eventDate + "T00:00:00").toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })} />
              )}
            </div>

            {/* Etkinlik detayları */}
            <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Etkinlik Detayları</h2>
              <Row label="Etkinlik Türü" value={getEventLabel(data.eventType)} />
              {data.guestType && <Row label="Misafir Profili" value={data.guestType} />}
              {data.hasChildren && <Row label="Çocuklar" value="Evet, çocuklar katılacak" />}
              {data.venueType && <Row label="Mekan" value={data.venueType} />}
              {data.hasVenue !== null && <Row label="Mekan Durumu" value={data.hasVenue ? "Mekan seçildi" : "Mekan aranıyor"} />}
            </div>
          </div>

          {/* ─── ETKİNLİK AKIŞI / MÜZİK PROGRAMı ─── */}
          {sectionEntries.length > 0 && (
            <section>
              <SectionTitle>Müzik Akışı & Konseptler</SectionTitle>
              <div className="space-y-5">
                {sectionEntries.map(({ key, section }, idx) => {
                  const meta = SECTION_LABELS[key];
                  const concepts = getConceptsByIds(section.conceptIds as string[]);
                  const isLast = idx === sectionEntries.length - 1;

                  return (
                    <div key={key} className="relative">
                      {/* Timeline line */}
                      {!isLast && (
                        <div className="absolute left-5 top-12 bottom-0 w-px bg-gray-200" />
                      )}

                      <div className="flex gap-4">
                        {/* Timeline dot */}
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-base z-10">
                          {meta.emoji}
                        </div>

                        <div className="flex-1 pb-6">
                          <div className="flex items-baseline gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900 text-base">{meta.label}</h3>
                            {"startTime" in section && section.startTime && (
                              <span className="text-xs text-gray-400 font-mono">{String(section.startTime)}</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mb-3">{meta.desc}</p>

                          {/* Style badge */}
                          {"style" in section && typeof section.style === "string" && section.style && (
                            <span className="inline-block mb-3 text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
                              {section.style === "modern" ? "✨ Modern" : section.style === "traditional" ? "🎵 Geleneksel" : section.style}
                            </span>
                          )}

                          {/* Concepts */}
                          <div className="flex flex-wrap gap-2">
                            {concepts.map((c) => (
                              <div key={c.id} className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 bg-white">
                                <span className="text-sm">{c.emoji}</span>
                                <div>
                                  <div className="text-xs font-semibold text-gray-800">{c.name}</div>
                                  <div className="text-[10px] text-gray-400 leading-tight">{c.atmosphere.slice(0, 2).join(" · ")}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ─── SEÇİLEN HİZMETLER ─── */}
          {hasServices && (
            <section>
              <SectionTitle>Talep Edilen Hizmetler</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(serviceGroups).map(([category, labels]) => (
                  <div key={category} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{category}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {labels.map((label) => (
                        <span key={label} className="text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-full text-gray-700">{label}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── NOQT NOTU ─── */}
          <section className="bg-gray-900 rounded-2xl p-6 text-white">
            <div className="flex gap-4 items-start">
              <div className="text-2xl mt-0.5">💡</div>
              <div>
                <h3 className="font-semibold text-white mb-1">Bu belge hakkında</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Bu taslak, {data.name} {data.surname} ile yapılan deneyim planlama oturumu sonucunda oluşturulmuştur.
                  Konsept seçimleri ve hizmet talepleri kesinleşmeden önce NOQT ekibi ile detaylı görüşme yapılacaktır.
                  Fiyat bilgisi bu belgede yer almamaktadır.
                </p>
              </div>
            </div>
          </section>

          {/* ─── FOOTER ─── */}
          <footer className="pt-4 border-t border-gray-200 flex items-center justify-between text-xs text-gray-400">
            <span>NOQT Deneyim Stüdyosu — noqt.events</span>
            <span>Taslak No: {Date.now().toString(36).toUpperCase().slice(-6)}</span>
          </footer>

        </main>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="text-gray-400 flex-shrink-0">{label}</span>
      <span className="text-gray-800 font-medium text-right">{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{children}</h2>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}
