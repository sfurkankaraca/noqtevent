import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase";
import InvitationForm from "../../InvitationForm";
import DeleteInvitationButton from "../../DeleteInvitationButton";

type Props = { params: Promise<{ id: string }> };

export default async function EditInvitationPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data: inv } = await supabase.from("invitations").select("*").eq("id", id).single();
  if (!inv) notFound();

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <Link href="/admin/davetiyeler" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Davetiyeler
          </Link>
          <h1 className="text-2xl font-medium text-foreground mt-4">
            {inv.bride_name} &amp; {inv.groom_name}
          </h1>
        </div>
        <div className="flex gap-2 mt-8 flex-wrap">
          <a
            href={`/davetiye/${inv.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs border border-border px-4 py-2 rounded-full text-muted-foreground hover:border-foreground/40 transition-colors"
          >
            Önizle ↗
          </a>
          {inv.memory_drive_url && (
            <a
              href={`${inv.memory_drive_url}/galeri`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs border border-border px-4 py-2 rounded-full text-muted-foreground hover:border-foreground/40 transition-colors"
            >
              📸 Galeri ↗
            </a>
          )}
          <DeleteInvitationButton id={id} />
        </div>
      </div>
      <InvitationForm invitation={inv} />
    </div>
  );
}
