"use client";

import { deleteDj } from "./actions";

export default function DeleteDjButton({ id, name }: { id: string; name: string }) {
  return (
    <form action={deleteDj}>
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
