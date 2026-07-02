import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AdminSidebar from "./AdminSidebar";
import { isAdmin } from "@/lib/adminAuth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  if (!(await isAdmin())) redirect("/");

  return (
    <div className="min-h-screen flex bg-[oklch(0.97_0.005_80)]">
      <AdminSidebar />
      {/* Main — top padding on mobile for fixed header */}
      <main className="flex-1 overflow-auto pt-14 lg:pt-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
