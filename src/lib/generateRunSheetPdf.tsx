import {
  Document, Page, Text, View, StyleSheet, Font, Image,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";
import { ROBOTO_REGULAR, ROBOTO_BOLD } from "./pdfFonts";
import { NOQT_WORDMARK } from "./pdfLogo";

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
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 10,
    color: palette.black,
    paddingTop: 52,
    paddingBottom: 64,
    paddingHorizontal: 56,
    lineHeight: 1.5,
  },
  header: { alignItems: "center", marginBottom: 30 },
  logo: { width: 90, marginBottom: 18 },
  label: { fontSize: 8, color: palette.gray, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 },
  title: { fontSize: 20, fontFamily: "Roboto", fontWeight: 700, marginBottom: 12, textAlign: "center", lineHeight: 1.2 },
  meta: { fontSize: 10, color: palette.gray, textAlign: "center" },

  table: { marginTop: 18 },
  headRow: { flexDirection: "row", paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: palette.black, gap: 12 },
  headTime: { width: 48, fontSize: 8, color: palette.gray, letterSpacing: 1, textTransform: "uppercase" },
  headTitle: { flex: 1, fontSize: 8, color: palette.gray, letterSpacing: 1, textTransform: "uppercase" },
  headAssignee: { width: 110, fontSize: 8, color: palette.gray, letterSpacing: 1, textTransform: "uppercase", textAlign: "right" },

  row: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: palette.border, gap: 12 },
  time: { width: 48, fontSize: 11, fontFamily: "Roboto", fontWeight: 700 },
  cell: { flex: 1 },
  rowTitle: { fontSize: 10.5, color: palette.black },
  rowNote: { fontSize: 8.5, color: palette.gray, marginTop: 1 },
  assignee: { width: 110, fontSize: 9, color: palette.gray, textAlign: "right" },

  footer: { position: "absolute", bottom: 30, left: 56, right: 56, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7.5, color: palette.gray },
});

export type RunSheetData = {
  clientName: string;
  eventType?: string | null;
  eventDate?: string | null;
  venueName?: string | null;
  venueCity?: string | null;
  generatedDate: string;
  schedule: { time: string; title: string; description?: string | null; assignedTo?: string | null }[];
};

function RunSheetDocument({ data }: { data: RunSheetData }) {
  const eventDateStr = data.eventDate
    ? new Date(data.eventDate).toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <Document title={`NOQT Gun Plani — ${data.clientName}`} author="NOQT Experience">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={NOQT_WORDMARK} style={styles.logo} />
          <Text style={styles.label}>Etkinlik Günü Planı</Text>
          <Text style={styles.title}>{data.clientName}</Text>
          <Text style={styles.meta}>
            {[data.eventType, eventDateStr, [data.venueName, data.venueCity].filter(Boolean).join(" · ")]
              .filter(Boolean).join("  ·  ")}
          </Text>
        </View>

        <View style={styles.table}>
          <View style={styles.headRow}>
            <Text style={styles.headTime}>Saat</Text>
            <Text style={styles.headTitle}>Program</Text>
            <Text style={styles.headAssignee}>Sorumlu</Text>
          </View>
          {data.schedule.map((s, idx) => (
            <View key={idx} style={styles.row} wrap={false}>
              <Text style={styles.time}>{s.time}</Text>
              <View style={styles.cell}>
                <Text style={styles.rowTitle}>{s.title}</Text>
                {s.description && <Text style={styles.rowNote}>{s.description}</Text>}
              </View>
              <Text style={styles.assignee}>{s.assignedTo ?? ""}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>NOQT Experience · noqt.events</Text>
          <Text style={styles.footerText}>{data.generatedDate}</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateRunSheetPdf(data: RunSheetData): Promise<Buffer> {
  const buf = await renderToBuffer(<RunSheetDocument data={data} />);
  return Buffer.from(buf);
}
