import Link from "next/link";
import Image from "next/image";
import { createServiceClient } from "@/lib/supabase";
import DeleteDjButton from "./DeleteDjButton";

const PERFORMER_TYPES = [
  { id: "all", label: "Tümü", emoji: "✨" },
  { id: "dj", label: "DJ", emoji: "🎧" },
  { id: "artist", label: "Solo Sanatçı", emoji: "🎤" },
  { id: "trio", label: "Trio", emoji: "🎶" },
  { id: "grup", label: "Grup", emoji: "👥" },
  { id: "dance", label: "Dans Ekibi", emoji: "💃" },
  { id: "bando", label: "Bando", emoji: "🎺" },
  { id: "orkestra", label: "Orkestra", emoji: "🎻" },
  { id: "host", label: "Sunucu / MC", emoji: "🎙️" },
  { id: "moderator", label: "Moderatör", emoji: "🗣️" },
];

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  approved: { label: "Onaylandı", cls: "bg-green-100 text-green-700" },
  pending: { label: "Bekliyor", cls: "bg-yellow-100 text-yellow-700" },
  rejected: { label: "Reddedildi", cls: "bg-red-100 text-red-700" },
};

type Props = { searchParams: Promise<{ type?: string }> };

export default async function DjlerPage({ searchParams }: Props) {
  const { type } = await searchParams;
  const activeType = type && type !== "all" ? type : null;

  const supabase = createServiceClient();
  let query = supabase.from("dj_profiles").select("*").order("created_at", { ascending: false });
  if (activeType) query = query.eq("performer_type", activeType);

  const { data: djs, error } = await query;

  const pendingCount = djs?.filter((d) => d.application_status === "pending").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Sanatçılar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            DJ&apos;ler, solo sanatçılar ve ekipleri yönet
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                {pendingCount} bekleyen başvuru
              </span>
            )}
          </p>
        </div>
        <Link
          href="/admin/djler/new"
          className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Yeni Sanatçı
        </Link>
      </div>

      {/* Type filter tabs */}
      <div className="flex flex-wrap gap-2">
        {PERFORMER_TYPES.map((pt) => {
          const isActive = (pt.id === "all" && !activeType) || pt.id === activeType;
          return (
            <Link
              key={pt.id}
              href={`/admin/djler${pt.id !== "all" ? `?type=${pt.id}` : ""}`}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive
                  ? "bg-foreground text-background"
                  : "bg-white border border-border text-foreground hover:bg-secondary"
              }`}
            >
              <span>{pt.emoji}</span>
              {pt.label}
            </Link>
          );
        })}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error.message}
        </div>
      )}

      {!djs?.length && !error && (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <p className="text-4xl mb-4">🎧</p>
          <p className="text-foreground font-medium">Henüz sanatçı eklenmedi</p>
          <Link
            href="/admin/djler/new"
            className="mt-4 inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            İlk Sanatçıyı Ekle
          </Link>
        </div>
      )}

      {djs && djs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {djs.map((dj) => {
            const typeInfo = PERFORMER_TYPES.find((pt) => pt.id === (dj.performer_type ?? "dj"));
            const statusInfo = STATUS_LABELS[dj.application_status ?? "approved"];
            return (
              <div key={dj.id} className="bg-white rounded-2xl border border-border overflow-hidden">
                {/* Photo */}
                <div className="relative h-48 bg-secondary/30">
                  {dj.photo_url ? (
                    <Image src={dj.photo_url} alt={dj.name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">
                      {typeInfo?.emoji ?? "🎧"}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                      dj.is_active ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"
                    }`}>
                      {dj.is_active ? "Aktif" : "Pasif"}
                    </span>
                    {dj.application_status && dj.application_status !== "approved" && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusInfo?.cls}`}>
                        {statusInfo?.label}
                      </span>
                    )}
                  </div>
                  {typeInfo && (
                    <span className="absolute bottom-3 left-3 text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/60 text-white">
                      {typeInfo.emoji} {typeInfo.label}
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{dj.name}</h3>
                    {dj.city && <p className="text-xs text-muted-foreground">📍 {dj.city}</p>}
                    {dj.speciality && <p className="text-xs text-muted-foreground">{dj.speciality}</p>}
                  </div>

                  {dj.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{dj.bio}</p>
                  )}

                  {dj.concept_tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {dj.concept_tags.map((tag: string) => (
                        <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Links */}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {dj.soundcloud_url && (
                      <a href={dj.soundcloud_url} target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">SoundCloud</a>
                    )}
                    {dj.mixcloud_url && (
                      <a href={dj.mixcloud_url} target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Mixcloud</a>
                    )}
                    {dj.youtube_url && (
                      <a href={dj.youtube_url} target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">YouTube</a>
                    )}
                    {dj.instagram_url && (
                      <a href={dj.instagram_url} target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Instagram</a>
                    )}
                    {dj.spotify_url && (
                      <a href={dj.spotify_url} target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Spotify</a>
                    )}
                    {dj.website_url && (
                      <a href={dj.website_url} target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">Website</a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-border">
                    <Link
                      href={`/admin/djler/${dj.id}/edit`}
                      className="flex-1 text-center py-2 rounded-xl text-xs font-medium border border-border hover:bg-secondary transition-colors"
                    >
                      Düzenle
                    </Link>
                    <Link
                      href={`/admin/djler/${dj.id}/presskit`}
                      className="flex-1 text-center py-2 rounded-xl text-xs font-medium border border-border hover:bg-secondary transition-colors"
                    >
                      Presskit
                    </Link>
                    <DeleteDjButton id={dj.id} name={dj.name} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
