// Haftalık/aylık takvim görseli (src/app/panel/takvim/gorsel) için
// Europe/Istanbul tarih aralığı hesapları. Europe/Istanbul 2016'dan beri DST
// uygulamıyor (yıl boyu sabit UTC+3) — bu yüzden tam IANA tz veritabanına
// gerek yok: "now + 3 saat" ile elde edilen Date'in UTC getter'ları
// (getUTCFullYear/Month/Date/Day) İstanbul saatinin takvim bileşenlerini
// verir ("kaydırılmış-UTC" hilesi). Sınırlar hesaplandıktan sonra 3 saat
// geri çıkarılıp gerçek UTC ISO'ya çevriliyor (Supabase start_at karşılaştırması için).
export type Period = "week" | "month";

const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;

function toShifted(date: Date): Date {
  return new Date(date.getTime() + ISTANBUL_OFFSET_MS);
}

function fromShifted(shifted: Date): Date {
  return new Date(shifted.getTime() - ISTANBUL_OFFSET_MS);
}

function startOfShiftedDay(shifted: Date): Date {
  return new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()));
}

export interface PeriodRange {
  /** ISO — aralık başlangıcı (dahil) */
  startIso: string;
  /** ISO — aralık bitişi (hariç) */
  endIso: string;
  /** Görselin başlık satırı, ör. "Bu Hafta" / "AĞUSTOS 2026" */
  title: string;
}

// Hafta = Pazartesi başlangıçlı tam takvim haftası (Pazartesi 00:00 →
// bir sonraki Pazartesi 00:00, İstanbul). Geçmiş günler ELENMİYOR (bu kural
// yalnız "month" için istendi — bkz. görev talimatı).
export function getWeekRange(now: Date = new Date()): PeriodRange {
  const shiftedNow = toShifted(now);
  const dow = shiftedNow.getUTCDay(); // 0=Paz .. 6=Cmt
  const daysSinceMonday = (dow + 6) % 7;
  const mondayShifted = new Date(startOfShiftedDay(shiftedNow).getTime() - daysSinceMonday * 86400000);
  const nextMondayShifted = new Date(mondayShifted.getTime() + 7 * 86400000);
  return {
    startIso: fromShifted(mondayShifted).toISOString(),
    endIso: fromShifted(nextMondayShifted).toISOString(),
    title: "Bu Hafta",
  };
}

// Ay = "şimdi"den ayın son gününe kadar (geçmiş günler atlanır — görev
// talimatı: "ay görselinde geçmiş günlerin etkinlikleri atlanır, bugünden ay sonuna").
export function getMonthRange(now: Date = new Date()): PeriodRange {
  const shiftedNow = toShifted(now);
  const year = shiftedNow.getUTCFullYear();
  const month = shiftedNow.getUTCMonth();
  const nextMonthStartShifted = new Date(Date.UTC(year, month + 1, 1));
  const monthLabel = monthYearFmt.format(fromShifted(new Date(Date.UTC(year, month, 15))));
  return {
    startIso: now.toISOString(),
    endIso: fromShifted(nextMonthStartShifted).toISOString(),
    title: monthLabel.toLocaleUpperCase("tr-TR"),
  };
}

export function getPeriodRange(period: Period, now: Date = new Date()): PeriodRange {
  return period === "month" ? getMonthRange(now) : getWeekRange(now);
}

const monthYearFmt = new Intl.DateTimeFormat("tr-TR", { month: "long", year: "numeric", timeZone: "Europe/Istanbul" });
export const weekdayShortFmt = new Intl.DateTimeFormat("tr-TR", { weekday: "short", timeZone: "Europe/Istanbul" });
export const dayNumberFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", timeZone: "Europe/Istanbul" });
export const timeFmt = new Intl.DateTimeFormat("tr-TR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
  hourCycle: "h23",
});
export const weekdayLongFmt = new Intl.DateTimeFormat("tr-TR", { weekday: "long", timeZone: "Europe/Istanbul" });
export const dayMonthFmt = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", timeZone: "Europe/Istanbul" });
