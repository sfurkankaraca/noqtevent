"use client";

import { useState } from "react";
import Link from "next/link";

type Song = {
  id?: string;
  title?: string;
  artist?: string;
  event_moment?: string;
  category?: string;
  language?: string;
  energy?: string;
  mood_tags?: string[];
  spotify_url?: string;
  youtube_url?: string;
  audio_file_url?: string;
};

const MOMENTS = [
  { id: "ilk-dans", label: "İlk Dans", category: "FIRST_DANCE" },
  { id: "pasta-kesimi", label: "Pasta Kesimi", category: "CAKE_CUTTING" },
  { id: "cicek-atma", label: "Çiçek Atma", category: "BOUQUET_TOSS" },
  { id: "salon-giris", label: "Salon Girişi", category: "ENTRANCE" },
  { id: "kina-yakma", label: "Kına Yakma", category: "HENNA_CEREMONY" },
  { id: "kina-girisi", label: "Kına Girişi", category: "HENNA_CEREMONY" },
  { id: "roman-havalari", label: "Roman Havaları", category: "ROMAN_MUSIC" },
  { id: "halaylar-kina", label: "Halaylar", category: "HALAY" },
  { id: "oyun-havalari-kina", label: "Oyun Havaları", category: "FOLK_DANCE" },
  { id: "pasta-party", label: "Pasta (Parti)", category: "BIRTHDAY_CAKE" },
];

const MOODS = [
  "Romantik", "Duygusal", "Eğlenceli", "Coşkulu",
  "Güçlü", "Modern", "Zamansız", "Epik", "Samimi", "Geleneksel",
];

function extractSpotifyId(url: string): string | null {
  const match = url.match(/track\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

export default function SongForm({
  action,
  song,
}: {
  action: (formData: FormData) => Promise<void>;
  song?: Song;
}) {
  const [spotifyUrl, setSpotifyUrl] = useState(song?.spotify_url ?? "");
  const [audioPreview, setAudioPreview] = useState<string | null>(song?.audio_file_url ?? null);
  const [selectedMoment, setSelectedMoment] = useState(song?.event_moment ?? "");
  const [selectedMoods, setSelectedMoods] = useState<string[]>(song?.mood_tags ?? []);
  const [pending, setPending] = useState(false);

  const spotifyId = extractSpotifyId(spotifyUrl);

  const autoCategory = MOMENTS.find((m) => m.id === selectedMoment)?.category ?? "";

  const toggleMood = (mood: string) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAudioPreview(URL.createObjectURL(file));
  };

  return (
    <form
      action={async (fd) => {
        setPending(true);
        fd.set("mood_tags", selectedMoods.join(","));
        await action(fd);
        setPending(false);
      }}
      className="space-y-6"
    >
      {song?.id && <input type="hidden" name="id" value={song.id} />}
      <input type="hidden" name="category" value={autoCategory} />
      <input type="hidden" name="mood_tags" value={selectedMoods.join(",")} />

      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <h2 className="font-medium text-foreground">Temel Bilgiler</h2>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Şarkı Adı" name="title" defaultValue={song?.title} required />
          <Field label="Sanatçı" name="artist" defaultValue={song?.artist} required />
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">
            Önemli An
          </label>
          <select
            name="event_moment"
            value={selectedMoment}
            onChange={(e) => setSelectedMoment(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40"
          >
            <option value="">Seç…</option>
            {MOMENTS.map((m) => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">
              Dil
            </label>
            <select
              name="language"
              defaultValue={song?.language ?? "tr"}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40"
            >
              <option value="tr">Yerli (TR)</option>
              <option value="en">Yabancı (EN)</option>
              <option value="other">Diğer</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">
              Enerji
            </label>
            <select
              name="energy"
              defaultValue={song?.energy ?? "slow"}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40"
            >
              <option value="slow">Slow</option>
              <option value="medium">Orta Tempo</option>
              <option value="energetic">Hareketli</option>
            </select>
          </div>
        </div>

        {/* Mood tags */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">
            Ruh Hali Etiketleri
          </label>
          <div className="flex flex-wrap gap-2">
            {MOODS.map((mood) => (
              <button
                key={mood}
                type="button"
                onClick={() => toggleMood(mood)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                  selectedMoods.includes(mood)
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-foreground hover:border-foreground/40"
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Audio / Spotify */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <h2 className="font-medium text-foreground">Ses & Önizleme</h2>

        {/* Spotify */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">
            Spotify URL
          </label>
          <input
            type="url"
            name="spotify_url"
            value={spotifyUrl}
            onChange={(e) => setSpotifyUrl(e.target.value)}
            placeholder="https://open.spotify.com/track/..."
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40"
          />
          {spotifyId && (
            <div className="mt-3 rounded-xl overflow-hidden">
              <iframe
                src={`https://open.spotify.com/embed/track/${spotifyId}?utm_source=generator&theme=0`}
                width="100%"
                height="80"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </div>
          )}
        </div>

        {/* YouTube */}
        <Field
          label="YouTube URL"
          name="youtube_url"
          defaultValue={song?.youtube_url}
          placeholder="https://www.youtube.com/watch?v=..."
          type="url"
        />

        {/* Audio file upload */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">
            Ses Dosyası (MP3 / WAV)
          </label>
          <input
            type="file"
            name="audio_file"
            accept="audio/*"
            onChange={handleFileChange}
            className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-foreground file:text-background hover:file:opacity-80 cursor-pointer"
          />
          {audioPreview && (
            <audio controls src={audioPreview} className="mt-3 w-full h-10" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 bg-foreground text-background px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {pending ? "Kaydediliyor…" : song?.id ? "Güncelle" : "Kaydet"}
        </button>
        <Link
          href="/admin/songs"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          İptal
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2">
        {label}
      </label>
      <input
        type={type}
        name={name}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors"
      />
    </div>
  );
}
