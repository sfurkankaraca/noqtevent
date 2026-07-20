"use server";

import { headers } from "next/headers";
import { createServiceClient } from "@/lib/supabase";
import { rateLimit } from "@/lib/rateLimit";
import { extractEventVibe } from "@/lib/aiContent";
import { eventTypeLabel } from "@/lib/eventTypeLabels";
import { submitInquiry } from "@/app/planla/actions";
import {
  initialData,
  PARTNER_SERVICES,
  type PlannerData,
  type EventSections,
} from "@/components/planner/PlannerStore";
import {
  type ConciergeInput,
  type ConciergeArtist,
  type VibeExtraction,
  validateConciergeInput,
  sanitizeFreeText,
  validateExtraction,
  fallbackNarrative,
  matchConcepts,
  matchArtists,
  deriveServices,
  serviceLabels,
  estimatePriceText,
  EMPTY_EXTRACTION,
  GUEST_RANGES,
  CITIES,
  BUDGET_LEVELS,
} from "@/lib/concierge";

export type ConciergeResult = {
  narrative: string;
  aiUsed: boolean;
  concepts: { id: string; name: string; emoji: string; description: string; cover: string | null; color: string }[];
  artists: { id: string; name: string; performerType: string | null; city: string | null; photo: string | null }[];
  priceRangeText: string | null;
  serviceIds: string[];
  serviceLabels: string[];
  extraction: VibeExtraction;
};

export async function runConcierge(input: ConciergeInput): Promise<ConciergeResult> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  // Halka açık AI ucu: saatte 5 oturum/IP. Ekstraksiyon zaten oturum başına tek çağrı.
  const { ok } = rateLimit(ip, "concierge", { max: 5, windowMs: 60 * 60_000 });
  if (!ok) throw new Error("Çok fazla istek. Lütfen daha sonra tekrar deneyin.");

  const invalid = validateConciergeInput(input);
  if (invalid) throw new Error(invalid);

  const freeText = sanitizeFreeText(input.freeText);

  // Tek AI çağrısı — başarısız/bozuk çıktıda deterministik akış devam eder.
  let extraction: VibeExtraction = EMPTY_EXTRACTION;
  let aiUsed = false;
  if (freeText.length >= 5 && process.env.AI_GATEWAY_API_KEY) {
    try {
      const { parsed } = await extractEventVibe({
        eventTypeLabel: eventTypeLabel(input.eventType),
        guestLabel: GUEST_RANGES.find((g) => g.id === input.guestRange)?.label ?? "",
        cityLabel: CITIES.find((c) => c.id === input.city)?.label ?? "",
        budgetLabel: BUDGET_LEVELS.find((b) => b.id === input.budgetLevel)?.label ?? "",
        freeText,
        serviceCatalog: PARTNER_SERVICES.map((s) => ({ id: s.id, label: s.label })),
      });
      if (parsed) {
        extraction = validateExtraction(parsed);
        aiUsed = true;
      }
    } catch (err) {
      console.error("Concierge AI extraction failed:", err);
    }
  }

  const supabase = createServiceClient();
  const [{ data: dbConcepts }, { data: dbDjs }] = await Promise.all([
    supabase.from("concepts").select("slug, cover_image_url").eq("is_active", true),
    supabase
      .from("dj_profiles")
      .select("id, name, performer_type, city, photo_url, photos, concept_tags, base_fee_min, base_fee_max, event_type_fees")
      .eq("is_active", true)
      .eq("application_status", "approved"),
  ]);

  const activeSlugs = (dbConcepts ?? []).map((c) => c.slug as string);
  const covers: Record<string, string> = {};
  for (const c of dbConcepts ?? []) {
    if (c.cover_image_url) covers[c.slug as string] = c.cover_image_url as string;
  }

  const concepts = matchConcepts({ eventType: input.eventType }, extraction, activeSlugs);
  const conceptIds = concepts.map((c) => c.id);

  const artists = (dbDjs ?? []) as ConciergeArtist[];
  const matched = matchArtists(artists, conceptIds, input.city);

  const serviceIds = deriveServices(extraction, input.venueStatus);
  const priceRangeText = estimatePriceText(matched, artists, input.eventType);

  const narrative = extraction.narrative || fallbackNarrative(input.eventType);

  return {
    narrative,
    aiUsed,
    concepts: concepts.map((c) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      description: c.description,
      cover: covers[c.id] ?? null,
      color: c.color,
    })),
    artists: matched.map((a) => ({
      id: a.id,
      name: a.name,
      performerType: a.performer_type,
      city: a.city,
      photo: (a.photos && a.photos.length > 0 ? a.photos[0] : a.photo_url) ?? null,
    })),
    priceRangeText,
    serviceIds,
    serviceLabels: serviceLabels(serviceIds),
    extraction,
  };
}

export type ConciergeSubmission = {
  input: ConciergeInput;
  result: ConciergeResult;
  name: string;
  surname: string;
  email: string;
  phone: string;
  eventDate: string;
};

export async function submitConciergeInquiry(
  sub: ConciergeSubmission
): Promise<{ availabilityWarning: boolean }> {
  const invalid = validateConciergeInput(sub.input);
  if (invalid) throw new Error(invalid);

  // Concierge bağlamı, şema değişikliği gerektirmeden event_sections jsonb'sine gömülür.
  // Boyutlar sunucuda yeniden sınırlanır — istemciden gelen payload'a güvenilmez.
  const aiConcierge = {
    source: "ai_concierge",
    month: sub.input.month,
    guest_range: sub.input.guestRange,
    city: sub.input.city,
    venue_status: sub.input.venueStatus,
    budget_level: sub.input.budgetLevel,
    free_text: sanitizeFreeText(sub.input.freeText),
    extraction: validateExtraction(sub.result.extraction),
    ai_used: Boolean(sub.result.aiUsed),
    matched_concepts: (sub.result.concepts ?? []).slice(0, 3).map((c) => String(c.id).slice(0, 60)),
    matched_artists: (sub.result.artists ?? []).slice(0, 3).map((a) => String(a.id).slice(0, 60)),
    price_range_shown: sub.result.priceRangeText ? String(sub.result.priceRangeText).slice(0, 60) : null,
    narrative_shown: String(sub.result.narrative ?? "").slice(0, 420),
  };

  const eventSections = {
    ...initialData.eventSections,
    ai_concierge: aiConcierge,
  } as unknown as EventSections;

  const plannerData: PlannerData = {
    ...initialData,
    eventType: sub.input.eventType,
    guestCount: GUEST_RANGES.find((g) => g.id === sub.input.guestRange)?.label ?? "",
    hasVenue: sub.input.venueStatus === "var",
    services: (sub.result.serviceIds ?? []).slice(0, 10),
    eventSections,
    name: sub.name,
    surname: sub.surname,
    email: sub.email,
    phone: sub.phone,
    eventDate: sub.eventDate || "",
  };

  // Mevcut akışı aynen kullan: doğrulama, rate limit, e-postalar, müsaitlik kontrolü.
  return submitInquiry(plannerData);
}
