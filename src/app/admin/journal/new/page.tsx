import Link from "next/link";
import PostForm from "../PostForm";
import { upsertPost } from "../actions";

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/journal" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Journal
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <h1 className="text-2xl font-semibold text-foreground">Yeni Yazı</h1>
      </div>
      <div className="bg-white rounded-2xl border border-border p-6">
        <PostForm action={upsertPost} />
      </div>
    </div>
  );
}
