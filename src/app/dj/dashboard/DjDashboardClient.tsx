"use client";

import { useState, useTransition } from "react";
import { UserButton } from "@clerk/nextjs";
import RiderBuilder, { normalizeRiderItems, type RiderItem } from "@/components/admin/RiderBuilder";
import { updateMyBusyDates, updateMyRider } from "./actions";

const STATUS_LABEL: Record<string, string> = {
  draft: "Taslak", offer_sent: "Teklif Gönderildi", confirmed: "Onaylandı",
  contracted: "Sözleşme İmzalandı", deposit_paid: "Kapora Alındı",
  full_paid: "Tam Ödeme Alındı", completed: "Tamamlandı",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Booking = Record<string, any>;

export default function DjDashboardClient({
  profile, upcoming, past,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: Record<string, any>;
  upcoming: Booking[];
  past: Booking[];
}) {
  const [tab, setTab] = useState<"bookings" | "musaitlik" | "rider">("bookings");
  const [busyDates, setBusyDates] = useState<string[]>(profile.busy_dates ?? []);
  const [busyInput, setBusyInput] = useState("");
  const [rider, setRider] = useState<RiderItem[]>(normalizeRiderItems(profile.rider ?? []));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);

  const addBusyDate = (date: string) => {
    if (date && !busyDates.includes(date)) setBusyDates((p) => [...p, date].sort());
    setBusyInput("");
  };
  const removeBusyDate = (date: string) => setBusyDates((p) => p.filter((d) => d !== date));

  const saveBusyDates = () => {
    setSaved(null);
    startTransition(async () => {
      await updateMyBusyDates(busyDates);
      setSaved("musaitlik");
    });
  };

  const saveRider = () => {
    setSaved(null);
    startTransition(async () => {
      await updateMyRider(rider);
      setSaved("rider");
    });
  };

  const tabCls = (t: string) =>
    `px-4 py-2 rounded-full text-sm font-medium transition-colors ${
      tab === t ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
    }`;

  return (
    <div className="min-h-screen bg-[oklch(0.97_0.005_80)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">Sanatçı Paneli</p>
            <h1 className="text-2xl font-semibold text-foreground">{profile.name}</h1>
          </div>
          <UserButton appearance={{ elements: { avatarBox: "w-9 h-9" } }} />
        </div>

        <div className="flex gap-2 bg-white rounded-full border border-border p-1.5 w-fit">
          <button onClick={() => setTab("bookings")} className={tabCls("bookings")}>Rezervasyonlarım</button>
          <button onClick={() => setTab("musaitlik")} className={tabCls("musaitlik")}>Müsaitlik</button>
          <button onClick={() => setTab("rider")} className={tabCls("rider")}>Teknik Rider</button>
        </div>

        {tab === "bookings" && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-3">Yaklaşan ({upcoming.length})</p>
              <div className="bg-white rounded-2xl border border-border divide-y divide-border">
                {upcoming.length === 0 ? (
                  <p className="p-8 text-center text-sm text-muted-foreground">Yaklaşan rezervasyon yok</p>
                ) : upcoming.map((b) => (
                  <div key={b.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{b.client_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {b.event_date ? new Date(b.event_date).toLocaleDateString("tr-TR") : "Tarih belirsiz"}
                        {b.venue_city ? ` · ${b.venue_city}` : ""}
                      </p>
                    </div>
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-secondary/60 text-muted-foreground shrink-0">
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {past.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-3">Geçmiş ({past.length})</p>
                <div className="bg-white rounded-2xl border border-border divide-y divide-border">
                  {past.map((b) => (
                    <div key={b.id} className="p-4 flex items-center justify-between gap-3 opacity-70">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{b.client_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {b.event_date ? new Date(b.event_date).toLocaleDateString("tr-TR") : "—"}
                        </p>
                      </div>
                      <span className="text-[11px] px-2.5 py-1 rounded-full bg-secondary/60 text-muted-foreground shrink-0">
                        {STATUS_LABEL[b.status] ?? b.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "musaitlik" && (
          <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
            <p className="text-sm font-semibold text-foreground">Dolu Tarihlerim</p>
            <p className="text-xs text-muted-foreground">
              Buraya eklediğiniz tarihlerde müsait olmadığınız otomatik olarak müşteri tekliflerine yansır.
            </p>
            <div className="flex flex-wrap gap-2">
              {busyDates.map((d) => (
                <span key={d} className="flex items-center gap-1.5 text-xs bg-secondary/60 px-3 py-1.5 rounded-full">
                  {new Date(d).toLocaleDateString("tr-TR")}
                  <button onClick={() => removeBusyDate(d)} className="opacity-60 hover:opacity-100">×</button>
                </span>
              ))}
              {busyDates.length === 0 && <p className="text-xs text-muted-foreground">Henüz dolu tarih eklenmedi.</p>}
            </div>
            <div className="flex gap-2">
              <input
                type="date" value={busyInput} onChange={(e) => setBusyInput(e.target.value)}
                className="px-3 py-2 rounded-xl border border-border bg-background text-sm"
              />
              <button
                onClick={() => addBusyDate(busyInput)} disabled={!busyInput}
                className="px-4 py-2 rounded-full border border-border text-sm hover:border-foreground/40 disabled:opacity-50"
              >
                + Ekle
              </button>
            </div>
            <button
              onClick={saveBusyDates} disabled={isPending}
              className="px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Kaydediliyor…" : "Kaydet"}
            </button>
            {saved === "musaitlik" && <p className="text-xs text-green-700">✓ Kaydedildi</p>}
          </div>
        )}

        {tab === "rider" && (
          <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
            <p className="text-sm font-semibold text-foreground">Teknik Rider</p>
            <RiderBuilder value={rider} onChange={setRider} compact />
            <button
              onClick={saveRider} disabled={isPending}
              className="px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {isPending ? "Kaydediliyor…" : "Kaydet"}
            </button>
            {saved === "rider" && <p className="text-xs text-green-700">✓ Kaydedildi</p>}
          </div>
        )}
      </div>
    </div>
  );
}
