"use server";

import { createServiceClient } from "@/lib/supabase";
import { requireMyArtistProfile } from "@/lib/artistAuth";
import { normalizeRiderItems, type RiderItem } from "@/lib/riderTypes";
import { revalidatePath } from "next/cache";

// Aşağıdaki action'lar profilId'yi client'tan ALMAZ — oturumdaki kullanıcının
// e-posta eşleşmesiyle bulunan kendi profili üzerinde çalışır. Böylece bir
// sanatçı başka bir sanatçının verisini güncelleyemez.

export async function updateMyBusyDates(dates: string[]) {
  const profile = await requireMyArtistProfile();
  const clean = Array.from(new Set(dates.filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)))).sort();

  const supabase = createServiceClient();
  const { error } = await supabase.from("dj_profiles").update({ busy_dates: clean }).eq("id", profile.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dj/dashboard");
}

export async function updateMyRider(items: RiderItem[]) {
  const profile = await requireMyArtistProfile();
  const clean = normalizeRiderItems(items);

  const supabase = createServiceClient();
  const { error } = await supabase.from("dj_profiles").update({ rider: clean }).eq("id", profile.id);
  if (error) throw new Error(error.message);
  revalidatePath("/dj/dashboard");
}
