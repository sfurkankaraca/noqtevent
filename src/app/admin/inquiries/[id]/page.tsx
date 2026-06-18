import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import { InquiryActions, StatusBadge } from "./InquiryActions";

const EVENT_LABELS: Record<string, string> = {
  wedding: "Düğün", "kina-gecesi": "Kına Gecesi", corporate: "Kurumsal",
  opening: "Açılış", "brand-launch": "Marka Lansmanı", "private-party": "Özel Parti",
  cocktail: "Kokteyl", sunset: "Sunset Session", "after-party": "After Party",
};

const GUEST_LABELS: Record<string, string> = {
  family: "Aile odaklı", friends: "Arkadaş odaklı", mixed: "Karma kitlesi",
  corporate: "Kurumsal profesyoneller", creative: "Yaratıcı topluluk",
  young: "Genç kalabalık", multigenerational: "Çok nesilli",
};

const STYLE_LABELS: Record<string, string> = {
  modern: "Modern", traditional: "Geleneksel",
};

const MUSIC_PREF_LABELS: Record<string, string> = {
  local: "Yerli", international: "Yabancı", mixed: "Karışık",
};

type Section = {
  label: string;
  startTime?: string;
  style?: string;
  musicPref?: string;
  conceptIds?: string[];
};

export default async function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: inq }, { data: djList }] = await Promise.all([
    supabase.from("inquiries").select("*").eq("id", id).single(),
    supabase.from("dj_profiles").select("id, name").eq("is_active", true).order("name"),
  ]);

  if (!inq) notFound();

  const sections: Section[] = [
    {
      label: "Karşılama",
      startTime: inq.event_sections?.karsilama?.startTime,
      conceptIds: inq.event_sections?.karsilama?.conceptIds ?? [],
    },
    {
      label: "Ana Kutlama",
      startTime: inq.event_sections?.anaKutlama?.startTime,
      style: inq.event_sections?.anaKutlama?.style,
      conceptIds: inq.event_sections?.anaKutlama?.conceptIds ?? [],
    },
    {
      label: "After Parti",
      musicPref: inq.event_sections?.afterParti?.musicPref,
      conceptIds: inq.event_sections?.afterParti?.conceptIds ?? [],
    },
  ];

  const momentEntries = Object.entries(inq.moment_selections ?? {}) as [string, {
    important: boolean;
    moods?: string[];
    language?: string;
    energy?: string;
    selectedSongs?: string[];
    customSong?: { name: string; spotifyUrl: string; youtubeUrl: string };
  }][];

  const importantMoments = momentEntries.filter(([, v]) => v.important);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Link href="/admin/inquiries" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Talepler
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <h1 className="text-2xl font-semibold text-foreground">
          {inq.contact?.name} {inq.contact?.surname}
        </h1>
        <StatusBadge status={inq.status ?? "new"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Detail */}
        <div className="lg:col-span-2 space-y-6">
          {/* Meta */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Etkinlik", value: EVENT_LABELS[inq.event_type] ?? inq.event_type },
              { label: "Tarih", value: inq.event_date ?? "Belirtilmedi" },
              { label: "Misafir Tipi", value: GUEST_LABELS[inq.guest_type] ?? inq.guest_type ?? "—" },
              { label: "Gönderim", value: new Date(inq.created_at).toLocaleDateString("tr-TR") },
            ].map((item) => (
              <div key={item.label} className="bg-white rounded-2xl border border-border p-4">
                <p className="text-xs text-muted-foreground tracking-wide uppercase">{item.label}</p>
                <p className="text-sm font-medium text-foreground mt-1">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl border border-border p-6">
            <h2 className="font-semibold text-foreground mb-4">İletişim</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Ad Soyad</p>
                <p className="text-foreground mt-0.5">{inq.contact?.name} {inq.contact?.surname}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">E-posta</p>
                <a href={`mailto:${inq.contact?.email}`} className="text-foreground mt-0.5 hover:underline block">
                  {inq.contact?.email}
                </a>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Telefon</p>
                <a href={`tel:${inq.contact?.phone}`} className="text-foreground mt-0.5 hover:underline block">
                  {inq.contact?.phone}
                </a>
              </div>
            </div>
          </div>

          {/* Music journey */}
          <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
            <h2 className="font-semibold text-foreground">Müzik Yolculuğu</h2>
            {sections.map((sec) => (
              <div key={sec.label} className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">{sec.label}</p>
                <div className="bg-secondary/40 rounded-xl px-4 py-3 space-y-1.5 text-sm">
                  {sec.startTime && (
                    <p className="text-foreground">⏰ Başlangıç: <span className="font-medium">{sec.startTime}</span></p>
                  )}
                  {sec.style && (
                    <p className="text-foreground">Stil: <span className="font-medium">{STYLE_LABELS[sec.style] ?? sec.style}</span></p>
                  )}
                  {sec.musicPref && (
                    <p className="text-foreground">Müzik tercihi: <span className="font-medium">{MUSIC_PREF_LABELS[sec.musicPref] ?? sec.musicPref}</span></p>
                  )}
                  {sec.conceptIds && sec.conceptIds.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {sec.conceptIds.map((cid) => (
                        <span key={cid} className="text-xs px-2.5 py-1 bg-white rounded-full border border-border text-foreground">
                          {cid}
                        </span>
                      ))}
                    </div>
                  )}
                  {(!sec.startTime && !sec.style && !sec.musicPref && (!sec.conceptIds || sec.conceptIds.length === 0)) && (
                    <p className="text-muted-foreground text-xs">Belirtilmedi</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Important moments */}
          {importantMoments.length > 0 && (
            <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
              <h2 className="font-semibold text-foreground">Önemli Anlar</h2>
              <div className="space-y-3">
                {importantMoments.map(([momentId, sel]) => (
                  <div key={momentId} className="bg-secondary/40 rounded-xl px-4 py-3 space-y-2">
                    <p className="text-sm font-medium text-foreground capitalize">{momentId.replace(/-/g, " ")}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {sel.moods && sel.moods.length > 0 && sel.moods.map((m) => (
                        <span key={m} className="px-2 py-0.5 bg-white border border-border rounded-full text-foreground">{m}</span>
                      ))}
                      {sel.language && (
                        <span className="px-2 py-0.5 bg-white border border-border rounded-full text-muted-foreground">
                          {MUSIC_PREF_LABELS[sel.language] ?? sel.language}
                        </span>
                      )}
                      {sel.energy && (
                        <span className="px-2 py-0.5 bg-white border border-border rounded-full text-muted-foreground">
                          {sel.energy === "slow" ? "Slow" : sel.energy === "medium" ? "Orta" : "Hareketli"}
                        </span>
                      )}
                    </div>
                    {sel.selectedSongs && sel.selectedSongs.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Önerilen şarkılar: {sel.selectedSongs.join(", ")}
                      </p>
                    )}
                    {sel.customSong?.name && (
                      <p className="text-xs text-foreground font-medium">
                        🎵 Özel şarkı: {sel.customSong.name}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {inq.services?.length > 0 && (
            <div className="bg-white rounded-2xl border border-border p-6">
              <h2 className="font-semibold text-foreground mb-3">İstenen Hizmetler</h2>
              <div className="flex flex-wrap gap-2">
                {(inq.services as string[]).map((s) => (
                  <span key={s} className="text-xs px-3 py-1.5 bg-secondary rounded-full text-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Actions sidebar */}
        <div className="space-y-4">
          <InquiryActions
            inquiryId={id}
            currentStatus={inq.status ?? "new"}
            currentNotes={inq.admin_notes ?? null}
            djs={djList ?? []}
            assignedDjId={inq.assigned_dj_id ?? null}
          />
        </div>
      </div>
    </div>
  );
}
