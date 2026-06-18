import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "▦" },
  { href: "/admin/songs", label: "Şarkılar", icon: "♪" },
  { href: "/admin/inquiries", label: "Talepler", icon: "📋" },
  { href: "/admin/users", label: "Kullanıcılar", icon: "👤" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="min-h-screen flex bg-[oklch(0.97_0.005_80)]">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-foreground text-background flex flex-col">
        <div className="px-5 py-6 border-b border-white/10">
          <p className="text-xs tracking-[0.25em] uppercase opacity-50 mb-1">Admin</p>
          <p className="font-semibold text-sm">NOQT Studio</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/10 flex items-center gap-3">
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
          <p className="text-xs text-white/50">Hesabım</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
