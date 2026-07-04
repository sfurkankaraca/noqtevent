"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteMemoryEvent } from "../actions";

export default function DeleteEventButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!confirm(`"${title}" etkinliğini ve tüm yüklemelerini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;
    setPending(true);
    setError(null);
    try {
      await deleteMemoryEvent(id);
      router.push("/admin/memory");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Silinemedi");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleDelete}
        disabled={pending}
        className="text-xs border border-red-200 text-red-600 px-3 py-1.5 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        {pending ? "Siliniyor…" : "Etkinliği Sil"}
      </button>
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}
