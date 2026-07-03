import { calcCashPrice, calcPrepayPrice } from "./bookingTerms";

export type PaymentKind = "full" | "deposit" | "remaining";

export type DuePayment = {
  kind: PaymentKind;
  amount: number; // TL
  total: number; // planın toplam bedeli
  alreadyPaid: number;
};

// Booking'in planına ve tamamlanmış tahsilatlara göre sıradaki ödemeyi hesaplar.
// null → tahsil edilecek bir şey kalmadı.
export function calcDuePayment(
  booking: { fee: number | null; payment_plan: string | null; deposit_rate: number | null },
  completedInboundTotal: number
): DuePayment | null {
  const plan = booking.payment_plan === "prepay" ? "prepay" : "cash";
  const total = plan === "cash" ? calcCashPrice(booking.fee ?? 0) : calcPrepayPrice(booking.fee ?? 0);
  if (total <= 0) return null;

  const paid = Math.max(0, completedInboundTotal);
  const remaining = Math.round((total - paid) * 100) / 100;
  if (remaining <= 0) return null;

  if (paid > 0) {
    return { kind: "remaining", amount: remaining, total, alreadyPaid: paid };
  }
  if (plan === "prepay") {
    const deposit = Math.round(total * ((booking.deposit_rate ?? 30) / 100));
    return { kind: "deposit", amount: Math.min(deposit, remaining), total, alreadyPaid: 0 };
  }
  return { kind: "full", amount: total, total, alreadyPaid: 0 };
}
