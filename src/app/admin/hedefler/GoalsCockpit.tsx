"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { YearMetrics } from "@/lib/companyMetrics";
import {
  upsertGoal, deleteGoal, upsertTask, deleteTask, toggleTaskDone, toggleTaskPeriod,
  type GoalPayload, type TaskPayload,
} from "./actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

const TASK_CATEGORIES: Record<string, string> = {
  pazarlama: "Pazarlama",
  satis: "Satış",
  operasyon: "Operasyon",
  finans: "Finans",
  diger: "Diğer",
};

const METRIC_LABELS: Record<string, string> = {
  revenue: "Ciro (tahsilat)",
  bookings: "Booking sayısı",
  custom: "Özel",
};

const fmt = (n: number) => n.toLocaleString("tr-TR");

export default function GoalsCockpit({
  year, currentYear, metrics, goals, tasks, completions,
}: {
  year: number;
  currentYear: number;
  metrics: YearMetrics;
  goals: Row[];
  tasks: Row[];
  completions: { task_id: string; period: string }[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalMetric, setGoalMetric] = useState<GoalPayload["metric"]>("revenue");
  const [goalLabel, setGoalLabel] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState("diger");
  const [newTaskRecurrence, setNewTaskRecurrence] = useState<TaskPayload["recurrence"]>("monthly");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("");

  const now = new Date();
  const monthPeriod = `${year}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const yearPeriod = String(year);
  const todayStr = now.toISOString().slice(0, 10);

  // Yıl temposu: yılın yüzde kaçı geçti (geçmiş yıl=100, gelecek yıl=0)
  const yearElapsedPct = year < currentYear ? 100 : year > currentYear
    ? 0
    : Math.round(((now.getTime() - new Date(year, 0, 1).getTime()) /
        (new Date(year + 1, 0, 1).getTime() - new Date(year, 0, 1).getTime())) * 100);

  const actualFor = (g: Row): number => {
    if (g.metric === "revenue") return metrics.revenueTotal;
    if (g.metric === "bookings") return metrics.bookingsTotal;
    return Number(g.manual_actual) || 0;
  };

  const run = (fn: () => Promise<void>) => {
    setError(null);
    startTransition(async () => {
      try { await fn(); }
      catch (e) { setError(e instanceof Error ? e.message : "Hata"); }
    });
  };

  const handleAddGoal = () => {
    const target = parseFloat(goalTarget);
    if (!target) return;
    run(async () => {
      await upsertGoal({
        year,
        metric: goalMetric,
        label: goalMetric === "custom" ? goalLabel.trim() || "Özel hedef" : null,
        target,
      });
      setShowGoalForm(false);
      setGoalTarget("");
      setGoalLabel("");
    });
  };

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    run(async () => {
      await upsertTask({
        title: newTask.trim(),
        category: newTaskCategory,
        recurrence: newTaskRecurrence,
        due_date: newTaskRecurrence === "once" ? newTaskDue || null : null,
        assigned_to: newTaskAssignee.trim() || null,
      });
      setNewTask("");
      setNewTaskAssignee("");
      setNewTaskDue("");
    });
  };

  const isTaskDone = (t: Row): boolean => {
    if (t.recurrence === "once") return !!t.is_done;
    const period = t.recurrence === "monthly" ? monthPeriod : yearPeriod;
    return completions.some((c) => c.task_id === t.id && c.period === period);
  };

  const handleToggleTask = (t: Row) => {
    const done = !isTaskDone(t);
    run(async () => {
      if (t.recurrence === "once") await toggleTaskDone(t.id, done);
      else await toggleTaskPeriod(t.id, t.recurrence === "monthly" ? monthPeriod : yearPeriod, done);
    });
  };

  const monthlyTasks = tasks.filter((t) =>
    t.recurrence === "monthly" ||
    (t.recurrence === "once" && (!t.due_date || t.due_date.slice(0, 7) <= monthPeriod) && !t.is_done) ||
    (t.recurrence === "once" && t.due_date?.slice(0, 7) === monthPeriod)
  );
  const yearlyTasks = tasks.filter((t) => t.recurrence === "yearly");

  const inputCls = "px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:border-foreground/40";
  const maxMonthRevenue = Math.max(...metrics.revenueByMonth, 1);

  const renderTaskRow = (t: Row) => {
    const done = isTaskDone(t);
    const overdue = t.recurrence === "once" && !done && t.due_date && t.due_date < todayStr;
    return (
      <div key={t.id} className={`flex items-center gap-3 px-3 py-2 border rounded-xl ${
        overdue ? "border-red-300 bg-red-50/40" : "border-border"
      }`}>
        <input type="checkbox" checked={done} onChange={() => handleToggleTask(t)} disabled={isPending}
          className="w-4 h-4 rounded border-border flex-shrink-0" />
        <span className={`flex-1 text-sm ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {t.title}
        </span>
        <span className="text-xs text-muted-foreground flex-shrink-0">{TASK_CATEGORIES[t.category] ?? t.category}</span>
        {t.assigned_to && <span className="text-xs text-muted-foreground flex-shrink-0">· {t.assigned_to}</span>}
        {t.recurrence === "once" && t.due_date && (
          <span className={`text-xs flex-shrink-0 ${overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
            {new Date(t.due_date).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
          </span>
        )}
        <button onClick={() => run(() => deleteTask(t.id))}
          className="text-muted-foreground hover:text-red-500 text-xs flex-shrink-0">×</button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>}

      {/* Yıl seçici */}
      <div className="flex items-center gap-2">
        {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
          <Link key={y} href={`/admin/hedefler?yil=${y}`}
            className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${
              y === year ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:text-foreground"
            }`}>
            {y}
          </Link>
        ))}
        {year === currentYear && (
          <span className="text-xs text-muted-foreground ml-2">Yılın %{yearElapsedPct}&apos;i geçti</span>
        )}
      </div>

      {/* Hedef kartları */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Hedefler</p>
          <button onClick={() => setShowGoalForm((p) => !p)}
            className="text-xs px-3 py-1.5 border border-border rounded-full text-foreground hover:bg-secondary transition-colors">
            + Hedef Ekle
          </button>
        </div>

        {showGoalForm && (
          <div className="bg-white rounded-2xl border border-border p-4 mb-3 flex flex-wrap gap-2 items-end">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Metrik</p>
              <select value={goalMetric} onChange={(e) => setGoalMetric(e.target.value as GoalPayload["metric"])} className={inputCls}>
                <option value="revenue">Ciro (otomatik)</option>
                <option value="bookings">Booking sayısı (otomatik)</option>
                <option value="custom">Özel (elle takip)</option>
              </select>
            </div>
            {goalMetric === "custom" && (
              <div className="flex-1 min-w-40">
                <p className="text-xs text-muted-foreground mb-1.5">Hedef adı</p>
                <input value={goalLabel} onChange={(e) => setGoalLabel(e.target.value)}
                  placeholder="Örn. Instagram takipçi" className={`${inputCls} w-full`} />
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Hedef değer</p>
              <input type="number" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)}
                placeholder={goalMetric === "revenue" ? "1000000" : "50"} className={inputCls} />
            </div>
            <button onClick={handleAddGoal} disabled={isPending || !goalTarget}
              className="px-4 py-2 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
              Kaydet
            </button>
          </div>
        )}

        {goals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border p-10 text-center">
            <p className="text-3xl mb-3">🎯</p>
            <p className="text-foreground font-medium">Henüz {year} hedefi yok</p>
            <p className="text-sm text-muted-foreground mt-1">İlk hedefinizi ekleyin — ciro ve booking hedefleri otomatik takip edilir.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map((g) => {
              const actual = actualFor(g);
              const target = Number(g.target) || 1;
              const pct = Math.min(100, Math.round((actual / target) * 100));
              const behind = year === currentYear && pct < yearElapsedPct - 5;
              const ahead = year === currentYear && pct >= yearElapsedPct;
              const isMoney = g.metric === "revenue";
              return (
                <div key={g.id} className="bg-white rounded-2xl border border-border p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">
                      {g.metric === "custom" ? g.label : METRIC_LABELS[g.metric]}
                    </p>
                    <div className="flex items-center gap-2">
                      {year === currentYear && (
                        behind ? <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700 font-medium">geride</span> :
                        ahead ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">yolunda</span> : null
                      )}
                      <button onClick={() => run(() => deleteGoal(g.id))}
                        className="text-muted-foreground hover:text-red-500 text-xs">×</button>
                    </div>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <p className="text-2xl font-semibold text-foreground tabular-nums">
                      {fmt(actual)}{isMoney ? " ₺" : ""}
                    </p>
                    <p className="text-sm text-muted-foreground tabular-nums">/ {fmt(Number(g.target))}{isMoney ? " ₺" : ""} · %{pct}</p>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className={`h-full transition-all ${behind ? "bg-red-500" : "bg-foreground"}`} style={{ width: `${pct}%` }} />
                  </div>
                  {g.metric === "custom" && (
                    <div className="flex gap-2 items-center">
                      <input type="number" defaultValue={g.manual_actual ?? ""} placeholder="Gerçekleşen"
                        className={`${inputCls} py-1.5 text-xs w-32`}
                        onBlur={(e) => {
                          const v = parseFloat(e.target.value);
                          if (!Number.isNaN(v) && v !== Number(g.manual_actual)) {
                            run(() => upsertGoal({ id: g.id, year, metric: "custom", label: g.label, target: Number(g.target), manual_actual: v }));
                          }
                        }} />
                      <span className="text-xs text-muted-foreground">gerçekleşen değeri elle güncelleyin</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Aylık ciro kırılımı */}
      <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Aylık Tahsilat — {year}</p>
          <p className="text-sm font-semibold text-foreground tabular-nums">{fmt(metrics.revenueTotal)} ₺</p>
        </div>
        <div className="flex items-end gap-1.5 h-28">
          {metrics.revenueByMonth.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t bg-foreground/80 transition-all min-h-[2px]"
                style={{ height: `${(v / maxMonthRevenue) * 100}%` }}
                title={`${MONTHS[i]}: ${fmt(v)} ₺`} />
              <span className={`text-[9px] ${i === now.getMonth() && year === currentYear ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
                {MONTHS[i]}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Booking: {metrics.bookingsTotal} etkinlik · aylara göre {metrics.bookingsByMonth.map((n, i) => n > 0 ? `${MONTHS[i]} ${n}` : null).filter(Boolean).join(", ") || "—"}
        </p>
      </div>

      {/* Görevler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Bu Ayın Görevleri — {MONTHS[now.getMonth()]} {year === currentYear ? year : currentYear}
          </p>
          {monthlyTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Bu ay için görev yok.</p>
          ) : (
            <div className="space-y-1.5">{monthlyTasks.map(renderTaskRow)}</div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border p-5 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Yıllık Görevler — {year}</p>
          {yearlyTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Yıllık görev yok.</p>
          ) : (
            <div className="space-y-1.5">{yearlyTasks.map(renderTaskRow)}</div>
          )}
        </div>
      </div>

      {/* Görev ekle */}
      <div className="bg-white rounded-2xl border border-border p-4 flex flex-wrap gap-2 items-center">
        <input value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="Yeni şirket görevi…"
          className={`${inputCls} flex-1 min-w-48`} />
        <select value={newTaskCategory} onChange={(e) => setNewTaskCategory(e.target.value)} className={inputCls}>
          {Object.entries(TASK_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={newTaskRecurrence} onChange={(e) => setNewTaskRecurrence(e.target.value as TaskPayload["recurrence"])} className={inputCls}>
          <option value="monthly">Her ay</option>
          <option value="yearly">Her yıl</option>
          <option value="once">Tek seferlik</option>
        </select>
        {newTaskRecurrence === "once" && (
          <input type="date" value={newTaskDue} onChange={(e) => setNewTaskDue(e.target.value)} className={inputCls} />
        )}
        <input value={newTaskAssignee} onChange={(e) => setNewTaskAssignee(e.target.value)} placeholder="Sorumlu"
          className={`${inputCls} w-28`} />
        <button onClick={handleAddTask} disabled={isPending || !newTask.trim()}
          className="px-4 py-2 bg-foreground text-background rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50">
          Ekle
        </button>
      </div>
    </div>
  );
}
