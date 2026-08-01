import { NextRequest } from "next/server";
import { ImageResponse } from "next/og";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import { canManageSupplyEvent, getArtistByEntityId, getSupplyEventById, getVenueByEntityId } from "@/lib/panel/queries";
import { ENTRY_POLICY_SHORT_LABEL, EVENT_KIND_LABEL } from "@/lib/panel/format";
import { slugify } from "@/lib/panel/slug";
import { loadImageFonts } from "@/lib/panel/gorsel/fonts";
import { SIZES, getPalette, kindGradient, scrimGradient, resolveGorselOptions } from "@/lib/panel/gorsel/theme";
import { dayMonthFmt, timeFmt, weekdayLongFmt } from "@/lib/panel/gorsel/period";

// Etkinlik story/post paylaşım görseli — TASARIM (eventmatch/docs/ETKINLIK_KESIF_V1_TASARIM.md)
// §2.5 ve §0.4: "NOQT etkinlikten paylaşılabilir story görseli ÜRETİR — 'afiş
// tasarlatma, biz üretelim' kancası." Panelin mekan/sanatçıya ilk günden
// hissettireceği somut fayda olduğu için burada elle CSS/tipografi ile
// üretiliyor (harici tasarım aracı/şablonu YOK).
//
// Node.js runtime (varsayılan) — Supabase service_role client'ı burada da
// (queries.ts deseniyle) kullanılıyor; edge'e taşımaya gerek yok.
export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const options = resolveGorselOptions(url.searchParams);
  const { width, height } = SIZES[options.format];

  const user = await getPanelUser();
  if (!user) {
    return new Response("Bu görsele erişmek için panel oturumu gerekli.", { status: 401 });
  }

  const event = await getSupplyEventById(id);
  if (!event) {
    return new Response("Etkinlik bulunamadı.", { status: 404 });
  }

  const admin = await isPanelAdmin();
  if (!admin) {
    const canManage = await canManageSupplyEvent(user.id, event);
    if (!canManage) {
      return new Response("Bu etkinliğin görselini oluşturma yetkiniz yok.", { status: 403 });
    }
  }

  const [venue, artist, fonts] = await Promise.all([
    getVenueByEntityId(event.venue_entity_id),
    event.artist_entity_ids[0] ? getArtistByEntityId(event.artist_entity_ids[0]) : Promise.resolve(null),
    loadImageFonts(),
  ]);

  const palette = getPalette(options.theme, options.accent);

  const startAt = new Date(event.start_at);
  const dateLine = Number.isNaN(startAt.getTime()) ? null : `${weekdayLongFmt.format(startAt)}, ${dayMonthFmt.format(startAt)}`;
  const timeLine = Number.isNaN(startAt.getTime()) ? null : timeFmt.format(startAt);

  const venueName = venue?.name ?? "Mekan";
  const district = venue?.district ?? event.district ?? null;
  const entryLabel = event.entry_policy ? ENTRY_POLICY_SHORT_LABEL[event.entry_policy] : null;
  const kindLabel = EVENT_KIND_LABEL[event.event_kind].toLocaleUpperCase("tr-TR");
  const artistName = artist?.display_name ?? null;
  const photoUrl = options.showPhoto ? (artist?.photo_url ?? null) : null;
  const handle = options.showHandle ? normalizeHandle(venue?.instagram_handle ?? null) : null;

  // Uzun başlıklarda taşmayı önlemek için kabaca karakter sayısına göre küçült.
  const titleLength = event.title.length;
  const titleSize =
    options.format === "story"
      ? titleLength > 60
        ? 58
        : titleLength > 36
          ? 68
          : 84
      : titleLength > 60
        ? 42
        : titleLength > 36
          ? 50
          : 60;

  const pad = options.format === "story" ? "76px 64px 64px" : "56px 56px 52px";

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
        {/* Arka plan katmanı: sanatçı fotoğrafı ya da event_kind gradyanı */}
        <div style={{ position: "absolute", inset: 0, display: "flex" }}>
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoUrl} width={width} height={height} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", backgroundImage: kindGradient(palette, event.event_kind) }} />
          )}
        </div>

        {/* Okunabilirlik için alttan koyulaşan gradyan örtü */}
        <div style={{ position: "absolute", inset: 0, display: "flex", backgroundImage: scrimGradient(palette) }} />

        {/* İçerik katmanı */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: pad,
          }}
        >
          {/* Üst satır: etkinlik türü + (varsa) sanatçı rozeti */}
          <div style={{ display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div
              style={{
                display: "flex",
                backgroundColor: palette.pillBg,
                borderRadius: 999,
                padding: "14px 28px",
                fontSize: 28,
                fontWeight: 600,
                letterSpacing: 3,
                color: palette.ink,
              }}
            >
              {kindLabel}
            </div>
            {artistName ? (
              <div
                style={{
                  display: "flex",
                  backgroundColor: `rgba(${palette.scrimRgb}, 0.4)`,
                  border: `1px solid ${palette.accent}`,
                  borderRadius: 999,
                  padding: "14px 28px",
                  fontSize: 26,
                  fontWeight: 600,
                  color: palette.accent,
                  maxWidth: "58%",
                }}
              >
                {artistName}
              </div>
            ) : null}
          </div>

          {/* Alt blok: başlık + tarih/mekan + rozet + marka */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", width: 64, height: 5, backgroundColor: palette.accent, borderRadius: 3, marginBottom: 28 }} />

            <div
              style={{
                display: "flex",
                color: palette.ink,
                fontSize: titleSize,
                fontWeight: 700,
                lineHeight: 1.08,
                letterSpacing: -1.5,
              }}
            >
              {event.title}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
              {dateLine && timeLine ? (
                <div style={{ display: "flex", color: palette.inkSecondary, fontSize: options.format === "story" ? 34 : 30, fontWeight: 600 }}>
                  {dateLine} · {timeLine}
                </div>
              ) : null}
              <div style={{ display: "flex", color: palette.inkSecondary, fontSize: options.format === "story" ? 34 : 30, fontWeight: 600 }}>
                {venueName}
                {district ? ` · ${district}` : ""}
              </div>
              {entryLabel ? (
                <div
                  style={{
                    display: "flex",
                    alignSelf: "flex-start",
                    backgroundColor: palette.accent,
                    color: palette.onAccent,
                    borderRadius: 999,
                    padding: "10px 24px",
                    marginTop: 6,
                    fontSize: 24,
                    fontWeight: 700,
                    letterSpacing: 1,
                  }}
                >
                  {entryLabel.toLocaleUpperCase("tr-TR")}
                </div>
              ) : null}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 40,
                paddingTop: 28,
                borderTop: `1px solid ${palette.cardBorder}`,
              }}
            >
              <div style={{ display: "flex", color: palette.ink, fontSize: 40, fontWeight: 700, letterSpacing: -1 }}>noqt</div>
              <div style={{ display: "flex", color: palette.inkTertiary, fontSize: 22, fontWeight: 400 }}>{handle ?? "noqt.events"}</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { width, height, fonts }
  );

  const filename = `noqt-${slugify(event.title)}-${options.format}.png`;
  image.headers.set("Content-Disposition", `attachment; filename="${filename}"`);
  image.headers.set("Cache-Control", "private, no-store");
  return image;
}

function normalizeHandle(raw: string | null): string | null {
  if (!raw) return null;
  const cleaned = raw.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/$/, "");
  return cleaned ? `@${cleaned}` : null;
}
