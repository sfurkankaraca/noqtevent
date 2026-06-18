"use client";

import { deleteConcept } from "./actions";

export default function DeleteConceptButton({ id, name }: { id: string; name: string }) {
  return (
    <button
      onClick={async () => {
        if (!confirm(`"${name}" konseptini silmek istediğine emin misin?`)) return;
        const fd = new FormData();
        fd.append("id", id);
        await deleteConcept(fd);
      }}
      className="text-xs text-red-400 hover:text-red-600 transition-colors cursor-pointer"
    >
      Sil
    </button>
  );
}
