import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";

export default async function MemoryAdminPage() {
  const supabase = createServiceClient();
  let { data: events, error } = await supabase
    .from("memory_events")
    .select("*, memory_uploads(count)")
    .order("created_at", { ascending: false });

  // memory_uploads join'i (count) bazı Supabase yapılandırmalarında hata verebilir —
  // basit select ile tekrar dene ki tek bir join hatası tüm listeyi kilitlemesin
  if (error) {
    const retry = await supabase
      .from("memory_events")
      .select("*")
      .order("created_at", { ascending: false });
    events = retry.data;
    error = retry.error;
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-medium text-foreground">Memory Drive</h1>
          <p className="text-muted-foreground text-sm mt-1">{events?.length ?? 0} etkinlik</p>
        </div>
        <Link
          href="/admin/memory/new"
          className="bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Yeni Etkinlik
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
          {error.message}
          <p className="mt-1 text-xs">
            Bu hata genelde <code>supabase-memory.sql</code> henüz çalıştırılmadığında veya
            Supabase env değişkenleri eksik olduğunda görülür.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {(!events || events.length === 0) && !error && (
          <div className="text-center py-20 text-muted-foreground text-sm border border-dashed border-border rounded-2xl">
            Henüz etkinlik yok.
          </div>
        )}
        {events?.map((ev) => {
          const uploadCount = Array.isArray(ev.memory_uploads) ? ev.memory_uploads[0]?.count ?? 0 : 0;
          return (
            <div key={ev.id} className="bg-white border border-border rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <p className="font-medium text-foreground">{ev.title}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ev.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {ev.is_active ? "Aktif" : "Pasif"}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-sm text-muted-foreground">/memory/{ev.slug}</p>
                  <p className="text-xs text-muted-foreground">· {uploadCount} yükleme</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={`/memory/${ev.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs border border-border px-3 py-1.5 rounded-full text-muted-foreground hover:border-foreground/40 transition-colors"
                >
                  Upload ↗
                </a>
                <a
                  href={`/memory/${ev.slug}/galeri`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs border border-border px-3 py-1.5 rounded-full text-muted-foreground hover:border-foreground/40 transition-colors"
                >
                  Galeri ↗
                </a>
                <Link
                  href={`/admin/memory/${ev.id}`}
                  className="text-xs bg-foreground text-background px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
                >
                  Yönet
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
