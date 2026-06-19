import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase";
import TestimonialForm from "../TestimonialForm";

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data } = await supabase.from("testimonials").select("*").eq("id", id).single();
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-foreground">Yorumu Düzenle</h1>
      <TestimonialForm testimonial={data} />
    </div>
  );
}
