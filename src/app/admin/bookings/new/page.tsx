import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import { EVENT_TYPE_LABELS } from "@/lib/eventTypeLabels";
import BookingForm from "../BookingForm";

// Sanatçı booking formundaki ek türler (planlayıcıda yok)
const EXTRA_EVENT_LABELS: Record<string, string> = {
  festival: "Festival",
  "club-night": "Kulüp / Bar Gecesi",
};

type Props = { searchParams: Promise<{ inquiry?: string }> };

export default async function NewBookingPage({ searchParams }: Props) {
  const { inquiry: inquiryId } = await searchParams;
  const supabase = createServiceClient();

  const [{ data: artists }, { data: inquiries }] = await Promise.all([
    supabase.from("dj_profiles").select("id, name, performer_type").eq("is_active", true).order("name"),
    supabase.from("inquiries").select("id, event_type, event_date, contact, event_sections")
      .order("created_at", { ascending: false }).limit(50),
  ]);

  // ?inquiry= ile gelindiyse talebi booking taslağına dönüştür
  let prefill: Record<string, unknown> | undefined;
  if (inquiryId) {
    const { data: inq } = await supabase.from("inquiries").select("*").eq("id", inquiryId).single();
    if (inq) {
      const ab = inq.event_sections?.artistBooking as Record<string, string | boolean> | undefined;
      const contact = inq.contact ?? {};
      const lines: string[] = [];
      if (ab) {
        const push = (label: string, v: unknown) => {
          if (v !== undefined && v !== null && v !== "") lines.push(`${label}: ${v === true ? "Evet" : v === false ? "Hayır" : v}`);
        };
        push("Performans tipi", ab.performanceType);
        push("Set süresi", ab.setDuration);
        push("Kapı açılış", ab.doorOpenTime);
        push("Sahne saati", ab.stageTime);
        push("Curfew", ab.curfew);
        push("Açılış DJ", ab.openingDj);
        push("Kapanış DJ", ab.closingDj);
        push("Diğer sanatçılar", ab.otherPerformers);
        push("Biletli", ab.isTicketed === "yes" ? "Evet" : ab.isTicketed === "no" ? "Hayır" : "");
        push("Bilet fiyatı", ab.ticketPrice);
        push("Kapasite", ab.venueCapacity);
        push("Sponsorlar", ab.sponsors);
        push("NOQT ekipmanı istiyor", ab.wantsNoqtEquipment === "yes" ? "Evet" : ab.wantsNoqtEquipment === "no" ? "Hayır" : "");
        push("Ekipman notu", ab.equipmentNotes);
        push("Müşteri bütçesi", ab.budget);
        push("Konaklama", ab.accommodation);
        push("Transfer", ab.transfer);
        push("Özel istekler", ab.specialRequests);
      }
      prefill = {
        inquiry_id: inq.id,
        artist_id: (ab?.artistId as string) ?? null,
        client_name: [contact.name, contact.surname].filter(Boolean).join(" "),
        client_email: contact.email ?? null,
        client_phone: contact.phone ?? null,
        event_type: EXTRA_EVENT_LABELS[inq.event_type] ?? EVENT_TYPE_LABELS[inq.event_type] ?? inq.event_type ?? null,
        event_date: inq.event_date || null,
        venue_name: (ab?.venueName as string) || null,
        venue_city: (ab?.city as string) || null,
        travel_required: ab?.transfer === "yes" || (typeof ab?.transfer === "string" && ab.transfer.length > 0 && ab.transfer !== "no"),
        accommodation_required: ab?.accommodation === "yes" || (typeof ab?.accommodation === "string" && ab.accommodation.length > 0 && ab.accommodation !== "no"),
        internal_notes: lines.length > 0 ? `— Talep formundan aktarıldı —\n${lines.join("\n")}` : null,
      };
    }
  }

  // Liste için basitleştirilmiş inquiry seçenekleri
  const inquiryOptions = (inquiries ?? []).map((i) => ({
    id: i.id,
    name: [i.contact?.name, i.contact?.surname].filter(Boolean).join(" ") || "İsimsiz",
    event_type: i.event_type,
    event_date: i.event_date,
    email: i.contact?.email ?? null,
    phone: i.contact?.phone ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/bookings" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Bookings
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <h1 className="text-2xl font-semibold text-foreground">Teklif Oluştur</h1>
        {prefill && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
            Talepten aktarıldı
          </span>
        )}
      </div>
      <BookingForm artists={artists ?? []} inquiries={inquiryOptions} booking={prefill} />
    </div>
  );
}
