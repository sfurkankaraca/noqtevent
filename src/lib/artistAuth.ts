import { auth, currentUser } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase";

// Sanatçı hesabı Clerk'e kayıtlı bir gerçek kullanıcı değil; e-posta eşleşmesiyle
// dj_profiles kaydına bağlanır (admin paneldeki ADMIN_EMAILS deseniyle aynı mantık).
export async function getMyArtistProfile() {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  const emails = user?.emailAddresses?.map((e) => e.emailAddress.toLowerCase()) ?? [];
  if (emails.length === 0) return null;

  const supabase = createServiceClient();
  const { data } = await supabase
    .from("dj_profiles")
    .select("*")
    .in("email", emails)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

// Server action'larda kimlik doğrulama + profil sahipliği zorunlu kılmak için
export async function requireMyArtistProfile() {
  const profile = await getMyArtistProfile();
  if (!profile) throw new Error("Yetkisiz erişim — sanatçı profili bulunamadı.");
  return profile;
}
