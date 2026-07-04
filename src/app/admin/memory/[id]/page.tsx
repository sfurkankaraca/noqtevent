import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase";
import MemoryEventForm from "../MemoryEventForm";
import AdminGallery from "./AdminGallery";
import DeleteEventButton from "./DeleteEventButton";

type Props = { params: Promise<{ id: string }> };

export default async function MemoryEventAdminPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [{ data: ev }, { data: uploads }] = await Promise.all([
    supabase.from("memory_events").select("*").eq("id", id).single(),
    supabase.from("memory_uploads").select("*").eq("event_id", id).order("created_at", { ascending: false }),
  ]);

  if (!ev) notFound();

  const images = (uploads ?? []).filter((u) => u.file_type === "image");
  const videos = (uploads ?? []).filter((u) => u.file_type === "video");

  const uploadLink = `https://www.noqt.events/memory/${ev.slug}`;
  const galleryLink = `https://www.noqt.events/memory/${ev.slug}/galeri`;

  return (
    <div className="p-8 max-w-5xl space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/admin/memory" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Memory Drive
          </Link>
          <h1 className="text-2xl font-medium text-foreground mt-4">{ev.title}</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {(uploads ?? []).length} yükleme · {images.length} fotoğraf · {videos.length} video
          </p>
        </div>
        <div className="flex gap-2 mt-8">
          <a href={galleryLink} target="_blank" rel="noopener noreferrer"
            className="text-xs border border-border px-3 py-1.5 rounded-full text-muted-foreground hover:border-foreground/40 transition-colors">
            Galeri ↗
          </a>
          <a href={uploadLink} target="_blank" rel="noopener noreferrer"
            className="text-xs border border-border px-3 py-1.5 rounded-full text-muted-foreground hover:border-foreground/40 transition-colors">
            Upload Sayfası ↗
          </a>
        </div>
      </div>

      {/* QR + Link paylaşım */}
      <div className="bg-white border border-border rounded-2xl p-6">
        <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-3">Misafirlerle Paylaş</p>
        <div className="flex items-center gap-3">
          <code className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm font-mono text-foreground break-all">
            {uploadLink}
          </code>
          <a
            href={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(uploadLink)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-xs bg-foreground text-background px-4 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            QR İndir
          </a>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Bu linki veya QR kodu misafirlerinizle paylaşın — hesap gerekmez.</p>
      </div>

      {/* Yüklemeler */}
      {(uploads ?? []).length > 0 ? (
        <AdminGallery uploads={uploads ?? []} />
      ) : (
        <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-2xl">
          Henüz yükleme yapılmadı.
        </div>
      )}

      {/* Etkinlik düzenleme */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-foreground">Etkinlik Ayarları</p>
          <DeleteEventButton id={ev.id} title={ev.title} />
        </div>
        <MemoryEventForm event={ev} />
      </div>
    </div>
  );
}
