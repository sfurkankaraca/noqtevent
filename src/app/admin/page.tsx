import { createServiceClient } from "@/lib/supabase";
import Link from "next/link";
import { EVENT_TYPE_LABELS as EVENT_LABELS } from "@/lib/eventTypeLabels";
import { getYearMetrics } from "@/lib/companyMetrics";

export default async function AdminDashboard() {
  const supabase = createServiceClient();

  const [
    { count: songCount },
    { count: inquiryCount },
    { count: djCount },
    { count: partnerCount },
    { count: assetCount },
    { count: journalCount },
    { count: messageCount },
    { count: newInquiryCount },
    { count: testimonialCount },
  ] = await Promise.all([
    supabase.from("songs").select("*", { count: "exact", head: true }),
    supabase.from("inquiries").select("*", { count: "exact", head: true }),
    supabase.from("dj_profiles").select("*", { count: "exact", head: true }),
    supabase.from("partner_profiles").select("*", { count: "exact", head: true }),
    supabase.from("site_assets").select("*", { count: "exact", head: true }),
    supabase.from("journal_posts").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("contact_messages").select("*", { count: "exact", head: true }),
    supabase.from("inquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("testimonials").select("*", { count: "exact", head: true }).eq("is_active", true),
  ]);

  const stats = [
    { label: "Talep", value: inquiryCount ?? 0, href: "/admin/inquiries", icon: "📋", badge: newInquiryCount ?? 0 },
    { label: "Mesaj", value: messageCount ?? 0, href: "/admin/mesajlar", icon: "💬", badge: 0 },
    { label: "DJ", value: djCount ?? 0, href: "/admin/djler", icon: "🎧", badge: 0 },
    { label: "Ortak", value: partnerCount ?? 0, href: "/admin/ortaklar", icon: "🤝", badge: 0 },
    { label: "Journal", value: journalCount ?? 0, href: "/admin/journal", icon: "✍", badge: 0 },
    { label: "Şarkı", value: songCount ?? 0, href: "/admin/songs", icon: "♪", badge: 0 },
    { label: "Görsel", value: assetCount ?? 0, href: "/admin/gorseller", icon: "🖼", badge: 0 },
    { label: "Yorum", value: testimonialCount ?? 0, href: "/admin/testimonials", icon: "💬", badge: 0 },
    { label: "Davetiye", value: 0, href: "/admin/davetiyeler", icon: "💌", badge: 0 },
    { label: "Memory Drive", value: 0, href: "/admin/memory", icon: "📸", badge: 0 },
  ];

  // Recent inquiries
  const { data: recentInquiries } = await supabase
    .from("inquiries")
    .select("id, created_at, event_type, contact")
    .order("created_at", { ascending: false })
    .limit(5);

  // Hedef kokpiti özeti — company_goals tablosu henüz yoksa sessizce gizlenir
  const year = new Date().getFullYear();
  const monthPeriod = `${year}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  let goalSummary: { label: string; pct: number; actual: number; target: number; isMoney: boolean } | null = null;
  let goalsTableExists = false;
  let pendingTaskCount = 0;
  try {
    const [{ data: goals, error: goalsError }, metrics, { data: tasks }, { data: completions }] = await Promise.all([
      supabase.from("company_goals").select("*").eq("year", year).order("created_at").limit(1),
      getYearMetrics(year),
      supabase.from("company_tasks").select("id, recurrence, is_done, due_date").eq("is_active", true),
      supabase.from("company_task_completions").select("task_id, period").eq("period", monthPeriod),
    ]);
    goalsTableExists = !goalsError;
    const g = goals?.[0];
    if (g) {
      const actual = g.metric === "revenue" ? metrics.revenueTotal
        : g.metric === "bookings" ? metrics.bookingsTotal
        : Number(g.manual_actual) || 0;
      goalSummary = {
        label: g.metric === "revenue" ? "Ciro hedefi" : g.metric === "bookings" ? "Booking hedefi" : g.label ?? "Hedef",
        pct: Math.min(100, Math.round((actual / (Number(g.target) || 1)) * 100)),
        actual,
        target: Number(g.target),
        isMoney: g.metric === "revenue",
      };
    }
    pendingTaskCount = (tasks ?? []).filter((t) =>
      t.recurrence === "monthly" ? !(completions ?? []).some((c) => c.task_id === t.id) :
      t.recurrence === "once" ? !t.is_done : false
    ).length;
  } catch {
    // migration çalıştırılmamış — kart gösterilmez
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">NOQT Admin Paneli</p>
      </div>

      {/* Hedef kokpiti özeti */}
      {goalsTableExists && (
        <Link href="/admin/hedefler"
          className="block bg-white rounded-2xl border border-border p-5 hover:border-foreground/20 transition-colors">
          {goalSummary ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">🎯 {goalSummary.label} — {year}</p>
                <p className="text-xs text-muted-foreground">
                  {pendingTaskCount > 0 && `${pendingTaskCount} bekleyen şirket görevi · `}Kokpite git →
                </p>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-semibold text-foreground tabular-nums">
                  {goalSummary.actual.toLocaleString("tr-TR")}{goalSummary.isMoney ? " ₺" : ""}
                </p>
                <p className="text-sm text-muted-foreground tabular-nums">
                  / {goalSummary.target.toLocaleString("tr-TR")}{goalSummary.isMoney ? " ₺" : ""} · %{goalSummary.pct}
                </p>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-foreground transition-all" style={{ width: `${goalSummary.pct}%` }} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground">🎯 {year} için henüz hedef belirlenmedi</p>
              <p className="text-xs text-muted-foreground">Hedef belirle →</p>
            </div>
          )}
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-white rounded-2xl border border-border p-5 hover:border-foreground/20 transition-colors relative"
          >
            {s.badge > 0 && (
              <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {s.badge}
              </span>
            )}
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
              { href: "/admin/djler/new", label: "+ Yeni DJ" },
              { href: "/admin/ortaklar/new", label: "+ Yeni Ortak" },
              { href: "/admin/journal/new", label: "+ Yeni Yazı" },
              { href: "/admin/konseptler/new", label: "+ Yeni Konsept" },
              { href: "/admin/testimonials/yeni", label: "+ Yeni Yorum" },
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
