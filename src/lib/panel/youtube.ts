// YouTube Data API v3 — kanal arama + tekil kanal çekme. Basit API key ile
// çalışır (Spotify'ın aksine OAuth/client-credentials gerekmez — search.list
// ve channels.list "public data" uç noktaları). eventmatch'te bu API'ye
// bağlanan mevcut bir servis yok (araştırıldı: yalnız Spotify entegrasyonu
// var) — bu yüzden YOUTUBE_API_KEY panel için YENİ bir env değişkeni.
//
// search.list kanal ARAMASI subscriberCount döndürmez (yalnız snippet) —
// bu yüzden iki adımlı akış: önce search.list ile channelId'ler bulunur,
// sonra TEK channels.list çağrısıyla (id listesi, virgülle) istatistikler
// toplu çekilir. search.list kotası (100 birim) channels.list'e (1 birim)
// göre çok daha pahalıdır; bu akış aramayı tek search.list çağrısına
// sığdırır, ekstra maliyet yalnız ucuz channels.list çağrısıdır.

export interface YoutubeChannelSummary {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  subscriberCount: number | null;
  url: string;
}

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YouTube kimlik bilgisi eksik (YOUTUBE_API_KEY).");
  return key;
}

interface RawYoutubeChannel {
  id?: string;
  snippet?: { title?: string; thumbnails?: { default?: { url?: string } } };
  statistics?: { subscriberCount?: string; hiddenSubscriberCount?: boolean };
}

function parseChannel(raw: RawYoutubeChannel): YoutubeChannelSummary | null {
  const id = typeof raw.id === "string" ? raw.id : "";
  if (!id) return null;
  const hidden = raw.statistics?.hiddenSubscriberCount === true;
  const subs = Number(raw.statistics?.subscriberCount);
  return {
    id,
    title: typeof raw.snippet?.title === "string" ? raw.snippet.title : "",
    thumbnailUrl: typeof raw.snippet?.thumbnails?.default?.url === "string" ? raw.snippet.thumbnails.default.url : null,
    subscriberCount: hidden || !Number.isFinite(subs) ? null : subs,
    url: `https://www.youtube.com/channel/${id}`,
  };
}

async function fetchChannelStats(channelIds: string[]): Promise<YoutubeChannelSummary[]> {
  if (channelIds.length === 0) return [];
  const apiKey = getApiKey();
  const url = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds.join(",")}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube kanal bilgisi alınamadı: HTTP ${res.status}`);
  const data = await res.json();
  const items = Array.isArray(data?.items) ? data.items : [];
  return items.map(parseChannel).filter((c: YoutubeChannelSummary | null): c is YoutubeChannelSummary => c !== null && !!c.title);
}

export async function searchYoutubeChannels(query: string, limit = 8): Promise<YoutubeChannelSummary[]> {
  const apiKey = getApiKey();
  const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=${limit}&q=${encodeURIComponent(query)}&key=${apiKey}`;
  const res = await fetch(searchUrl);
  if (!res.ok) throw new Error(`YouTube arama başarısız: HTTP ${res.status}`);
  const data = await res.json();
  const items = Array.isArray(data?.items) ? data.items : [];
  const channelIds: string[] = items
    .map((it: { snippet?: { channelId?: string }; id?: { channelId?: string } }) => it?.snippet?.channelId ?? it?.id?.channelId)
    .filter((id: unknown): id is string => typeof id === "string");
  // search.list sıralamasını korumak için channels.list sonucunu yeniden diz.
  const stats = await fetchChannelStats(Array.from(new Set(channelIds)));
  const byId = new Map(stats.map((c) => [c.id, c]));
  return channelIds.map((id) => byId.get(id)).filter((c): c is YoutubeChannelSummary => !!c);
}

const YOUTUBE_CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{22}$/;

export async function getYoutubeChannel(channelId: string): Promise<YoutubeChannelSummary | null> {
  if (!YOUTUBE_CHANNEL_ID_RE.test(channelId)) return null;
  const stats = await fetchChannelStats([channelId]);
  return stats[0] ?? null;
}

// ── "Kanaldan video getir" (panel: bağlı bir sanatçı için son yüklenen
// videoları listeler) — search.list KULLANMAZ (100 birim kota, arama başına).
// Bunun yerine ucuz üçlü: channels.list(1 birim, uploads playlist id'si için)
// + playlistItems.list(1 birim, video listesi) + videos.list(1 birim,
// izlenme sayısı) = toplam 3 birim, search.list'in 1/33'ü.

export interface YoutubeVideoSummary {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  viewCount: number | null;
  publishedAt: string | null;
  url: string;
}

async function getUploadsPlaylistId(channelId: string): Promise<string | null> {
  const apiKey = getApiKey();
  const url = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube kanal detayı alınamadı: HTTP ${res.status}`);
  const data = await res.json();
  const items = Array.isArray(data?.items) ? data.items : [];
  const uploads = items[0]?.contentDetails?.relatedPlaylists?.uploads;
  return typeof uploads === "string" ? uploads : null;
}

interface RawPlaylistItem {
  snippet?: {
    title?: string;
    publishedAt?: string;
    thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
    resourceId?: { videoId?: string };
  };
}

async function fetchVideoViewCounts(videoIds: string[]): Promise<Map<string, number | null>> {
  const map = new Map<string, number | null>();
  if (videoIds.length === 0) return map;
  const apiKey = getApiKey();
  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds.join(",")}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`YouTube video istatistiği alınamadı: HTTP ${res.status}`);
  const data = await res.json();
  const items = Array.isArray(data?.items) ? data.items : [];
  for (const it of items) {
    const id = typeof it?.id === "string" ? it.id : "";
    if (!id) continue;
    const views = Number(it?.statistics?.viewCount);
    map.set(id, Number.isFinite(views) ? views : null);
  }
  return map;
}

export async function getChannelVideos(channelId: string, limit = 12): Promise<YoutubeVideoSummary[]> {
  if (!YOUTUBE_CHANNEL_ID_RE.test(channelId)) return [];
  const uploadsPlaylistId = await getUploadsPlaylistId(channelId);
  if (!uploadsPlaylistId) return [];

  const apiKey = getApiKey();
  const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${limit}&playlistId=${uploadsPlaylistId}&key=${apiKey}`;
  const res = await fetch(playlistUrl);
  if (!res.ok) throw new Error(`YouTube video listesi alınamadı: HTTP ${res.status}`);
  const data = await res.json();
  const items: RawPlaylistItem[] = Array.isArray(data?.items) ? data.items : [];

  const videoIds = items
    .map((it) => it.snippet?.resourceId?.videoId)
    .filter((id): id is string => typeof id === "string");
  const viewsById = await fetchVideoViewCounts(videoIds);

  return items
    .map((it) => {
      const id = it.snippet?.resourceId?.videoId;
      if (typeof id !== "string") return null;
      return {
        id,
        title: typeof it.snippet?.title === "string" ? it.snippet.title : "",
        thumbnailUrl: it.snippet?.thumbnails?.medium?.url ?? it.snippet?.thumbnails?.default?.url ?? null,
        viewCount: viewsById.get(id) ?? null,
        publishedAt: typeof it.snippet?.publishedAt === "string" ? it.snippet.publishedAt : null,
        url: `https://www.youtube.com/watch?v=${id}`,
      };
    })
    .filter((v): v is YoutubeVideoSummary => v !== null && !!v.title);
}
