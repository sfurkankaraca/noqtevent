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
