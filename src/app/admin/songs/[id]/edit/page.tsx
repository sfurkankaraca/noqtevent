import { notFound } from "next/navigation";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase";
import SongForm from "../../SongForm";
import { upsertSong } from "../../actions";

export default async function EditSongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: song } = await supabase.from("songs").select("*").eq("id", id).single();

  if (!song) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/songs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Şarkılar
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <h1 className="text-2xl font-semibold text-foreground">{song.title}</h1>
      </div>
      <SongForm song={song} action={upsertSong} />
    </div>
  );
}
