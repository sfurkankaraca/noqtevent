import Link from "next/link";
import Image from "next/image";
import { createServiceClient } from "@/lib/supabase";
import { deletePartner } from "./actions";

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  approved: { label: "Onaylandı", cls: "bg-green-100 text-green-700" },
  pending: { label: "Bekliyor", cls: "bg-yellow-100 text-yellow-700" },
  rejected: { label: "Reddedildi", cls: "bg-red-100 text-red-700" },
};

export default async function PartnerlerPage() {
  const supabase = createServiceClient();
  const { data: partners, error } = await supabase
    .from("partner_profiles")
    .select("*")
    .order("created_at", { ascending: false });

  const pendingCount = partners?.filter((p) => p.application_status === "pending").length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Partnerler</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hizmet ortaklarını yönet
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                {pendingCount} bekleyen başvuru
              </span>
            )}
          </p>
        </div>
        <Link
          href="/admin/partnerler/new"
          className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Yeni Partner
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error.message}</div>
      )}

      {!partners?.length && !error && (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <p className="text-4xl mb-4">🤝</p>
          <p className="text-foreground font-medium">Henüz partner eklenmedi</p>
          <Link href="/admin/partnerler/new" className="mt-4 inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
            İlk Partneri Ekle
          </Link>
        </div>
      )}

      {partners && partners.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map((p) => {
            const statusInfo = STATUS_LABELS[p.application_status ?? "approved"];
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-border overflow-hidden">
                {/* Logo / photo strip */}
                <div className="h-40 bg-secondary/30 relative flex items-center justify-center">
                  {p.photos?.[0] ? (
                    <Image src={p.photos[0]} alt={p.business_name} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="text-4xl">🤝</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                  {/* Logo overlay */}
                  {p.logo_url && (
                    <div className="absolute bottom-3 left-3 w-12 h-12 rounded-lg bg-white border border-white/60 overflow-hidden">
                      <Image src={p.logo_url} alt="logo" fill className="object-contain p-1" unoptimized />
                    </div>
                  )}
                  <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${p.is_active ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"}`}>
                      {p.is_active ? "Aktif" : "Pasif"}
                    </span>
                    {p.application_status !== "approved" && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusInfo.cls}`}>{statusInfo.label}</span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-foreground">{p.business_name}</h3>
                    {p.city && <p className="text-xs text-muted-foreground">📍 {p.city}</p>}
                  </div>

                  {p.category?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.category.slice(0, 3).map((cat: string) => (
                        <span key={cat} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-foreground">{cat}</span>
                      ))}
                      {p.category.length > 3 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">+{p.category.length - 3}</span>}
                    </div>
                  )}

                  {p.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                  )}

                  <div className="flex items-center gap-2 pt-1 border-t border-border">
                    <Link href={`/admin/partnerler/${p.id}/edit`}
                      className="flex-1 text-center py-2 rounded-xl text-xs font-medium border border-border hover:bg-secondary transition-colors">
                      Düzenle
                    </Link>
                    <form action={deletePartner}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="px-3 py-2 rounded-xl text-xs text-red-500 hover:bg-red-50 transition-colors border border-transparent hover:border-red-200">
                        Sil
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
