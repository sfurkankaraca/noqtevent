"use client";

import { deletePartner } from "./actions";

export default function DeletePartnerButton({ id, name }: { id: string; name: string }) {
  return (
    <form action={deletePartner}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm(`${name} silinsin mi?`)) e.preventDefault();
        }}
        className="px-3 py-2 rounded-xl text-xs border border-border text-red-500 hover:bg-red-50 transition-colors"
      >
        Sil
      </button>
    </form>
  );
}
