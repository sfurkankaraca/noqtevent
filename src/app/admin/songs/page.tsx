import { createServiceClient } from "@/lib/supabase";
import Link from "next/link";
import { deleteSong } from "./actions";

const MOMENT_LABELS: Record<string, string> = {
  "ilk-dans": "İlk Dans",
  "pasta-kesimi": "Pasta Kesimi",
  "cicek-atma": "Çiçek Atma",
  "salon-giris": "Salon Girişi",
  "kina-yakma": "Kına Yakma",
  "roman-havalari": "Roman Havaları",
  "halaylar-kina": "Halaylar",
  "pasta-party": "Pasta (Parti)",
};

const LANG_LABELS: Record<string, string> = {
  tr: "Yerli",
  en: "Yabancı",
  other: "Diğer",
};

const ENERGY_LABELS: Record<string, string> = {
  slow: "Slow",
  medium: "Orta",
  energetic: "Hareketli",
};

export default async function SongsPage() {
  const supabase = createServiceClient();
  const { data: songs, error } = await supabase
    .from("songs")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Şarkılar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {songs?.length ?? 0} şarkı
          </p>
        </div>
        <Link
          href="/admin/songs/new"
          className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Yeni Ekle
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          Supabase bağlantı hatası: {error.message}
        </div>
      )}

      {!songs?.length && !error && (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <p className="text-4xl mb-4">♪</p>
          <p className="text-foreground font-medium">Henüz şarkı yok</p>
          <p className="text-sm text-muted-foreground mt-1">İlk şarkını ekle</p>
          <Link
            href="/admin/songs/new"
            className="inline-flex mt-4 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
          >
            + Şarkı Ekle
          </Link>
        </div>
      )}

      {songs && songs.length > 0 && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground tracking-wide">ŞARKI</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">AN</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">DİL</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">ENERJİ</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">ÖNZ.</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {songs.map((song) => (
                <tr key={song.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-foreground">{song.title}</p>
                    <p className="text-xs text-muted-foreground">{song.artist}</p>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground text-xs">
                    {MOMENT_LABELS[song.event_moment] ?? song.event_moment}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-foreground">
                      {LANG_LABELS[song.language] ?? song.language}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-foreground">
                      {ENERGY_LABELS[song.energy] ?? song.energy}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    {song.spotify_url ? (
                      <span className="text-green-600 text-xs font-medium">Spotify ✓</span>
                    ) : song.audio_file_url ? (
                      <span className="text-blue-600 text-xs font-medium">Ses ✓</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/admin/songs/${song.id}/edit`}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Düzenle
                      </Link>
                      <form action={deleteSound}>
                        <input type="hidden" name="id" value={song.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          Sil
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// inline alias for the form action
const deleteSound = deleteSong;
