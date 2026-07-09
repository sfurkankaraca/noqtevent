import {
  Document, Page, Text, View, StyleSheet, Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";
import { ROBOTO_REGULAR, ROBOTO_BOLD } from "./pdfFonts";
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
    paddingTop: 60,
    paddingBottom: 60,
    paddingHorizontal: 56,
    lineHeight: 1.5,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 },
  logo: { fontSize: 16, fontFamily: "Roboto", fontWeight: 700, letterSpacing: 2, color: palette.black },
  headerMeta: { alignItems: "flex-end" },
  headerMetaText: { fontSize: 9, color: palette.gray },

  titleBlock: { marginBottom: 28, paddingBottom: 20, borderBottom: `1 solid ${palette.border}` },
  titleLabel: { fontSize: 8, color: palette.gray, letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" },
  title: { fontSize: 22, fontFamily: "Roboto", fontWeight: 700, color: palette.black },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 8, color: palette.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, paddingBottom: 6, borderBottom: `0.5 solid ${palette.border}` },

  row: { flexDirection: "row", marginBottom: 5 },
  rowLabel: { width: 100, color: palette.gray, fontSize: 9 },
  rowValue: { flex: 1, color: palette.black, fontSize: 9, fontFamily: "Roboto", fontWeight: 700 },

  progressBox: { backgroundColor: palette.lightGray, borderRadius: 6, padding: 14, marginBottom: 8, flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { fontSize: 9, color: palette.gray },
  progressValue: { fontSize: 10, fontFamily: "Roboto", fontWeight: 700, color: palette.black },

  catTitle: { fontSize: 9.5, fontFamily: "Roboto", fontWeight: 700, color: palette.black, marginBottom: 4, marginTop: 8 },
  itemRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 3, gap: 6 },
  checkbox: { fontSize: 9, color: palette.green, width: 12 },
  checkboxEmpty: { fontSize: 9, color: palette.gray, width: 12 },
  itemText: { fontSize: 9, color: palette.black, flex: 1 },
  itemTextDone: { fontSize: 9, color: palette.gray, flex: 1 },
  assigneeText: { fontSize: 8, color: palette.gray, fontStyle: "italic" },

  scheduleRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 4, gap: 8 },
  scheduleTime: { fontSize: 9, fontFamily: "Roboto", fontWeight: 700, color: palette.black, width: 40 },
  scheduleTitle: { fontSize: 9, color: palette.black, flex: 1 },

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

function ProjectFileDocument({ data }: { data: ProjectFileData }) {
  const eventDateStr = data.event.date
    ? new Date(data.event.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const doneCount = data.items.filter((i) => i.is_done).length;
  const total = data.items.length;

  return (
    <Document title={`NOQT Etkinlik Proje Dosyasi — ${data.client.name}`} author="NOQT Experience">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>NOQT</Text>
          <View style={styles.headerMeta}>
            <Text style={styles.headerMetaText}>Proje No: {data.bookingId.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.headerMetaText}>Tarih: {data.generatedDate}</Text>
            <Text style={styles.headerMetaText}>noqt.events</Text>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.titleLabel}>Etkinlik Proje Dosyası</Text>
          <Text style={styles.title}>{data.client.name}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Etkinlik Detayları</Text>
          {data.event.type && (
            <View style={styles.row}><Text style={styles.rowLabel}>Tür</Text><Text style={styles.rowValue}>{data.event.type}</Text></View>
          )}
          <View style={styles.row}><Text style={styles.rowLabel}>Tarih</Text><Text style={styles.rowValue}>{eventDateStr}</Text></View>
          {data.event.time && (
            <View style={styles.row}><Text style={styles.rowLabel}>Saat</Text><Text style={styles.rowValue}>{data.event.time}</Text></View>
          )}
          {data.event.venueName && (
            <View style={styles.row}><Text style={styles.rowLabel}>Mekan</Text><Text style={styles.rowValue}>{data.event.venueName}</Text></View>
          )}
          {data.event.venueCity && (
            <View style={styles.row}><Text style={styles.rowLabel}>Şehir</Text><Text style={styles.rowValue}>{data.event.venueCity}</Text></View>
          )}
          {data.artist?.name && (
            <View style={styles.row}><Text style={styles.rowLabel}>Sanatçı</Text><Text style={styles.rowValue}>{data.artist.name}</Text></View>
          )}
          {data.concept && (
            <View style={styles.row}><Text style={styles.rowLabel}>Konsept</Text><Text style={styles.rowValue}>{data.concept}</Text></View>
          )}
        </View>

        {data.schedule && data.schedule.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Etkinlik Günü Planı</Text>
            {data.schedule.map((s, idx) => (
              <View key={idx} style={styles.scheduleRow}>
                <Text style={styles.scheduleTime}>{s.time}</Text>
                <Text style={styles.scheduleTitle}>{s.title}</Text>
                {s.assignedTo && <Text style={styles.assigneeText}>{s.assignedTo}</Text>}
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Checklist Durumu</Text>
          <View style={styles.progressBox}>
            <Text style={styles.progressLabel}>Tamamlanan</Text>
            <Text style={styles.progressValue}>{doneCount} / {total}</Text>
          </View>
          {CATEGORY_ORDER.filter((cat) => data.items.some((i) => i.category === cat)).map((cat) => (
            <View key={cat}>
              <Text style={styles.catTitle}>{CATEGORY_LABELS[cat as ChecklistCategory]}</Text>
              {data.items.filter((i) => i.category === cat).map((item, idx) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={item.is_done ? styles.checkbox : styles.checkboxEmpty}>{item.is_done ? "✓" : "○"}</Text>
                  <Text style={item.is_done ? styles.itemTextDone : styles.itemText}>{item.title}</Text>
                  {item.dueDate && !item.is_done && (
                    <Text style={styles.assigneeText}>
                      {new Date(item.dueDate).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                    </Text>
                  )}
                  {item.assignedTo && <Text style={styles.assigneeText}>{item.assignedTo}</Text>}
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>NOQT Experience · noqt.events</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
            `Sayfa ${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export async function generateProjectFilePdf(data: ProjectFileData): Promise<Buffer> {
  const buf = await renderToBuffer(<ProjectFileDocument data={data} />);
  return Buffer.from(buf);
}
