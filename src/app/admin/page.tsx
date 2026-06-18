import { createServiceClient } from "@/lib/supabase";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = createServiceClient();

  const [
    { count: songCount },
    { count: inquiryCount },
    { count: djCount },
    { count: partnerCount },
    { count: assetCount },
  ] = await Promise.all([
    supabase.from("songs").select("*", { count: "exact", head: true }),
    supabase.from("inquiries").select("*", { count: "exact", head: true }),
    supabase.from("dj_profiles").select("*", { count: "exact", head: true }),
    supabase.from("partner_profiles").select("*", { count: "exact", head: true }),
    supabase.from("site_assets").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Şarkı", value: songCount ?? 0, href: "/admin/songs", icon: "♪" },
    { label: "DJ", value: djCount ?? 0, href: "/admin/djler", icon: "🎧" },
    { label: "Ortak", value: partnerCount ?? 0, href: "/admin/ortaklar", icon: "🤝" },
    { label: "Görsel", value: assetCount ?? 0, href: "/admin/gorseller", icon: "🖼" },
    { label: "Talep", value: inquiryCount ?? 0, href: "/admin/inquiries", icon: "📋" },
  ];

  // Recent inquiries
  const { data: recentInquiries } = await supabase
    .from("inquiries")
    .select("id, created_at, event_type, contact")
    .order("created_at", { ascending: false })
    .limit(5);

  const EVENT_LABELS: Record<string, string> = {
    wedding: "Düğün", "kina-gecesi": "Kına Gecesi", corporate: "Kurumsal",
    opening: "Açılış", "brand-launch": "Marka Lansmanı", "private-party": "Özel Parti",
    cocktail: "Kokteyl", sunset: "Sunset Session", "after-party": "After Party",
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">NOQT Admin Paneli</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-white rounded-2xl border border-border p-5 hover:border-foreground/20 transition-colors"
          >
            <p className="text-2xl mb-2">{s.icon}</p>
            <p className="text-3xl font-semibold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4">Hızlı Erişim</h2>
          <div className="space-y-2">
            {[
              { href: "/admin/songs/new", label: "+ Yeni Şarkı" },
              { href: "/admin/djler/new", label: "+ Yeni DJ" },
              { href: "/admin/ortaklar/new", label: "+ Yeni Ortak" },
              { href: "/admin/gorseller", label: "Görsel Yükle" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-foreground hover:bg-secondary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent inquiries */}
        <div className="bg-white rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Son Talepler</h2>
            <Link href="/admin/inquiries" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Tümü →
            </Link>
          </div>
          {!recentInquiries?.length ? (
            <p className="text-sm text-muted-foreground">Henüz talep yok</p>
          ) : (
            <div className="space-y-3">
              {recentInquiries.map((inq) => (
                <div key={inq.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {inq.contact?.name} {inq.contact?.surname}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {EVENT_LABELS[inq.event_type] ?? inq.event_type}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(inq.created_at).toLocaleDateString("tr-TR")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
