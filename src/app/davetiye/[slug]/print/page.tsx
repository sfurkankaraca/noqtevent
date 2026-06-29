import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase";
import PrintTrigger from "./PrintTrigger";

type Props = { params: Promise<{ slug: string }> };

export default async function PrintPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data: inv } = await supabase
    .from("invitations")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!inv) notFound();

  const date = inv.wedding_date
    ? new Date(inv.wedding_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <>
      <PrintTrigger />
      <div
        style={{
          fontFamily: "Georgia, serif",
          maxWidth: 600,
          margin: "0 auto",
          padding: "60px 40px",
          color: "#1a1a1a",
          minHeight: "100vh",
          background: "#fff",
        }}
      >
        {inv.cover_photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={inv.cover_photo_url}
            alt="Kapak"
            style={{ width: "100%", height: 280, objectFit: "cover", borderRadius: 12, marginBottom: 48 }}
          />
        )}

        <p style={{ fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: "#aaa", marginBottom: 16 }}>
          Düğün Daveti
        </p>

        <h1 style={{ fontSize: 48, fontWeight: 400, fontStyle: "italic", lineHeight: 1.2, margin: "0 0 8px" }}>
          {inv.bride_name}
        </h1>
        <p style={{ fontSize: 24, color: "#bbb", margin: "4px 0" }}>&amp;</p>
        <h1 style={{ fontSize: 48, fontWeight: 400, fontStyle: "italic", lineHeight: 1.2, margin: "0 0 40px" }}>
          {inv.groom_name}
        </h1>

        {(date || inv.wedding_time || inv.venue_name) && (
          <div style={{ borderTop: "1px solid #e5e5e5", borderBottom: "1px solid #e5e5e5", padding: "24px 0", margin: "0 0 36px" }}>
            {date && <p style={{ fontSize: 18, margin: "0 0 4px", fontWeight: 400 }}>{date}</p>}
            {inv.wedding_time && <p style={{ fontSize: 14, color: "#777", margin: "0 0 8px" }}>{inv.wedding_time}</p>}
            {inv.venue_name && <p style={{ fontSize: 15, fontWeight: 500, margin: "0 0 4px" }}>{inv.venue_name}</p>}
            {inv.venue_address && <p style={{ fontSize: 13, color: "#999", margin: 0 }}>{inv.venue_address}</p>}
          </div>
        )}

        {inv.story && (
          <p style={{ fontSize: 14, color: "#555", lineHeight: 1.8, fontStyle: "italic", marginBottom: 32 }}>
            &ldquo;{inv.story}&rdquo;
          </p>
        )}

        {inv.dress_code && (
          <p style={{ fontSize: 13, color: "#888", marginBottom: 12 }}>
            <span style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontSize: 11 }}>Kıyafet</span>
            <br />{inv.dress_code}
          </p>
        )}

        {inv.music_note && (
          <p style={{ fontSize: 13, color: "#888", marginBottom: 32 }}>
            <span style={{ textTransform: "uppercase", letterSpacing: "0.1em", fontSize: 11 }}>Müzik</span>
            <br />{inv.music_note}
          </p>
        )}

        {inv.memory_drive_url && (
          <div style={{ marginTop: 32, padding: "16px 20px", background: "#f9f8f6", borderRadius: 8 }}>
            <p style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#aaa", margin: "0 0 6px" }}>Memory Drive</p>
            <p style={{ fontSize: 13, color: "#555", margin: 0 }}>{inv.memory_drive_url}</p>
          </div>
        )}

        <div style={{ marginTop: 60, paddingTop: 20, borderTop: "1px solid #e5e5e5", fontSize: 11, color: "#bbb", letterSpacing: "0.15em", textTransform: "uppercase" }}>
          NOQT.EVENTS
        </div>
      </div>
    </>
  );
}
