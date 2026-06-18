import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import PostForm from "../../PostForm";
import { upsertPost } from "../../actions";

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: post } = await supabase.from("journal_posts").select("*").eq("id", id).single();
  if (!post) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/journal" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Journal
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <h1 className="text-2xl font-semibold text-foreground">{post.title}</h1>
      </div>
      <div className="bg-white rounded-2xl border border-border p-6">
        <PostForm post={post} action={upsertPost} />
      </div>
    </div>
  );
}
