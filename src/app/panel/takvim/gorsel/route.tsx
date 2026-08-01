import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import { getArtistDisplayNames, getConfirmedEventsForEntityInRange, getEntityImageProfile, isEntityMember } from "@/lib/panel/queries";
import { slugify } from "@/lib/panel/slug";
import { loadImageFonts } from "@/lib/panel/gorsel/fonts";
import { SIZES, getPalette, defaultGradient, fullScrimGradient, resolveGorselOptions } from "@/lib/panel/gorsel/theme";
import { dayNumberFmt, getPeriodRange, timeFmt, weekdayShortFmt, type Period } from "@/lib/panel/gorsel/period";

// Haftalık/aylık takvim paylaşım görseli — tek etkinlik görseliyle
// (src/app/panel/etkinlik/[id]/gorsel) AYNI görsel dili kullanır (kurucu
// talebi, "KAPSAM EKLEMESİ"): mekan/sanatçının o dönemki ONAYLI (confirmed)
// etkinliklerini tek bir story/post görselinde toplar. Lansım öncesi davet
// mesajlarına eklenebilecek bir kurucu aracı olarak da kullanılıyor (admin,
// entity üyesi olmadan da üretebilir — bkz. yetki kontrolü aşağıda).
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const entityId = url.searchParams.get("entityId");
  const period: Period = url.searchParams.get("period") === "month" ? "month" : "week";
  const options = resolveGorselOptions(url.searchParams);
  const { width, height } = SIZES[options.format];

  if (!entityId) {
    return new Response("entityId zorunludur.", { status: 400 });
  }

  const user = await getPanelUser();
  if (!user) {
    return new Response("Bu görsele erişmek için panel oturumu gerekli.", { status: 401 });
  }

  const admin = await isPanelAdmin();
  if (!admin) {
    const member = await isEntityMember(user.id, entityId);
    if (!member) {
      return new Response("Bu profilin takvim görselini oluşturma yetkiniz yok.", { status: 403 });
    }
  }

  const profile = await getEntityImageProfile(entityId);
  if (!profile) {
    return new Response("Profil bulunamadı.", { status: 404 });
  }

  const range = getPeriodRange(period);
  const events = await getConfirmedEventsForEntityInRange(entityId, range.startIso, range.endIso);

  // Boş dönemde görsel üretilmiyor (görev talimatı) — panel tarafı da aynı
  // sorguyla önceden sayıp indirme linklerini devre dışı bırakıyor
  // (bkz. src/app/panel/ImageOptionsControls.tsx), bu 422 yalnız savunma amaçlı.
  if (events.length === 0) {
    return new Response("Bu dönemde onaylı etkinlik yok — görsel üretilmedi.", { status: 422 });
  }

  const artistEntityIds = events
    .flatMap((e) => e.artist_entity_ids)
    .filter((aid) => aid && aid !== entityId);
  const [fonts, artistNames] = await Promise.all([loadImageFonts(), getArtistDisplayNames(artistEntityIds)]);

  const palette = getPalette(options.theme, options.accent);
  const photoUrl = options.showPhoto ? profile.photoUrl : null;
  const handle = options.showHandle ? normalizeHandle(profile.instagramHandle) : null;

  const format = options.format;
  const BASE_MAX = format === "story" ? 10 : 7;
  const SHRINK_MAX = format === "story" ? 16 : 11;

  let rows = events;
  let overflowCount = 0;
  let rowFontSize = format === "story" ? 32 : 27;
  let rowGap = format === "story" ? 20 : 14;

  if (events.length > BASE_MAX) {
    rowFontSize = format === "story" ? 25 : 21;
    rowGap = format === "story" ? 12 : 9;
    if (events.length > SHRINK_MAX) {
      rows = events.slice(0, SHRINK_MAX - 1);
      overflowCount = events.length - rows.length;
    }
  }

  const pad = format === "story" ? "76px 60px 64px" : "56px 52px 48px";

  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: palette.bg,
          fontFamily: "Inter",
        }}
      >
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} width={width} height={height} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", backgroundImage: defaultGradient(palette) }} />
          )}
        </div>

        <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: fullScrimGradient(palette) }} />

        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: pad }}>
          {/* Başlık bloğu */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                alignSelf: "flex-start",
                backgroundColor: palette.pillBg,
                borderRadius: 999,
                padding: "12px 26px",
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: 2,
                color: palette.accent,
                marginBottom: 20,
              }}
            >
              {profile.displayName.toLocaleUpperCase("tr-TR")}
            </div>
            <div style={{ display: "flex", width: 64, height: 5, backgroundColor: palette.accent, borderRadius: 3, marginBottom: 20 }} />
            <div
              style={{
                display: "flex",
                color: palette.ink,
                fontSize: format === "story" ? 66 : 50,
                fontWeight: 700,
                letterSpacing: -1.5,
                lineHeight: 1.05,
              }}
            >
              {range.title}
            </div>
          </div>

          {/* Etkinlik listesi */}
          <div style={{ display: "flex", flexDirection: "column", gap: rowGap, marginTop: format === "story" ? 44 : 32, flex: 1 }}>
            {rows.map((ev) => {
              const start = new Date(ev.start_at);
              const dayAbbrev = Number.isNaN(start.getTime()) ? "" : weekdayShortFmt.format(start).toLocaleUpperCase("tr-TR");
              const dayNum = Number.isNaN(start.getTime()) ? "" : dayNumberFmt.format(start);
              const time = Number.isNaN(start.getTime()) ? "" : timeFmt.format(start);
              const otherArtistId = ev.artist_entity_ids.find((aid) => aid !== entityId);
              const artistName = otherArtistId ? artistNames.get(otherArtistId) : null;

              return (
                <div
                  key={ev.id}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 20,
                    paddingBottom: rowGap,
                    borderBottom: `1px solid ${palette.cardBorder}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      width: format === "story" ? 76 : 64,
                      height: format === "story" ? 76 : 64,
                      borderRadius: 16,
                      backgroundColor: `rgba(${palette.scrimRgb}, 0.35)`,
                      border: `1px solid ${palette.accent}`,
                      flexShrink: 0,
                    }}
                  >
                    <div style={{ display: "flex", color: palette.accent, fontSize: rowFontSize * 0.42, fontWeight: 700, letterSpacing: 1 }}>
                      {dayAbbrev}
                    </div>
                    <div style={{ display: "flex", color: palette.ink, fontSize: rowFontSize * 0.62, fontWeight: 700 }}>{dayNum}</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", color: palette.ink, fontSize: rowFontSize, fontWeight: 600, lineHeight: 1.15 }}>
                      {ev.title}
                    </div>
                    {artistName ? (
                      <div style={{ display: "flex", color: palette.inkTertiary, fontSize: rowFontSize * 0.62, fontWeight: 500, marginTop: 2 }}>
                        {artistName}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ display: "flex", color: palette.inkSecondary, fontSize: rowFontSize * 0.78, fontWeight: 600, flexShrink: 0 }}>
                    {time}
                  </div>
                </div>
              );
            })}

            {overflowCount > 0 ? (
              <div style={{ display: "flex", color: palette.accent, fontSize: rowFontSize * 0.82, fontWeight: 600, marginTop: 4 }}>
                +{overflowCount} etkinlik daha — noqt&apos;ta
              </div>
            ) : null}
          </div>

          {/* Marka */}
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 32,
              paddingTop: 26,
              borderTop: `1px solid ${palette.cardBorder}`,
            }}
          >
            <div style={{ display: "flex", color: palette.ink, fontSize: 38, fontWeight: 700, letterSpacing: -1 }}>noqt</div>
            <div style={{ display: "flex", color: palette.inkTertiary, fontSize: 21, fontWeight: 400 }}>{handle ?? "noqt.events"}</div>
          </div>
        </div>
      </div>
    ),
    { width, height, fonts }
  );

  const filename = `noqt-${slugify(profile.displayName)}-${period}-${format}.png`;
  image.headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  image.headers.set("Cache-Control", "private, no-store");
  return image;
}

function normalizeHandle(raw: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/$/, "");
  return cleaned ? `@${cleaned}` : null;
}
