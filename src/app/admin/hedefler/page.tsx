import { createServiceClient } from "@/lib/supabase";
import { getYearMetrics } from "@/lib/companyMetrics";
import GoalsCockpit from "./GoalsCockpit";

export default async function GoalsPage({ searchParams }: { searchParams?: Promise<{ yil?: string }> }) {
  const { yil } = (await searchParams) ?? {};
  const currentYear = new Date().getFullYear();
  const year = Number(yil) || currentYear;

  const supabase = createServiceClient();
  const monthPeriod = `${year}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const yearPeriod = String(year);

  const [metrics, { data: goals }, { data: tasks }, { data: completions }] = await Promise.all([
    getYearMetrics(year),
    supabase.from("company_goals").select("*").eq("year", year).order("created_at"),
    supabase.from("company_tasks").select("*").eq("is_active", true).order("created_at"),
    supabase.from("company_task_completions").select("task_id, period").in("period", [monthPeriod, yearPeriod]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Hedefler & Şirket Görevleri</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Yıllık hedefler gerçek tahsilat ve booking verisinden otomatik takip edilir.
        </p>
      </div>
      <GoalsCockpit
        year={year}
        currentYear={currentYear}
        metrics={metrics}
        goals={goals ?? []}
        tasks={tasks ?? []}
        completions={completions ?? []}
      />
    </div>
  );
}
