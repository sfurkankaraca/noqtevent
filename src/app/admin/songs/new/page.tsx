import { upsertSong } from "../actions";
import SongForm from "../SongForm";

export default function NewSongPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Yeni Şarkı</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Şarkı bilgilerini gir ve ses dosyası yükle veya Spotify URL ekle.
        </p>
      </div>
      <SongForm action={upsertSong} />
    </div>
  );
}
