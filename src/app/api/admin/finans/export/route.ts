import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";

// Muhasebeci için tüm ödeme hareketlerini CSV olarak indirir (Excel uyumlu)

const TYPE_LABEL: Record<string, string> = {
  deposit: "Kapora",
  full: "Odeme",
  advance: "Avans",
  artist_payment: "Sanatci Odemesi",
  refund: "Iade",
};

function csvCell(v: unknown): string {
  const s = String(v ?? "");
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
  }

  const supabase = createServiceClient();
  const { data: payments, error } = await supabase
    .from("booking_payments")
    .select("*, bookings(client_name, event_date, event_type, dj_profiles(name))")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const header = [
    "Tarih", "Müşteri", "Sanatçı", "Etkinlik Tarihi", "Tür", "Yön", "Tutar (TL)", "Durum", "Açıklama", "Booking ID",
  ];
  const rows = (payments ?? []).map((p) => [
    new Date(p.paid_at ?? p.created_at).toLocaleDateString("tr-TR"),
    p.bookings?.client_name ?? "",
    p.bookings?.dj_profiles?.name ?? "",
    p.bookings?.event_date ? new Date(p.bookings.event_date).toLocaleDateString("tr-TR") : "",
    TYPE_LABEL[p.type] ?? p.type,
    p.direction === "inbound" ? "Giren" : "Çıkan",
    Number(p.amount).toFixed(2).replace(".", ","), // Türkçe Excel ondalık
    p.status,
    p.description ?? "",
    p.booking_id,
  ]);

  // BOM: Excel'in Türkçe karakterleri doğru açması için
  const csv = "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="noqt-odemeler-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
