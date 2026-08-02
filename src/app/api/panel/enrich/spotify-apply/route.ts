import { NextRequest, NextResponse } from "next/server";
import { requireEntityEditAccess, UUID_RE } from "@/lib/panel/enrichAuth";
import { rateLimit, getClientIp } from "@/lib/rateLimit";
import { createServiceClient } from "@/lib/supabase";
import { getSpotifyArtist } from "@/lib/panel/spotify";

export const runtime = "nodejs";

const SPOTIFY_ID_RE = /^[A-Za-z0-9]{10,32}$/;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { ok: withinLimit } = rateLimit(ip, "panel-enrich-spotify-apply", { max: 20, windowMs: 60_000 });
  if (!withinLimit) {
    return NextResponse.json({ error: "Çok fazla istek. Lütfen bekleyin." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const entityId = String((body as Record<string, unknown>).entityId ?? "").trim();
  const spotifyArtistId = String((body as Record<string, unknown>).spotifyArtistId ?? "").trim();

  if (!entityId || !UUID_RE.test(entityId)) {
    return NextResponse.json({ error: "Geçersiz entityId." }, { status: 400 });
  }
  if (!spotifyArtistId || !SPOTIFY_ID_RE.test(spotifyArtistId)) {
    return NextResponse.json({ error: "Geçersiz spotifyArtistId." }, { status: 400 });
  }

  const auth = await requireEntityEditAccess(entityId);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const artist = await getSpotifyArtist(spotifyArtistId).catch((error) => {
    console.error("Panel Spotify sanatçı çekme hatası:", error);
    return null;
  });
  if (!artist) return NextResponse.json({ error: "Spotify sanatçısı bulunamadı." }, { status: 502 });

  const supabase = createServiceClient();
  const { data: current, error: fetchError } = await supabase
    .from("artist_profiles")
    .select("photo_url, genres, links")
    .eq("entity_id", entityId)
    .maybeSingle();
  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 });
  if (!current) return NextResponse.json({ error: "Sanatçı bulunamadı." }, { status: 404 });

  const existingGenres: string[] = Array.isArray(current.genres) ? current.genres : [];
  const mergedGenres = Array.from(new Set([...existingGenres, ...artist.genres]));
  const links = { ...(current.links as Record<string, string> | null ?? {}) };
  links.spotify = artist.url;

  const update: Record<string, unknown> = {
    genres: mergedGenres,
    links,
    spotify_artist_id: artist.id,
    spotify_popularity: artist.popularity,
    spotify_followers: artist.followers,
    enriched_at: new Date().toISOString(),
  };
  // Kurucunun elle koyduğu kapağı EZME — yalnız hâlâ boşsa Spotify görseliyle doldur.
  if (!current.photo_url && artist.imageUrl) {
    update.photo_url = artist.imageUrl;
  }

  const { error: updateError } = await supabase.from("artist_profiles").update(update).eq("entity_id", entityId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true, artist });
}
