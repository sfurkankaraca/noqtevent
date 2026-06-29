import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";

export default async function DavetiyelerPage() {
  const supabase = createServiceClient();
  const { data: invitations } = await supabase
    .from("invitations")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-medium text-foreground">Dijital Davetiyeler</h1>
          <p className="text-muted-foreground text-sm mt-1">{invitations?.length ?? 0} davetiye</p>
        </div>
        <Link
          href="/admin/davetiyeler/new"
          className="bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Yeni Davetiye
        </Link>
      </div>

      <div className="space-y-3">
        {(!invitations || invitations.length === 0) && (
          <div className="text-center py-20 text-muted-foreground text-sm border border-dashed border-border rounded-2xl">
            Henüz davetiye yok. İlk daveti oluşturun.
          </div>
        )}
        {invitations?.map((inv) => {
          const date = inv.wedding_date
            ? new Date(inv.wedding_date).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })
            : null;
          return (
            <div key={inv.id} className="bg-white border border-border rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <p className="font-medium text-foreground">{inv.bride_name} &amp; {inv.groom_name}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium tracking-wide ${inv.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {inv.is_active ? "Aktif" : "Pasif"}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                    {inv.template}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-muted-foreground">/{inv.slug}</p>
                  {date && <p className="text-xs text-muted-foreground">· {date}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={`/davetiye/${inv.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs border border-border px-3 py-1.5 rounded-full text-muted-foreground hover:border-foreground/40 transition-colors"
                >
                  Önizle ↗
                </a>
                <Link
                  href={`/admin/davetiyeler/${inv.id}/rsvp`}
                  className="text-xs border border-border px-3 py-1.5 rounded-full text-muted-foreground hover:border-foreground/40 transition-colors"
                >
                  RSVP
                </Link>
                <Link
                  href={`/admin/davetiyeler/${inv.id}/edit`}
                  className="text-xs bg-foreground text-background px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
                >
                  Düzenle
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
