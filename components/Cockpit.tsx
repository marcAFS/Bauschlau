"use client";

import { useMemo, useState } from "react";
import { AlertOctagon, CalendarClock, Rocket, Hourglass } from "lucide-react";
import { useBauSchlauStore } from "@/lib/store";
import { BEREICH_LABEL, TASK_STATUS_LABEL, type Task, type TaskStatus } from "@/lib/types";
import { STATUS_STYLES, formatDate } from "@/lib/ui-helpers";
import TaskModal from "@/components/TaskModal";

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / 86400000);
}

interface Panel {
  key: string;
  title: string;
  icon: typeof AlertOctagon;
  color: string;
  entries: { task: Task; note: string }[];
}

function PanelCard({ panel, onOpen }: { panel: Panel; onOpen: (t: Task) => void }) {
  const Icon = panel.icon;
  const visible = panel.entries.slice(0, 5);
  const rest = panel.entries.length - visible.length;
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className={`mb-2.5 flex items-center gap-1.5 text-sm font-semibold ${panel.color}`}>
        <Icon className="h-4 w-4" /> {panel.title}
        <span className="font-normal text-zinc-500">({panel.entries.length})</span>
      </div>
      <ul className="space-y-1.5">
        {visible.map(({ task, note }) => (
          <li key={task.id}>
            <button
              onClick={() => onOpen(task)}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-zinc-800/60"
            >
              <span className="truncate text-zinc-300">{task.title}</span>
              <span className="shrink-0 text-xs text-zinc-500">{note}</span>
            </button>
          </li>
        ))}
      </ul>
      {rest > 0 && <p className="mt-1.5 px-2 text-xs text-zinc-500">+{rest} weitere</p>}
    </div>
  );
}

export default function Cockpit() {
  const tasks = useBauSchlauStore((s) => s.tasks);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const today = useMemo(() => startOfDay(new Date()), []);

  const counts = useMemo(() => {
    const c: Record<TaskStatus, number> = { offen: 0, in_arbeit: 0, wartend: 0, blockiert: 0, erledigt: 0 };
    for (const t of tasks) c[t.status]++;
    return c;
  }, [tasks]);

  const panels = useMemo<Panel[]>(() => {
    const offen = tasks.filter((t) => t.status !== "erledigt");

    const ueberfaellig = offen
      .filter((t) => t.deadline && new Date(t.deadline) < today)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .map((task) => ({ task, note: `seit ${formatDate(task.deadline)} · ${BEREICH_LABEL[task.bereich]}` }));

    const dieseWoche = offen
      .filter((t) => t.deadline && new Date(t.deadline) >= today && daysBetween(today, new Date(t.deadline)) <= 6)
      .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
      .map((task) => ({ task, note: `${formatDate(task.deadline)} · ${BEREICH_LABEL[task.bereich]}` }));

    const baldStartend = tasks
      .filter(
        (t) =>
          (t.status === "offen" || t.status === "wartend") &&
          t.startDatum &&
          new Date(t.startDatum) >= today &&
          daysBetween(today, new Date(t.startDatum)) <= 14
      )
      .sort((a, b) => new Date(a.startDatum!).getTime() - new Date(b.startDatum!).getTime())
      .map((task) => ({ task, note: `ab ${formatDate(task.startDatum)} · ${BEREICH_LABEL[task.bereich]}` }));

    const sperrfristenBald = tasks
      .filter((t) => t.status === "erledigt" && t.erledigtAm && t.sperrfristBisTag)
      .map((task) => ({ task, rest: (task.sperrfristBisTag ?? 0) - daysBetween(new Date(task.erledigtAm!), today) }))
      .filter((x) => x.rest > 0 && x.rest <= 7)
      .sort((a, b) => a.rest - b.rest)
      .map(({ task, rest }) => ({ task, note: `noch ${rest} Tag${rest === 1 ? "" : "e"}` }));

    return [
      { key: "ueberfaellig", title: "Überfällig", icon: AlertOctagon, color: "text-red-400", entries: ueberfaellig },
      { key: "dieseWoche", title: "Diese Woche fällig", icon: CalendarClock, color: "text-amber-400", entries: dieseWoche },
      { key: "baldStartend", title: "Bald startend", icon: Rocket, color: "text-sky-400", entries: baldStartend },
      { key: "sperrfrist", title: "Sperrfrist läuft bald ab", icon: Hourglass, color: "text-emerald-400", entries: sperrfristenBald },
    ].filter((p) => p.entries.length > 0);
  }, [tasks, today]);

  if (tasks.length === 0) return null;

  return (
    <div className="mb-6 space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {Object.entries(TASK_STATUS_LABEL).map(([status, label]) => (
          <div key={status} className={`rounded-lg border px-3 py-2 text-center ${STATUS_STYLES[status as TaskStatus]}`}>
            <p className="text-lg font-bold leading-tight">{counts[status as TaskStatus]}</p>
            <p className="text-[11px] leading-tight opacity-90">{label}</p>
          </div>
        ))}
      </div>

      {panels.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {panels.map((panel) => (
            <PanelCard key={panel.key} panel={panel} onOpen={setEditingTask} />
          ))}
        </div>
      )}

      <TaskModal open={editingTask !== null} task={editingTask} onClose={() => setEditingTask(null)} />
    </div>
  );
}
