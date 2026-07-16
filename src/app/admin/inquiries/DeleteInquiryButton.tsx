"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteInquiry } from "./actions";

export default function DeleteInquiryButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm(`"${name}" talebi silinsin mi? Bu işlem geri alınamaz.`)) return;
        startTransition(async () => {
          await deleteInquiry(id);
          router.refresh();
        });
      }}
      className="text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
    >
      {isPending ? "Siliniyor…" : "Sil"}
    </button>
  );
}
