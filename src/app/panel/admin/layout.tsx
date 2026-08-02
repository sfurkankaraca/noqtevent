import { redirect } from "next/navigation";
import { getPanelUser } from "@/lib/panel/supabaseServer";
import { isPanelAdmin } from "@/lib/panel/adminAuth";
import PanelAdminSidebar from "./PanelAdminSidebar";

// noqt.events admin kabuğunun (src/app/admin/layout.tsx + AdminSidebar.tsx)
// /panel/admin için birebir karşılığı — sol kenar çubuğu + max-w ana kolon.
//
// Yetki kapısı: her /panel/admin/* sayfası zaten kendi başına
// getPanelUser()/isPanelAdmin() kontrolü yapıyor (sayfa kapıları KALDI,
// görev talimatı gereği) — burası ikinci, erken bir kapı: sidebar/kabuk
// render'ından ÖNCE yetkisiz kullanıcıyı yönlendirir (noqt.events'teki
// AdminLayout deseniyle aynı: layout kapıyı önce kapatır).
//
// Full-bleed notu: /panel/layout.tsx (DOKUNULMADI — görev kapsamı yalnız
// /panel/admin) tüm /panel altına ortalanmış max-w-3xl + padding'li bir
// <main> ve sabit bir üst çubuk (PanelNav) uyguluyor. O üst çubuğa
// dokunmadan noqt.events admin'indeki gibi geniş/sidebar'lı bir düzen
// kurabilmek için `relative left-1/2 w-screen -translate-x-1/2` ile o
// ata <main>'in ortalama/genişlik kısıtından "full-bleed" çıkıyoruz —
// zemin rengi (bg-[oklch(0.97_0.005_80)]) zaten ata div'den geliyor.
export default async function PanelAdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getPanelUser();
  if (!user) redirect("/panel/giris");
  if (!(await isPanelAdmin())) redirect("/panel");

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2">
      <div className="flex min-h-[70vh] lg:min-h-[calc(100vh-9rem)]">
        <PanelAdminSidebar />
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-5xl px-4 pb-6 sm:px-6 lg:px-8 lg:pb-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
