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
  | "lead_submit";

type EventProps = Record<string, string | number | boolean | null>;

export function trackEvent(name: ConversionEvent, props?: EventProps) {
  track(name, props);
}
