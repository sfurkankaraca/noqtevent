import {
  Document, Page, Text, View, StyleSheet, Font, Link,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";
import { ROBOTO_REGULAR, ROBOTO_BOLD } from "./pdfFonts";
import {
  PREPAY_DEADLINE_DAYS, FINAL_PAYMENT_GRACE_DAYS, NON_REFUNDABLE_WINDOW_DAYS,
} from "./bookingTerms";

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

  titleBlock: { marginBottom: 32, paddingBottom: 20, borderBottom: `1 solid ${palette.border}` },
  titleLabel: { fontSize: 8, color: palette.gray, letterSpacing: 2, marginBottom: 6, textTransform: "uppercase" },
  title: { fontSize: 22, fontFamily: "Roboto", fontWeight: 700, color: palette.black },

  section: { marginBottom: 22 },
  sectionTitle: { fontSize: 8, color: palette.gray, letterSpacing: 2, textTransform: "uppercase", marginBottom: 10, paddingBottom: 6, borderBottom: `0.5 solid ${palette.border}` },

  row: { flexDirection: "row", marginBottom: 5 },
  rowLabel: { width: 140, color: palette.gray, fontSize: 9 },
  rowValue: { flex: 1, color: palette.black, fontSize: 9, fontFamily: "Roboto", fontWeight: 700 },

  itemBox: { backgroundColor: palette.lightGray, borderRadius: 6, padding: 16 },
  itemRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  itemTitle: { fontSize: 9.5, fontFamily: "Roboto", fontWeight: 700, color: palette.black },
  itemAmount: { fontSize: 9.5, fontFamily: "Roboto", fontWeight: 700, color: palette.black },
  itemDesc: { fontSize: 8, color: palette.gray },
  itemLink: { fontSize: 8, color: palette.gray, textDecoration: "underline" },
  divider: { borderBottom: `0.5 solid ${palette.border}`, marginVertical: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  totalLabel: { fontSize: 10, fontFamily: "Roboto", fontWeight: 700, color: palette.black },
  totalValue: { fontSize: 10, fontFamily: "Roboto", fontWeight: 700, color: palette.black },
  discountLabel: { fontSize: 9, color: palette.gray },
  discountStrike: { fontSize: 9, color: palette.gray, textDecoration: "line-through" },
  discountGreen: { fontSize: 9, color: "#15803d", fontFamily: "Roboto", fontWeight: 700 },

  priceGrid: { flexDirection: "row", gap: 12 },
  priceCard: { flex: 1, border: `1 solid ${palette.border}`, borderRadius: 6, padding: 14 },
  priceLabel: { fontSize: 8, color: palette.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 },
  priceValue: { fontSize: 14, fontFamily: "Roboto", fontWeight: 700, color: palette.black, marginBottom: 4 },
  priceNote: { fontSize: 8, color: palette.gray, lineHeight: 1.4 },
  vatNote: { fontSize: 7, fontFamily: "Roboto", fontWeight: 400, color: palette.gray },

  ctaBox: { backgroundColor: palette.lightGray, borderRadius: 6, padding: 16, marginBottom: 22 },
  ctaText: { fontSize: 9, color: palette.black, marginBottom: 4 },
  ctaLink: { fontSize: 9, color: palette.black, textDecoration: "underline", fontFamily: "Roboto", fontWeight: 700 },

  termsText: { fontSize: 8.5, color: palette.gray, lineHeight: 1.6, marginBottom: 5 },

  footer: { position: "absolute", bottom: 30, left: 56, right: 56, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 7.5, color: palette.gray },
});

export type OfferPdfData = {
  bookingId: string;
  offerDate: string;
  validUntil: string | null;
  client: { name: string; email?: string | null; phone?: string | null };
  event: {
    type?: string | null;
    date?: string | null;
    time?: string | null;
    duration?: number | null;
    venueName?: string | null;
    venueCity?: string | null;
  };
  items: {
    title: string;
    artistName?: string | null;
    performerType?: string | null;
    profileUrl?: string | null;
    description?: string | null;
    amount: number;
  }[];
  cashPrice: number;
  // Liste fiyatı > ücret ise müşteriye özel iskonto satırları basılır
  discount?: { listPrice: number; amount: number; rate: number; note: string | null } | null;
  // Önerilen müzik konseptleri (bilgilendirme)
  musicConcepts?: { name: string; categoryLabel: string; description: string; musicalDirection: string; url?: string | null }[];
  prepayPrice: number;
  prepayAvailable: boolean;
  depositRate: number;
  offerUrl: string;
  notes?: string | null;
};

function fmt(n: number): string {
  return n.toLocaleString("tr-TR") + " ₺";
}

function OfferDocument({ data }: { data: OfferPdfData }) {
  const eventDateStr = data.event.date
    ? new Date(data.event.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
    : "—";
  const deposit = Math.round(data.prepayPrice * (data.depositRate / 100));

  return (
    <Document title={`NOQT Fiyat Teklifi — ${data.client.name}`} author="NOQT Experience">
      <Page size="A4" style={styles.page}>

        <View style={styles.header}>
          <Text style={styles.logo}>NOQT</Text>
          <View style={styles.headerMeta}>
            <Text style={styles.headerMetaText}>Teklif No: {data.bookingId.slice(0, 8).toUpperCase()}</Text>
            <Text style={styles.headerMetaText}>Tarih: {data.offerDate}</Text>
            {data.validUntil && (
              <Text style={styles.headerMetaText}>Geçerlilik: {data.validUntil}</Text>
            )}
            <Text style={styles.headerMetaText}>noqt.events</Text>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.titleLabel}>Fiyat Teklifi</Text>
          <Text style={styles.title}>{data.client.name}</Text>
        </View>

        {/* Etkinlik */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Etkinlik Bilgileri</Text>
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
              <Text style={styles.rowLabel}>Saat</Text>
              <Text style={styles.rowValue}>{data.event.time}</Text>
            </View>
          )}
          {data.event.duration ? (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Süre</Text>
              <Text style={styles.rowValue}>{data.event.duration} saat</Text>
            </View>
          ) : null}
          {data.event.venueName && (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Mekan</Text>
              <Text style={styles.rowValue}>
                {data.event.venueName}{data.event.venueCity ? ` · ${data.event.venueCity}` : ""}
              </Text>
            </View>
          )}
        </View>

        {/* Kalemler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teklif Kapsamı</Text>
          <View style={styles.itemBox}>
            {data.items.map((it, i) => (
              <View key={i} style={{ marginBottom: i < data.items.length - 1 ? 10 : 0 }}>
                <View style={styles.itemRow}>
                  <Text style={styles.itemTitle}>
                    {it.title}
                    {it.performerType ? ` · ${it.performerType}` : ""}
                  </Text>
                  {it.amount > 0 && <Text style={styles.itemAmount}>{fmt(it.amount)}</Text>}
                </View>
                {it.description ? <Text style={styles.itemDesc}>{it.description}</Text> : null}
                {it.profileUrl ? (
                  <Link src={it.profileUrl} style={styles.itemLink}>
                    Sanatçı profili: {it.profileUrl}
                  </Link>
                ) : null}
              </View>
            ))}
            <View style={styles.divider} />
            {data.discount && (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.discountLabel}>Liste fiyatı</Text>
                  <Text style={styles.discountStrike}>{fmt(data.discount.listPrice)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.discountGreen}>
                    Size özel indirim (%{data.discount.rate}){data.discount.note ? ` · ${data.discount.note}` : ""}
                  </Text>
                  <Text style={styles.discountGreen}>−{fmt(data.discount.amount)}</Text>
                </View>
              </>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Toplam (peşin fiyat)</Text>
              <Text style={styles.totalValue}>{fmt(data.cashPrice)}<Text style={styles.vatNote}> + KDV</Text></Text>
            </View>
          </View>
        </View>

        {/* Ödeme seçenekleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ödeme Seçenekleri</Text>
          <View style={styles.priceGrid}>
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>Peşin Fiyat</Text>
              <Text style={styles.priceValue}>{fmt(data.cashPrice)}<Text style={styles.vatNote}> + KDV</Text></Text>
              <Text style={styles.priceNote}>Tam ödeme, tek seferde.</Text>
            </View>
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>Ön Ödemeli Fiyat</Text>
              <Text style={styles.priceValue}>{fmt(data.prepayPrice)}<Text style={styles.vatNote}> + KDV</Text></Text>
              <Text style={styles.priceNote}>
                {data.prepayAvailable
                  ? `Kapora (%${data.depositRate}): ${fmt(deposit)} + KDV — kalan ödeme etkinlikten sonra en geç ${FINAL_PAYMENT_GRACE_DAYS} gün içinde.`
                  : "Etkinlik tarihi yaklaştığı için bu seçenek kapanmıştır."}
              </Text>
            </View>
          </View>
        </View>

        {/* Önerilen müzik konseptleri */}
        {data.musicConcepts && data.musicConcepts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Önerdiğimiz Müzik Konseptleri</Text>
            {data.musicConcepts.map((c, i) => (
              <View key={i} style={{ marginBottom: i < data.musicConcepts!.length - 1 ? 8 : 0 }}>
                <Text style={styles.itemTitle}>{c.name} <Text style={styles.itemDesc}>· {c.categoryLabel}</Text></Text>
                <Text style={styles.itemDesc}>{c.description}</Text>
                <Text style={styles.itemDesc}>Müzikal yön: {c.musicalDirection}</Text>
                {c.url ? <Link src={c.url} style={styles.itemLink}>Konsept sayfası: {c.url}</Link> : null}
              </View>
            ))}
          </View>
        )}

        {/* Online onay */}
        <View style={styles.ctaBox}>
          <Text style={styles.ctaText}>
            Teklifi incelemek, sözleşmeyi elektronik olarak onaylamak ve güvenli ödeme yapmak için:
          </Text>
          <Link src={data.offerUrl} style={styles.ctaLink}>{data.offerUrl}</Link>
        </View>

        {/* Koşul özeti */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rezervasyon Koşulları (Özet)</Text>
          <Text style={styles.termsText}>
            • Ön ödeme ile rezervasyon, etkinliğe en az {PREPAY_DEADLINE_DAYS} gün kalana kadar yapılabilir.
          </Text>
          <Text style={styles.termsText}>
            • Kalan ödeme, etkinlik tarihinden sonra en geç {FINAL_PAYMENT_GRACE_DAYS} gün içinde tamamlanmalıdır.
          </Text>
          <Text style={styles.termsText}>
            • Etkinliğe {NON_REFUNDABLE_WINDOW_DAYS} gün veya daha az kala yapılan iptallerde ön ödeme iade edilmez.
          </Text>
          <Text style={styles.termsText}>
            • Elektronik onay, taraflar arasında bağlayıcı bir sözleşme oluşturur; sözleşmenin tam metni yukarıdaki
            teklif sayfasından incelenebilir ve indirilebilir.
          </Text>
          {data.notes && (
            <Text style={[styles.termsText, { marginTop: 6, fontFamily: "Roboto", fontWeight: 700 }]}>
              Özel Not: {data.notes}
            </Text>
          )}
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

export async function generateOfferPdf(data: OfferPdfData): Promise<Buffer> {
  const buf = await renderToBuffer(<OfferDocument data={data} />);
  return Buffer.from(buf);
}
