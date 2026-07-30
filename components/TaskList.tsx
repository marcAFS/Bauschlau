"use client";

import { useMemo, useState } from "react";
import { Plus, ListFilter } from "lucide-react";
import { useBauSchlauStore } from "@/lib/store";
import type { Task, TaskStatus, Bereich } from "@/lib/types";
import { BEREICH_LABEL, TASK_STATUS_LABEL } from "@/lib/types";
import TaskCard from "./TaskCard";
import TaskModal from "./TaskModal";

interface Props {
  bereichFilter?: Bereich | null;
  title?: string;
}

export default function TaskList({ bereichFilter, title = "Aufgaben" }: Props) {
  const tasks = useBauSchlauStore((s) => s.tasks);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "alle">("alle");
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (bereichFilter && t.bereich !== bereichFilter) return false;
      if (statusFilter !== "alle" && t.status !== statusFilter) return false;
      return true;
    });
  }, [tasks, bereichFilter, statusFilter]);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
          {title}
          {bereichFilter && (
            <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-medium text-orange-400">
              {BEREICH_LABEL[bereichFilter]}
            </span>
          )}
          <span className="text-sm font-normal text-zinc-500">({filtered.length})</span>
        </h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1.5">
            <ListFilter className="h-3.5 w-3.5 text-zinc-500" />
            <select
              className="bg-transparent text-xs text-zinc-300 focus:outline-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | "alle")}
            >
              <option value="alle">Alle Status</option>
              {Object.entries(TASK_STATUS_LABEL).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              setEditTask(null);
              setModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-orange-400"
          >
            <Plus className="h-4 w-4" /> Neue Aufgabe
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 py-12 text-center text-sm text-zinc-500">
          Keine Aufgaben in diesem Bereich. Lege deine erste Aufgabe an.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              onEdit={(task) => {
                setEditTask(task);
                setModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        task={editTask}
        prefill={bereichFilter ? { bereich: bereichFilter } : null}
      />
    </div>
  );
}
