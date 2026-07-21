import { track } from "@vercel/analytics";

/**
 * Dönüşüm event'leri için tek merkez. İsim standardını burada tutuyoruz ki
 * farklı bileşenlerde yazım farkı oluşmasın ve Vercel Analytics → Events
 * ekranında temiz gruplanabilsin.
 */
export type ConversionEvent =
  | "whatsapp_click"
  | "cta_click"
  | "planner_step"
  | "planner_complete"
  | "lead_submit"
  | "artist_booking_step"
  | "artist_booking_submit"
  | "lead_landing_view"
  | "lead_landing_submit"
  | "ai_concierge_start"
  | "ai_concierge_result"
  | "ai_concierge_submit"
  | "ai_concierge_abandon";

type EventProps = Record<string, string | number | boolean | null>;

export function trackEvent(name: ConversionEvent, props?: EventProps) {
  track(name, props);
}
