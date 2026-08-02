// Spotify Client Credentials — server taraflı token cache + arama/sanatçı çekme.
// eventmatch/functions/src/spotify-proxy.ts ile AYNI akış (client_credentials,
// Basic auth ile token, sonra Bearer ile arama) — yalnız kimlik bilgisi
// taşıyıcısı farklı: burada Vercel env (process.env), orada Firebase
// defineSecret. SPOTIFY_CLIENT_ID/SPOTIFY_CLIENT_SECRET aynı Spotify
// uygulamasının kimlik bilgileridir, iki taşıyıcıda da aynı değer.
//
// Token modül düzeyinde önbelleklenir — Vercel'in sıcak (warm) fonksiyon
// çağrılarında tekrar token istenmesini önler; soğuk başlangıçta yeniden
// alınır (zararsız, yalnız bir ekstra RTT).

let cachedToken: string | undefined;
let tokenExpiresAt = 0;

export interface SpotifyArtistSummary {
  id: string;
  name: string;
  imageUrl: string | null;
  genres: string[];
  popularity: number;
  followers: number;
  url: string;
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt) return cachedToken;

  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) {
    throw new Error("Spotify kimlik bilgileri eksik (SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET).");
  }

  const basic = Buffer.from(`${id}:${secret}`).toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Spotify token isteği başarısız: HTTP ${res.status}`);

  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("Spotify token yanıtında access_token yok.");

  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + Math.max(60, Number(data.expires_in ?? 3600) - 60) * 1000;
  return cachedToken;
}

// Spotify'ın search/artists endpoint'lerinin döndürdüğü "full artist object"
// biçimi — her ikisi de aynı şekli paylaşır (images/genres/popularity/followers).
interface RawSpotifyArtist {
  id?: string;
  name?: string;
  images?: { url?: string }[];
  genres?: string[];
  popularity?: number;
  followers?: { total?: number };
  external_urls?: { spotify?: string };
}

function parseArtist(raw: RawSpotifyArtist): SpotifyArtistSummary {
  const images = Array.isArray(raw.images) ? raw.images : [];
  const id = typeof raw.id === "string" ? raw.id : "";
  return {
    id,
    name: typeof raw.name === "string" ? raw.name : "",
    imageUrl: typeof images[0]?.url === "string" ? images[0].url : null,
    genres: Array.isArray(raw.genres) ? raw.genres.filter((g): g is string => typeof g === "string") : [],
    popularity: typeof raw.popularity === "number" ? raw.popularity : 0,
    followers: typeof raw.followers?.total === "number" ? raw.followers.total : 0,
    url: typeof raw.external_urls?.spotify === "string" ? raw.external_urls.spotify : `https://open.spotify.com/artist/${id}`,
  };
}

export async function searchSpotifyArtists(query: string, limit = 8): Promise<SpotifyArtistSummary[]> {
  const token = await getAccessToken();
  const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=${limit}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Spotify arama başarısız: HTTP ${res.status}`);
  const data = await res.json();
  const items = Array.isArray(data?.artists?.items) ? data.artists.items : [];
  return items.map(parseArtist).filter((a: SpotifyArtistSummary) => a.id && a.name);
}

const SPOTIFY_ID_RE = /^[A-Za-z0-9]{10,32}$/;

export async function getSpotifyArtist(spotifyArtistId: string): Promise<SpotifyArtistSummary | null> {
  if (!SPOTIFY_ID_RE.test(spotifyArtistId)) return null;
  const token = await getAccessToken();
  const res = await fetch(`https://api.spotify.com/v1/artists/${spotifyArtistId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const parsed = parseArtist(data);
  return parsed.id ? parsed : null;
}
