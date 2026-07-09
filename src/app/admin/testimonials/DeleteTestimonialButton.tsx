"use client";

import { deleteTestimonial } from "./actions";

export default function DeleteTestimonialButton({ id }: { id: string }) {
  return (
    <form action={deleteTestimonial}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        onClick={(e) => {
          if (!confirm("Bu yorumu sil?")) e.preventDefault();
        }}
        className="text-xs text-red-500 hover:text-red-700 transition-colors"
      >
        Sil
      </button>
    </form>
  );
}
