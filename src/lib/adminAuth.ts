import { auth, currentUser } from "@clerk/nextjs/server";
import { ADMIN_EMAILS } from "@/lib/adminEmails";

export async function isAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const user = await currentUser();
  if (!user) return false;

  return user.emailAddresses.some((e) =>
    ADMIN_EMAILS.includes(e.emailAddress.toLowerCase())
  );
}

// Admin server action'ları ve API route'ları için zorunlu guard.
// Layout'taki kontrol server action çağrılarını KORUMAZ — her action bunu çağırmalı.
export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) {
    throw new Error("Yetkisiz erişim.");
  }
}
