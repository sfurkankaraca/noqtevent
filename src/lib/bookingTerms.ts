export const TERMS_VERSION = "2026-07-02-v1";

export const PREPAY_MULTIPLIER = 1.25; // Ön ödemeli fiyat = peşin fiyat × 1.25
export const PREPAY_DEADLINE_DAYS = 15; // Ön ödeme ile rezervasyon en geç etkinliğe X gün kala yapılabilir
export const FINAL_PAYMENT_DEADLINE_DAYS = 2; // Kalan ödeme en geç etkinliğe X gün kala tamamlanmalı
export const NON_REFUNDABLE_WINDOW_DAYS = 7; // Etkinliğe X gün veya daha az kala iptal → ön ödeme iade edilmez

export function calcCashPrice(fee: number): number {
  return Math.round(fee);
}

export function calcPrepayPrice(fee: number): number {
  return Math.round(fee * PREPAY_MULTIPLIER);
}

export function daysUntil(eventDate: string | null): number | null {
  if (!eventDate) return null;
  const diff = new Date(eventDate + "T00:00:00").getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function isPrepayAvailable(eventDate: string | null): boolean {
  const days = daysUntil(eventDate);
  return days === null || days >= PREPAY_DEADLINE_DAYS;
}

export const TERMS_TEXT = `
1. Fiyatlandırma: Peşin ödeme seçeneğinde belirtilen ücret geçerlidir. Ön ödemeli (kaporalı) rezervasyon seçeneğinde toplam ücrete %25 vade farkı uygulanır.

2. Ön Ödeme ile Rezervasyon: Ön ödeme seçeneği, etkinlik tarihine en az ${PREPAY_DEADLINE_DAYS} gün kalana kadar kullanılabilir. Bu süreden sonra yalnızca peşin (tam) ödeme ile rezervasyon yapılabilir.

3. Kesin Rezervasyon: Rezervasyonun kesinleşmesi için kalan ödemenin etkinlik tarihinden en geç ${FINAL_PAYMENT_DEADLINE_DAYS} gün öncesine kadar tamamlanmış olması gerekir. Bu süre içinde ödeme tamamlanmazsa rezervasyon iptal sayılabilir.

4. İptal ve İade: Etkinlik tarihine ${NON_REFUNDABLE_WINDOW_DAYS} gün veya daha az kala yapılan iptallerde ödenmiş ön ödeme/kapora tutarı iade edilmez. Bu süreden daha erken yapılan iptallerde ön ödeme iade edilir.

5. Sanatçı Değişikliği: Mücbir sebepler (hastalık, kaza, doğal afet vb.) nedeniyle sanatçının etkinliğe katılamaması durumunda NOQT Experience eşdeğer bir alternatif sunar veya ödenen tutarı iade eder.

6. Teknik Rider: Booking onaylandıktan sonra paylaşılan teknik rider'daki gereksinimlerin etkinlik mekanında sağlanması organizatörün sorumluluğundadır.

7. Bu şartları elektronik ortamda onaylamanız, taraflar arasında bağlayıcı bir sözleşme oluşturur.
`.trim();
