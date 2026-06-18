import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import DeletePostButton from "./DeletePostButton";

export default async function AdminJournalPage() {
  const supabase = createServiceClient();
  const { data: posts, error } = await supabase
    .from("journal_posts")
    .select("id, slug, title, category, is_published, is_featured, published_at, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Journal</h1>
          <p className="text-sm text-muted-foreground mt-1">Blog yazıları ve makaleler</p>
        </div>
        <Link
          href="/admin/journal/new"
          className="bg-foreground text-background px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
        >
          + Yeni Yazı
        </Link>
      </div>

      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm">
          {error.message} — supabase-migration-journal.sql çalıştırıldı mı?
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {!posts?.length && !error ? (
          <div className="p-12 text-center">
            <p className="text-4xl mb-4">📝</p>
            <p className="text-foreground font-medium">Henüz yazı yok</p>
            <Link href="/admin/journal/new" className="text-sm text-muted-foreground hover:text-foreground mt-2 inline-block">
              İlk yazıyı ekle →
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground tracking-wide">BAŞLIK</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide hidden md:table-cell">KATEGORİ</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide">DURUM</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground tracking-wide hidden md:table-cell">TARİH</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {posts?.map((post) => (
                <tr key={post.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-foreground">{post.title}</p>
                    <p className="text-xs text-muted-foreground">{post.slug}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground hidden md:table-cell">
                    {post.category ?? "—"}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${post.is_published ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                        {post.is_published ? "Yayında" : "Taslak"}
                      </span>
                      {post.is_featured && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Öne çıkan
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground hidden md:table-cell">
                    {new Date(post.created_at).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-4 py-3.5 text-right whitespace-nowrap">
                    <Link
                      href={`/admin/journal/${post.id}/edit`}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors mr-3"
                    >
                      Düzenle
                    </Link>
                    <DeletePostButton id={post.id} title={post.title} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
