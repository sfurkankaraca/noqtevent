import {
  Document, Page, Text, View, StyleSheet, Font, Image,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";
import { ROBOTO_REGULAR, ROBOTO_BOLD } from "./pdfFonts";
import { NOQT_WORDMARK } from "./pdfLogo";
import { CATEGORY_LABELS, CATEGORY_ORDER, type ChecklistCategory } from "./checklistTemplate";

Font.register({
  family: "Roboto",
  fonts: [
    { src: ROBOTO_REGULAR, fontWeight: 400 },
    { src: ROBOTO_BOLD, fontWeight: 700 },
  ],
});
Font.registerHyphenationCallback((word) => [word]);

const palette = {
  black: "#0a0a0a",
  gray: "#6b7280",
  lightGray: "#f4f4f4",
  border: "#e5e7eb",
  green: "#15803d",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 10,
    color: palette.black,
    paddingTop: 56,
    paddingBottom: 64,
    paddingHorizontal: 56,
    lineHeight: 1.5,
  },

  // Kapak
  coverPage: {
    fontFamily: "Roboto",
    color: palette.black,
    paddingHorizontal: 64,
    justifyContent: "center",
  },
  coverLogo: { width: 110, marginBottom: 48, alignSelf: "center" },
  coverLabel: { fontSize: 9, color: palette.gray, letterSpacing: 4, textTransform: "uppercase", textAlign: "center", marginBottom: 14 },
  coverTitle: { fontSize: 30, fontFamily: "Roboto", fontWeight: 700, textAlign: "center", marginBottom: 10 },
  coverMeta: { fontSize: 11, color: palette.gray, textAlign: "center", marginBottom: 4 },
  coverConcepts: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 20, flexWrap: "wrap" },
  coverChip: { fontSize: 9, color: palette.black, borderWidth: 0.5, borderColor: palette.border, borderRadius: 10, paddingVertical: 4, paddingHorizontal: 10 },
  coverFooter: { position: "absolute", bottom: 40, left: 64, right: 64, textAlign: "center", fontSize: 8, color: palette.gray },

  // İç sayfa başlığı
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32, paddingBottom: 14, borderBottomWidth: 0.5, borderBottomColor: palette.border },
  headerLogo: { width: 52 },
  headerMetaText: { fontSize: 8, color: palette.gray },

  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 8, color: palette.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, paddingBottom: 6, borderBottomWidth: 0.5, borderBottomColor: palette.border },

  row: { flexDirection: "row", marginBottom: 5 },
  rowLabel: { width: 100, color: palette.gray, fontSize: 9 },
  rowValue: { flex: 1, color: palette.black, fontSize: 9, fontFamily: "Roboto", fontWeight: 700 },

  progressBox: { backgroundColor: palette.lightGray, borderRadius: 6, padding: 14, marginBottom: 10, flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: 9, color: palette.gray },
  progressValue: { fontSize: 10, fontFamily: "Roboto", fontWeight: 700, color: palette.black },

  catTitle: { fontSize: 9.5, fontFamily: "Roboto", fontWeight: 700, color: palette.black, marginBottom: 5, marginTop: 10 },
  itemRow: { flexDirection: "row", alignItems: "center", marginBottom: 4, gap: 7 },
  // Vektörel checkbox — font glifi kullanılmaz (Roboto'da ✓/○ garanti değil)
  checkboxBox: { width: 8, height: 8, borderWidth: 1, borderColor: palette.gray, borderRadius: 2 },
  checkboxBoxDone: { width: 8, height: 8, borderWidth: 1, borderColor: palette.green, backgroundColor: palette.green, borderRadius: 2 },
  itemText: { fontSize: 9, color: palette.black, flex: 1 },
  itemTextDone: { fontSize: 9, color: palette.gray, flex: 1, textDecoration: "line-through" },
  metaText: { fontSize: 8, color: palette.gray },

  scheduleRow: { flexDirection: "row", alignItems: "center", paddingVertical: 5, gap: 10, borderBottomWidth: 0.5, borderBottomColor: palette.border },
  scheduleTime: { fontSize: 10, fontFamily: "Roboto", fontWeight: 700, color: palette.black, width: 42 },
  scheduleTitle: { fontSize: 9.5, color: palette.black, flex: 1 },

  footer: { position: "absolute", bottom: 30, left: 56, right: 56, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7.5, color: palette.gray },
});

export type ProjectFileData = {
  bookingId: string;
  generatedDate: string;
  client: { name: string; email?: string | null; phone?: string | null };
  event: {
    type?: string | null;
    date?: string | null;
    time?: string | null;
    duration?: number | null;
    venueName?: string | null;
    venueCity?: string | null;
    venueAddress?: string | null;
  };
  artist?: { name: string; performer_type?: string | null } | null;
  concept?: string | null;
  items: { category: string; title: string; is_done: boolean; assignedTo?: string | null; dueDate?: string | null }[];
  schedule?: { time: string; title: string; assignedTo?: string | null }[];
};

function fmtDay(d: string): string {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function PageFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>NOQT Experience · noqt.events</Text>
      <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
        `Sayfa ${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function ProjectFileDocument({ data }: { data: ProjectFileData }) {
  const eventDateStr = data.event.date
    ? new Date(data.event.date).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;
  const doneCount = data.items.filter((i) => i.is_done).length;
  const total = data.items.length;
  const concepts = (data.concept ?? "").split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <Document title={`NOQT Etkinlik Proje Dosyasi — ${data.client.name}`} author="NOQT Experience">
      {/* Kapak */}
      <Page size="A4" style={styles.coverPage}>
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <Image src={NOQT_WORDMARK} style={styles.coverLogo} />
        <Text style={styles.coverLabel}>Etkinlik Proje Dosyası</Text>
        <Text style={styles.coverTitle}>{data.client.name}</Text>
        {data.event.type && <Text style={styles.coverMeta}>{data.event.type}</Text>}
        {eventDateStr && (
          <Text style={styles.coverMeta}>
            {eventDateStr}{data.event.time ? ` · ${data.event.time}` : ""}
          </Text>
        )}
        {(data.event.venueName || data.event.venueCity) && (
          <Text style={styles.coverMeta}>
            {[data.event.venueName, data.event.venueCity].filter(Boolean).join(" · ")}
          </Text>
        )}
        {concepts.length > 0 && (
          <View style={styles.coverConcepts}>
            {concepts.map((c, i) => (
              <Text key={i} style={styles.coverChip}>{c}</Text>
            ))}
          </View>
        )}
        <Text style={styles.coverFooter}>NOQT Experience · noqt.events · {data.generatedDate}</Text>
      </Page>

      {/* İçerik */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={NOQT_WORDMARK} style={styles.headerLogo} />
          <Text style={styles.headerMetaText}>
            {data.client.name} · Proje No {data.bookingId.slice(0, 8).toUpperCase()}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Etkinlik Bilgileri</Text>
          {data.event.type && (
            <View style={styles.row}><Text style={styles.rowLabel}>Tür</Text><Text style={styles.rowValue}>{data.event.type}</Text></View>
          )}
          {eventDateStr && (
            <View style={styles.row}><Text style={styles.rowLabel}>Tarih</Text><Text style={styles.rowValue}>{eventDateStr}</Text></View>
          )}
          {data.event.time && (
            <View style={styles.row}><Text style={styles.rowLabel}>Saat</Text><Text style={styles.rowValue}>{data.event.time}</Text></View>
          )}
          {data.event.venueName && (
            <View style={styles.row}><Text style={styles.rowLabel}>Mekan</Text><Text style={styles.rowValue}>{data.event.venueName}</Text></View>
          )}
          {data.event.venueCity && (
            <View style={styles.row}><Text style={styles.rowLabel}>Şehir</Text><Text style={styles.rowValue}>{data.event.venueCity}</Text></View>
          )}
          {data.event.venueAddress && (
            <View style={styles.row}><Text style={styles.rowLabel}>Adres</Text><Text style={styles.rowValue}>{data.event.venueAddress}</Text></View>
          )}
          {data.artist?.name && (
            <View style={styles.row}><Text style={styles.rowLabel}>Sanatçı</Text><Text style={styles.rowValue}>{data.artist.name}</Text></View>
          )}
          {concepts.length > 0 && (
            <View style={styles.row}><Text style={styles.rowLabel}>Konsept</Text><Text style={styles.rowValue}>{concepts.join(", ")}</Text></View>
          )}
        </View>

        {data.schedule && data.schedule.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Etkinlik Günü Planı</Text>
            {data.schedule.map((s, idx) => (
              <View key={idx} style={styles.scheduleRow}>
                <Text style={styles.scheduleTime}>{s.time}</Text>
                <Text style={styles.scheduleTitle}>{s.title}</Text>
                {s.assignedTo && <Text style={styles.metaText}>{s.assignedTo}</Text>}
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Görevler & Dağılım</Text>
          <View style={styles.progressBox}>
            <Text style={styles.progressLabel}>Tamamlanan</Text>
            <Text style={styles.progressValue}>{doneCount} / {total}</Text>
          </View>
          {CATEGORY_ORDER.filter((cat) => data.items.some((i) => i.category === cat)).map((cat) => (
            <View key={cat}>
              <Text style={styles.catTitle}>{CATEGORY_LABELS[cat as ChecklistCategory]}</Text>
              {data.items.filter((i) => i.category === cat).map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <View style={item.is_done ? styles.checkboxBoxDone : styles.checkboxBox} />
                  <Text style={item.is_done ? styles.itemTextDone : styles.itemText}>{item.title}</Text>
                  {item.dueDate && !item.is_done && <Text style={styles.metaText}>{fmtDay(item.dueDate)}</Text>}
                  {item.assignedTo && <Text style={styles.metaText}>{item.assignedTo}</Text>}
                </View>
              ))}
            </View>
          ))}
        </View>

        <PageFooter />
      </Page>
    </Document>
  );
}

export async function generateProjectFilePdf(data: ProjectFileData): Promise<Buffer> {
  const buf = await renderToBuffer(<ProjectFileDocument data={data} />);
  return Buffer.from(buf);
}
