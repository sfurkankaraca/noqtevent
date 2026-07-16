import {
  Document, Page, Text, View, StyleSheet, Font, Link,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";
import { ROBOTO_REGULAR, ROBOTO_BOLD } from "./pdfFonts";
import { TERMS_TEXT } from "./bookingTerms";

// Built-in Helvetica Türkçe glifleri (ğ, ş, İ, ı, ₺) içermez — Unicode font şart
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
  accent: "#0a0a0a",
  green: "#15803d",
  amber: "#b45309",
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

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 },
  logo: { fontSize: 16, fontFamily: "Roboto", fontWeight: 700, letterSpacing: 2, color: palette.black },
  headerMeta: { alignItems: "flex-end" },
  headerMetaText: { fontSize: 9, color: palette.gray },

  // Title
  titleBlock: { marginBottom: 36, paddingBottom: 20, borderBottom: `1 solid ${palette.border}` },
  titleLabel: { fontSize: 8, color: palette.gray, letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" },
  title: { fontSize: 22, fontFamily: "Roboto", fontWeight: 700, color: palette.black },

  // Section
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 8, color: palette.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, paddingBottom: 6, borderBottom: `0.5 solid ${palette.border}` },

  // Grid
  row: { flexDirection: "row", marginBottom: 5 },
  rowLabel: { width: 140, color: palette.gray, fontSize: 9 },
  rowValue: { flex: 1, color: palette.black, fontSize: 9, fontFamily: "Roboto", fontWeight: 700 },

  // Financial box
  finBox: { backgroundColor: palette.lightGray, borderRadius: 6, padding: 16, marginBottom: 20 },
  finRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 5 },
  finLabel: { fontSize: 9, color: palette.gray },
  finValue: { fontSize: 9, fontFamily: "Roboto", fontWeight: 700, color: palette.black },
  finValueGreen: { fontSize: 9, fontFamily: "Roboto", fontWeight: 700, color: palette.green },
  finValueAmber: { fontSize: 9, fontFamily: "Roboto", fontWeight: 700, color: palette.amber },
  finDivider: { borderBottom: `0.5 solid ${palette.border}`, marginVertical: 6 },
  finTotal: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  finTotalLabel: { fontSize: 10, fontFamily: "Roboto", fontWeight: 700, color: palette.black },
  finTotalValue: { fontSize: 10, fontFamily: "Roboto", fontWeight: 700, color: palette.black },

  // Terms
  termsText: { fontSize: 8.5, color: palette.gray, lineHeight: 1.6, marginBottom: 6 },

  // Signature
  signBlock: { marginTop: 40, flexDirection: "row", gap: 40 },
  signBox: { flex: 1 },
  signLine: { borderBottom: `1 solid ${palette.black}`, marginBottom: 6, paddingBottom: 20 },
  signLabel: { fontSize: 8, color: palette.gray },
  signName: { fontSize: 9, fontFamily: "Roboto", fontWeight: 700, color: palette.black, marginBottom: 2 },

  // Footer
  footer: { position: "absolute", bottom: 30, left: 56, right: 56, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7.5, color: palette.gray },
});

export type ContractData = {
  bookingId: string;
  contractDate: string;
  client: { name: string; email?: string | null; phone?: string | null };
  artist: { name: string; performer_type?: string | null; city?: string | null };
  event: {
    type?: string | null;
    date?: string | null;
    time?: string | null;
    duration?: number | null;
    venueName?: string | null;
    venueCity?: string | null;
    venueAddress?: string | null;
  };
  financial: {
    fee: number;
    commissionRate: number;
    depositRate: number;
    advanceAmount?: number;
    travelRequired?: boolean;
    accommodationRequired?: boolean;
  };
  // Teklif kalemleri (çoklu sanatçı/hizmet) — boşsa tek sanatçılı klasik görünüm
  items?: {
    title: string;
    artistName?: string | null;
    profileUrl?: string | null;
    description?: string | null;
    amount: number;
  }[];
  notes?: string | null;
  // Müşteri teklifi dijital onayladıysa (click-wrap) — ıslak imza yerine geçer
  agreement?: {
    acceptedName: string;
    acceptedEmail?: string | null;
    plan: "cash" | "prepay";
    agreedPrice: number;
    acceptedAt: string; // ISO timestamp
    termsVersion: string;
    ip?: string | null;
    verifiedEmail?: string | null; // OTP ile doğrulanan e-posta
  } | null;
};

function fmt(n: number): string {
  return n.toLocaleString("tr-TR") + " ₺";
}

function ContractDocument({ data }: { data: ContractData }) {
  const agreement = data.agreement ?? null;
  // Dijital onay varsa müşterinin kabul ettiği plan fiyatı esas alınır
  const fee = agreement ? agreement.agreedPrice : data.financial.fee;
  const deposit = fee * (data.financial.depositRate / 100);
  const remaining = fee - deposit;

  const acceptedAtStr = agreement
    ? new Date(agreement.acceptedAt).toLocaleString("tr-TR", {
        day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : null;

  const eventDateStr = data.event.date
    ? new Date(data.event.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <Document title={`NOQT Booking Sozlesmesi — ${data.client.name}`} author="NOQT Experience">
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>NOQT</Text>
          <View style={styles.headerMeta}>
            <Text style={styles.headerMetaText}>Sözleşme No: {data.bookingId.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.headerMetaText}>Tarih: {data.contractDate}</Text>
            <Text style={styles.headerMetaText}>noqt.events</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titleBlock}>
          <Text style={styles.titleLabel}>Booking Sözleşmesi</Text>
          <Text style={styles.title}>{data.client.name}</Text>
        </View>

        {/* Taraflar */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Taraflar</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Hizmet Sağlayıcı</Text>
            <Text style={styles.rowValue}>NOQT Experience (Organizasyon)</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Müşteri</Text>
            <Text style={styles.rowValue}>{data.client.name}</Text>
          </View>
          {data.client.email && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>E-posta</Text>
              <Text style={styles.rowValue}>{data.client.email}</Text>
            </View>
          )}
          {data.client.phone && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Telefon</Text>
              <Text style={styles.rowValue}>{data.client.phone}</Text>
            </View>
          )}
          <View style={[styles.row, { marginTop: 10 }]}>
            <Text style={styles.rowLabel}>Sanatçı / Ekip</Text>
            <Text style={styles.rowValue}>{data.artist.name}</Text>
          </View>
          {data.artist.performer_type && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Sanatçı Türü</Text>
              <Text style={styles.rowValue}>{data.artist.performer_type}</Text>
            </View>
          )}
        </View>

        {/* Etkinlik detayları */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Etkinlik Detayları</Text>
          {data.event.type && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Etkinlik Türü</Text>
              <Text style={styles.rowValue}>{data.event.type}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Tarih</Text>
            <Text style={styles.rowValue}>{eventDateStr}</Text>
          </View>
          {data.event.time && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Başlangıç Saati</Text>
              <Text style={styles.rowValue}>{data.event.time}</Text>
            </View>
          )}
          {data.event.duration && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Performans Süresi</Text>
              <Text style={styles.rowValue}>{data.event.duration} saat</Text>
            </View>
          )}
          {data.event.venueName && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Mekan</Text>
              <Text style={styles.rowValue}>{data.event.venueName}</Text>
            </View>
          )}
          {data.event.venueCity && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Şehir</Text>
              <Text style={styles.rowValue}>{data.event.venueCity}</Text>
            </View>
          )}
          {data.event.venueAddress && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Adres</Text>
              <Text style={styles.rowValue}>{data.event.venueAddress}</Text>
            </View>
          )}
        </View>

        {/* Hizmet kalemleri — çoklu sanatçı/hizmet teklifi */}
        {data.items && data.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hizmet Kalemleri</Text>
            <View style={styles.finBox}>
              {data.items.map((it, i) => (
                <View key={i} style={{ marginBottom: i < data.items!.length - 1 ? 8 : 0 }}>
                  <View style={styles.finRow}>
                    <Text style={styles.finValue}>{it.title}</Text>
                    <Text style={styles.finValue}>{fmt(it.amount)}</Text>
                  </View>
                  {it.description ? (
                    <Text style={{ fontSize: 8, color: palette.gray }}>{it.description}</Text>
                  ) : null}
                  {it.profileUrl ? (
                    <Link src={it.profileUrl} style={{ fontSize: 8, color: palette.gray, textDecoration: "underline" }}>
                      Sanatçı profili: {it.profileUrl}
                    </Link>
                  ) : null}
                </View>
              ))}
              <View style={styles.finDivider} />
              <View style={styles.finTotal}>
                <Text style={styles.finTotalLabel}>Kalemler Toplamı</Text>
                <Text style={styles.finTotalValue}>
                  {fmt(data.items.reduce((s, it) => s + it.amount, 0))}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Finansal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ödeme Planı</Text>
          <View style={styles.finBox}>
            {agreement && (
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Seçilen Ödeme Planı</Text>
                <Text style={styles.finValueGreen}>
                  {agreement.plan === "cash" ? "Peşin Ödeme" : "Ön Ödemeli (vade farkı dahil)"}
                </Text>
              </View>
            )}
            <View style={styles.finRow}>
              <Text style={styles.finLabel}>Toplam Hizmet Bedeli</Text>
              <Text style={styles.finValue}>{fmt(fee)}</Text>
            </View>
            <View style={styles.finDivider} />
            <View style={styles.finRow}>
              <Text style={styles.finLabel}>Kapora ({data.financial.depositRate}%) — Sözleşme imzasında</Text>
              <Text style={styles.finValue}>{fmt(deposit)}</Text>
            </View>
            <View style={styles.finRow}>
              <Text style={styles.finLabel}>Kalan Ödeme — Etkinlik öncesi</Text>
              <Text style={styles.finValue}>{fmt(remaining)}</Text>
            </View>
            {(data.financial.travelRequired || data.financial.accommodationRequired) && data.financial.advanceAmount ? (
              <>
                <View style={styles.finDivider} />
                <View style={styles.finRow}>
                  <Text style={styles.finLabel}>
                    Sanatçı gider avansı
                    {data.financial.travelRequired ? " (ulaşım)" : ""}
                    {data.financial.accommodationRequired ? " + konaklama" : ""}
                  </Text>
                  <Text style={styles.finValueAmber}>{fmt(data.financial.advanceAmount)}</Text>
                </View>
              </>
            ) : null}
          </View>
        </View>

        {/* Koşullar — dijital onayda müşterinin kabul ettiği metin basılır */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Genel Koşullar{agreement ? ` (${agreement.termsVersion})` : ""}
          </Text>
          {TERMS_TEXT.split("\n\n").map((p, i) => (
            <Text key={i} style={styles.termsText}>{p.trim()}</Text>
          ))}
          {data.notes && (
            <Text style={[styles.termsText, { marginTop: 8, fontFamily: "Roboto", fontWeight: 700 }]}>
              Özel Not: {data.notes}
            </Text>
          )}
        </View>

        {/* İmza / Dijital Onay */}
        {agreement ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Elektronik Onay</Text>
            <View style={styles.finBox}>
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Onaylayan</Text>
                <Text style={styles.finValue}>{agreement.acceptedName}</Text>
              </View>
              {agreement.acceptedEmail && (
                <View style={styles.finRow}>
                  <Text style={styles.finLabel}>E-posta</Text>
                  <Text style={styles.finValue}>{agreement.acceptedEmail}</Text>
                </View>
              )}
              <View style={styles.finRow}>
                <Text style={styles.finLabel}>Onay Tarihi</Text>
                <Text style={styles.finValue}>{acceptedAtStr}</Text>
              </View>
              {agreement.ip && (
                <View style={styles.finRow}>
                  <Text style={styles.finLabel}>IP Adresi</Text>
                  <Text style={styles.finValue}>{agreement.ip}</Text>
                </View>
              )}
              {agreement.verifiedEmail && (
                <View style={styles.finRow}>
                  <Text style={styles.finLabel}>Kimlik Doğrulama</Text>
                  <Text style={styles.finValueGreen}>
                    E-posta, tek kullanımlık kod ile doğrulandı ({agreement.verifiedEmail})
                  </Text>
                </View>
              )}
              <View style={styles.finDivider} />
              <Text style={styles.termsText}>
                Bu sözleşme, yukarıda belirtilen tarihte noqt.events üzerinden elektronik ortamda
                onaylanmıştır. Elektronik onay, 6098 sayılı TBK ve 6563 sayılı ETK kapsamında
                tarafları bağlayıcı irade beyanı niteliğindedir; ayrıca ıslak imza gerekmez.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.signBlock}>
            <View style={styles.signBox}>
              <Text style={styles.signName}>{data.client.name}</Text>
              <View style={styles.signLine} />
              <Text style={styles.signLabel}>Müşteri İmzası / Tarih</Text>
            </View>
            <View style={styles.signBox}>
              <Text style={styles.signName}>NOQT Experience</Text>
              <View style={styles.signLine} />
              <Text style={styles.signLabel}>Yetkili İmzası / Tarih</Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>NOQT Experience · noqt.events</Text>
          <Text style={styles.footerText} render={({ pageNumber, totalPages }) =>
            `Sayfa ${pageNumber} / ${totalPages}`} />
        </View>

      </Page>
    </Document>
  );
}

export async function generateContractPdf(data: ContractData): Promise<Buffer> {
  const buf = await renderToBuffer(<ContractDocument data={data} />);
  return Buffer.from(buf);
}
