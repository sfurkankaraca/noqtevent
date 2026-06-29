"use client";

import { useTransition } from "react";
import { deleteInvitation } from "./actions";

export default function DeleteInvitationButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Davetiyeyi kalıcı olarak sil?")) return;
    startTransition(() => deleteInvitation(id));
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-xs border border-red-200 text-red-500 px-4 py-2 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
    >
      {pending ? "Siliniyor…" : "Sil"}
    </button>
  );
}
