import Link from "next/link";
import InvitationForm from "../InvitationForm";

export default function NewInvitationPage() {
  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <Link href="/admin/davetiyeler" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Davetiyeler
        </Link>
        <h1 className="text-2xl font-medium text-foreground mt-4">Yeni Davetiye</h1>
      </div>
      <InvitationForm />
    </div>
  );
}
