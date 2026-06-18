import Link from "next/link";
import DjForm from "../DjForm";

export default function NewDjPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/djler" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← DJ&apos;ler
        </Link>
        <span className="text-muted-foreground/40">/</span>
        <h1 className="text-2xl font-semibold text-foreground">Yeni DJ</h1>
      </div>
      <DjForm />
    </div>
  );
}
