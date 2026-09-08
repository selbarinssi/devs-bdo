import { Check, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalStorage } from "@/lib/storage";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "bdo_routines_v1";

export type RoutineType = "daily" | "weekly";
export type Priority = "low" | "medium" | "high";

export type RoutineTask = {
  id: string;
  title: string;
  type: RoutineType;
  /** 0=Sun … 6=Sat; only used for weekly */
  resetDay?: number;
  priority: Priority;
  done: boolean;
  lastDoneAt?: string;
};

type RoutinesState = {
  tasks: RoutineTask[];
};

const DEFAULT_STATE: RoutinesState = { tasks: [] };

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const PRIORITY_ORDER: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

function startOfLocalDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function shouldReset(task: RoutineTask, now = new Date()): boolean {
  if (!task.done || !task.lastDoneAt) return false;
  const last = new Date(task.lastDoneAt);
  if (Number.isNaN(last.getTime())) return false;

  if (task.type === "daily") {
    return startOfLocalDay(now).getTime() > startOfLocalDay(last).getTime();
  }

  const resetDay = task.resetDay ?? 1;
  const today = startOfLocalDay(now);
  const day = today.getDay();
  const diff = (day - resetDay + 7) % 7;
  const lastReset = new Date(today);
  lastReset.setDate(today.getDate() - diff);
  return last.getTime() < lastReset.getTime();
}

function applyResets(tasks: RoutineTask[]): RoutineTask[] {
  let changed = false;
  const next = tasks.map((t) => {
    if (shouldReset(t)) {
      changed = true;
      return { ...t, done: false, lastDoneAt: undefined };
    }
    return t;
  });
  return changed ? next : tasks;
}

function uid() {
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function ProgressBlock({
  label,
  done,
  total,
}: {
  label: string;
  done: number;
  total: number;
}) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-ink">
          {label}
          {total === 0 ? (
            <span className="font-normal text-muted"> · none</span>
          ) : done === total ? (
            <span className="font-normal text-muted"> · complete</span>
          ) : (
            <span className="font-normal text-muted">
              {" "}· {done} of {total}
            </span>
          )}
        </p>
        <p className="shrink-0 font-semibold tabular-nums text-teal">
          {done}/{total}
        </p>
      </div>
      <Progress value={pct} />
    </div>
  );
}

export function Routines() {
  const { value, setValue } = useLocalStorage<RoutinesState>(STORAGE_KEY, DEFAULT_STATE);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<RoutineType>("daily");
  const [resetDay, setResetDay] = useState(1);
  const [priority, setPriority] = useState<Priority>("medium");

  useEffect(() => {
    const next = applyResets(value.tasks);
    if (next !== value.tasks) setValue({ tasks: next });
  }, [value.tasks, setValue]);

  const tasks = value.tasks;

  const dailyTasks = useMemo(() => tasks.filter((t) => t.type === "daily"), [tasks]);
  const weeklyTasks = useMemo(() => tasks.filter((t) => t.type === "weekly"), [tasks]);

  const dailyDone = dailyTasks.filter((t) => t.done).length;
  const weeklyDone = weeklyTasks.filter((t) => t.done).length;

  const sorted = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        // Dailies before weeklies, then incomplete first, then priority
        if (a.type !== b.type) return a.type === "daily" ? -1 : 1;
        if (a.done !== b.done) return a.done ? 1 : -1;
        return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      }),
    [tasks],
  );

  const addTask = () => {
    const t = title.trim();
    if (!t) return;
    const task: RoutineTask = {
      id: uid(),
      title: t,
      type,
      priority,
      done: false,
      ...(type === "weekly" ? { resetDay } : {}),
    };
    setValue((prev) => ({ tasks: [...prev.tasks, task] }));
    setTitle("");
  };

  const toggle = (id: string) => {
    setValue((prev) => ({
      tasks: prev.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              done: !t.done,
              lastDoneAt: !t.done ? new Date().toISOString() : undefined,
            }
          : t,
      ),
    }));
  };

  const remove = (id: string) => {
    setValue((prev) => ({ tasks: prev.tasks.filter((t) => t.id !== id) }));
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="sticky top-2 z-20 mb-4 flex flex-col gap-4 rounded-xl border border-stone bg-paper/95 p-4 shadow-[var(--shadow-border)] backdrop-blur-md">
        <ProgressBlock label="Daily" done={dailyDone} total={dailyTasks.length} />
        <ProgressBlock label="Weekly" done={weeklyDone} total={weeklyTasks.length} />
      </div>

      <div className="mb-5 rounded-xl border border-stone bg-paper p-4 shadow-[var(--shadow-border)] sm:p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-teal">Add routine</p>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="routine-title">Task</Label>
            <Input
              id="routine-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addTask();
              }}
              placeholder="e.g. Oquilla dailies"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="routine-type">Type</Label>
              <select
                id="routine-type"
                className="field-select"
                value={type}
                onChange={(e) => setType(e.target.value as RoutineType)}
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="routine-priority">Priority</Label>
              <select
                id="routine-priority"
                className="field-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="routine-reset">Reset day</Label>
              <select
                id="routine-reset"
                className="field-select"
                value={resetDay}
                disabled={type !== "weekly"}
                onChange={(e) => setResetDay(parseInt(e.target.value, 10))}
              >
                {DAYS.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={addTask}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border border-teal bg-teal px-4 text-sm font-bold text-ivory shadow-[0_4px_14px_rgba(32,89,92,0.25)] transition-[opacity] hover:opacity-95"
          >
            <Plus className="size-4" strokeWidth={2.25} />
            Add task
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {sorted.length === 0 ? (
          <p className="rounded-xl border border-stone bg-paper px-4 py-10 text-center text-sm text-muted">
            Add daily or weekly tasks to track here.
          </p>
        ) : (
          sorted.map((task) => (
            <div
              key={task.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-paper px-3 py-3 shadow-[var(--shadow-border)] sm:px-4",
                task.done ? "border-stone opacity-60" : "border-stone",
              )}
            >
              <button
                type="button"
                aria-label={task.done ? "Mark incomplete" : "Mark complete"}
                onClick={() => toggle(task.id)}
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-[6px] border-2 transition-[background-color,border-color]",
                  task.done ? "border-teal bg-teal text-ivory" : "border-muted bg-ivory",
                )}
              >
                {task.done ? <Check className="size-3.5" strokeWidth={3} /> : null}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm font-medium text-ink",
                    task.done && "text-muted line-through",
                  )}
                >
                  {task.title}
                </p>
                <p className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5 text-[0.72rem] text-muted">
                  <span className="capitalize">{task.type}</span>
                  <span>·</span>
                  <span className="capitalize">{task.priority} priority</span>
                  {task.type === "weekly" ? (
                    <>
                      <span>·</span>
                      <span>Resets {DAYS.find((d) => d.value === (task.resetDay ?? 1))?.label}</span>
                    </>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                aria-label={`Delete ${task.title}`}
                onClick={() => remove(task.id)}
                className="flex size-9 shrink-0 items-center justify-center rounded-md text-muted transition-[color,background-color] hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 className="size-4" strokeWidth={1.75} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
