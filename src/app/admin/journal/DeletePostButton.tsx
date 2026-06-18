"use client";

import { deletePost } from "./actions";

export default function DeletePostButton({ id, title }: { id: string; title: string }) {
  return (
    <button
      onClick={async () => {
        if (!confirm(`"${title}" yazısını silmek istediğine emin misin?`)) return;
        const fd = new FormData();
        fd.append("id", id);
        await deletePost(fd);
      }}
      className="text-xs text-red-400 hover:text-red-600 transition-colors cursor-pointer"
    >
      Sil
    </button>
  );
}
