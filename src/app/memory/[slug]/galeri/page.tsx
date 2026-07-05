import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createServiceClient } from "@/lib/supabase";
import { mediaProxyUrl } from "@/lib/media";
import GalleryClient from "./GalleryClient";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ k?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase.from("memory_events").select("title").eq("slug", slug).single();
  if (!data) return { title: "Galeri" };
  return { title: `${data.title} — Galeri` };
}

export default async function GalleryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { k } = await searchParams;
  const supabase = createServiceClient();

  const { data: event } = await supabase
    .from("memory_events")
    .select("id, slug, title, gallery_visibility, gallery_token")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!event) notFound();

  // Özel galeri: yalnızca gelin & damat'a verilen ?k=<gallery_token> linkiyle açılır
  if (event.gallery_visibility === "couple" && (!k || k !== event.gallery_token)) {
    return (
      <div className="min-h-screen bg-[#0d0d0d] text-white flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-white/8 flex items-center justify-center mx-auto mb-5 text-white/40">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h1 className="text-xl font-light mb-2" style={{ fontFamily: "Georgia, serif" }}>Bu galeri özeldir</h1>
          <p className="text-white/40 text-sm leading-relaxed">
            Fotoğraflar yalnızca çift tarafından görüntülenebilir. Katkınız için teşekkürler — yüklediğiniz anılar onlara ulaştı. 💛
          </p>
        </div>
      </div>
    );
  }

  const { data: uploads } = await supabase
    .from("memory_uploads")
    .select("*")
    .eq("event_id", event.id)
    .order("created_at", { ascending: false });

  // Görüntüleme URL'i proxy üzerinden (Türkiye ISP engeli); indirmeler file_url ile server-side
  const withProxy = (uploads ?? []).map((u) => ({
    ...u,
    display_url: u.file_path ? mediaProxyUrl(u.file_path) : u.file_url,
  }));

  return <GalleryClient event={event} uploads={withProxy} />;
}
