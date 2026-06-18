import { createServiceClient } from "@/lib/supabase";
import Link from "next/link";

export default async function AdminDashboard() {
  const supabase = createServiceClient();

  const [{ count: songCount }, { count: inquiryCount }] = await Promise.all([
    supabase.from("songs").select("*", { count: "exact", head: true }),
    supabase.from("inquiries").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Şarkı", value: songCount ?? 0, href: "/admin/songs", icon: "♪" },
    { label: "Talep", value: inquiryCount ?? 0, href: "/admin/inquiries", icon: "📋" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">NOQT Admin Paneli</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {stats.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="bg-white rounded-2xl border border-border p-6 hover:border-foreground/20 transition-colors"
          >
            <p className="text-3xl mb-3">{s.icon}</p>
            <p className="text-3xl font-semibold text-foreground">{s.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="font-semibold text-foreground mb-4">Hızlı Erişim</h2>
        <div className="space-y-2">
          <Link
            href="/admin/songs/new"
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity w-fit"
          >
            + Yeni Şarkı Ekle
          </Link>
        </div>
      </div>
    </div>
  );
}
