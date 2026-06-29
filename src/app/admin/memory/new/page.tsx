import Link from "next/link";
import MemoryEventForm from "../MemoryEventForm";

export default function NewMemoryEventPage() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <Link href="/admin/memory" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Memory Drive
        </Link>
        <h1 className="text-2xl font-medium text-foreground mt-4">Yeni Etkinlik</h1>
      </div>
      <MemoryEventForm />
    </div>
  );
}
