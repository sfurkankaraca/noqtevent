import Link from "next/link";
import Image from "next/image";
import { createServiceClient } from "@/lib/supabase";
import DeleteDjButton from "./DeleteDjButton";

export default async function DjlerPage() {
  const supabase = createServiceClient();
  const { data: djs, error } = await supabase
    .from("dj_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">DJ&apos;ler</h1>
          <p className="text-sm text-muted-foreground mt-1">
            DJ profillerini yönet
          </p>
        </div>
        <Link
          href="/admin/djler/new"
          className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Yeni DJ
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error.message}
        </div>
      )}

      {!djs?.length && !error && (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <p className="text-4xl mb-4">🎧</p>
          <p className="text-foreground font-medium">Henüz DJ eklenmedi</p>
          <Link
            href="/admin/djler/new"
            className="mt-4 inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            İlk DJ&apos;i Ekle
          </Link>
        </div>
      )}

      {djs && djs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {djs.map((dj) => (
            <div key={dj.id} className="bg-white rounded-2xl border border-border overflow-hidden">
              {/* Photo */}
              <div className="relative h-48 bg-secondary/30">
                {dj.photo_url ? (
                  <Image src={dj.photo_url} alt={dj.name} fill className="object-cover" unoptimized />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">🎧</div>
                )}
                {/* Active badge */}
                <span className={`absolute top-3 right-3 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  dj.is_active
                    ? "bg-green-100 text-green-700"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {dj.is_active ? "Aktif" : "Pasif"}
                </span>
              </div>

              <div className="p-4 space-y-3">
                <h3 className="font-semibold text-foreground">{dj.name}</h3>

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
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {dj.soundcloud_url && (
                    <a href={dj.soundcloud_url} target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
                      SoundCloud
                    </a>
                  )}
                  {dj.mixcloud_url && (
                    <a href={dj.mixcloud_url} target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
                      Mixcloud
                    </a>
                  )}
                  {dj.youtube_url && (
                    <a href={dj.youtube_url} target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">
                      YouTube
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-border">
                  <Link
                    href={`/admin/djler/${dj.id}/edit`}
                    className="flex-1 text-center py-2 rounded-xl text-xs font-medium border border-border hover:bg-secondary transition-colors"
                  >
                    Düzenle
                  </Link>
                  <DeleteDjButton id={dj.id} name={dj.name} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
