"use server";

import { requireAdmin } from "@/lib/adminAuth";
import { createServiceClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export type GoalPayload = {
  id?: string;
  year: number;
  metric: "revenue" | "bookings" | "custom";
  label?: string | null;
  target: number;
  manual_actual?: number | null;
};

export async function upsertGoal(payload: GoalPayload) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { id, ...data } = payload;
  if (id) {
    const { error } = await supabase.from("company_goals").update(data).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("company_goals").insert(data);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/admin/hedefler");
  revalidatePath("/admin");
}

export async function deleteGoal(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase.from("company_goals").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/hedefler");
  revalidatePath("/admin");
}

export type TaskPayload = {
  id?: string;
  title: string;
  category: string;
  recurrence: "once" | "monthly" | "yearly";
  due_date?: string | null;
  assigned_to?: string | null;
};

export async function upsertTask(payload: TaskPayload) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { id, ...data } = payload;
  if (id) {
    const { error } = await supabase.from("company_tasks").update(data).eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("company_tasks").insert(data);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/admin/hedefler");
  revalidatePath("/admin");
}

export async function deleteTask(id: string) {
  await requireAdmin();
  const supabase = createServiceClient();
  // Tekrarlayan görevlerde geçmiş dönem kayıtları korunur — arşivle; tek seferlikler silinir
  const { data: task } = await supabase.from("company_tasks").select("recurrence").eq("id", id).single();
  if (task?.recurrence === "once") {
    const { error } = await supabase.from("company_tasks").delete().eq("id", id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("company_tasks").update({ is_active: false }).eq("id", id);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/admin/hedefler");
  revalidatePath("/admin");
}

export async function toggleTaskDone(id: string, done: boolean) {
  await requireAdmin();
  const supabase = createServiceClient();
  const { error } = await supabase.from("company_tasks").update({ is_done: done }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/hedefler");
  revalidatePath("/admin");
}

export async function toggleTaskPeriod(taskId: string, period: string, done: boolean) {
  await requireAdmin();
  const supabase = createServiceClient();
  if (done) {
    const { error } = await supabase
      .from("company_task_completions")
      .upsert({ task_id: taskId, period }, { onConflict: "task_id,period" });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("company_task_completions")
      .delete()
      .eq("task_id", taskId)
      .eq("period", period);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/admin/hedefler");
  revalidatePath("/admin");
}
