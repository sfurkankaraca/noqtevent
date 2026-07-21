import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// Server-side client with service role (bypasses RLS — use only in server actions/routes)
export function createServiceClient() {
  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

// Supabase/PostgREST projelerinde "Max Rows" ayarı (varsayılan 1000) her isteği
// sunucu tarafında keser — istemcideki .limit() bunu aşamaz. Sayfalarken bu
// sınırı .range() ile döngüleyerek aşar. Dashboard'da Max Rows yükseltilse bile
// zararsız (tek sayfada biter).
export async function fetchAllRows<T>(
  queryFactory: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000
): Promise<T[]> {
  const all: T[] = [];
  let from = 0;
  for (;;) {
    const { data, error } = await queryFactory(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return all;
}
