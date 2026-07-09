import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import DeleteTestimonialButton from "./DeleteTestimonialButton";

export default async function TestimonialsAdminPage() {
  const supabase = createServiceClient();
  const { data: testimonials, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Yorumlar</h1>
          <p className="text-sm text-muted-foreground mt-1">Ana sayfada gösterilen müşteri yorumları</p>
        </div>
        <Link
          href="/admin/testimonials/yeni"
          className="inline-flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Yorum Ekle
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error.message}
          <p className="mt-1 text-xs">Migration çalıştırıldı mı? <code>supabase-migration-testimonials.sql</code></p>
        </div>
      )}

      {!testimonials?.length && !error && (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <p className="text-4xl mb-4">💬</p>
          <p className="text-foreground font-medium">Henüz yorum yok</p>
          <p className="text-sm text-muted-foreground mt-1">İlk yorumu eklemek için yukarıdaki butona tıkla.</p>
        </div>
      )}

      {testimonials && testimonials.length > 0 && (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground tracking-wide">YORUM</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">KİŞİ</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">PUAN</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">SIРА</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">DURUM</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {testimonials.map((t) => (
                <tr key={t.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-5 py-3.5 max-w-xs">
                    <p className="text-foreground text-xs line-clamp-2 leading-relaxed">"{t.quote}"</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold flex-shrink-0 ${t.color} ${t.dark ? "text-white" : "text-foreground"}`}>
                        {t.initials ?? t.name?.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-foreground">{t.name}</p>
                        {t.event && <p className="text-[10px] text-muted-foreground">{t.event}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">{"★".repeat(t.rating ?? 5)}</td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">{t.sort_order}</td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                      t.is_active
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-secondary text-muted-foreground border-border"
                    }`}>
                      {t.is_active ? "Aktif" : "Pasif"}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <Link href={`/admin/testimonials/${t.id}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                        Düzenle
                      </Link>
                      <DeleteTestimonialButton id={t.id} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
