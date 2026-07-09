import type { ChecklistCategory } from "@/lib/checklistTemplate";

export type ChecklistItem = {
  id: string;
  category: ChecklistCategory;
  title: string;
  description: string | null;
  is_done: boolean;
  assigned_to: string | null;
  due_date: string | null;
};

export type ChecklistComment = {
  id: string;
  item_id: string;
  author_type: string;
  author_name: string | null;
  body: string;
};

export type ScheduleItem = {
  id: string;
  time: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
};

// Son tarih durumu: gecikmiş (kırmızı) / 7 gün içinde (amber) / normal
export function dueStatus(item: ChecklistItem): "overdue" | "soon" | "ok" {
  if (item.is_done || !item.due_date) return "ok";
  const today = new Date().toISOString().slice(0, 10);
  if (item.due_date < today) return "overdue";
  const in7 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  if (item.due_date <= in7) return "soon";
  return "ok";
}

export function daysOverdue(dueDate: string): number {
  return Math.floor((Date.now() - new Date(dueDate).getTime()) / (24 * 60 * 60 * 1000));
}

export function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}
