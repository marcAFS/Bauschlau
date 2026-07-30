"use client";

import { useState } from "react";
import { HardHat, User, Phone, Mail, Ruler, CalendarDays, Package, Sparkles } from "lucide-react";
import type { Task } from "@/lib/types";
import { BEREICH_LABEL, TASK_STATUS_LABEL } from "@/lib/types";
import {
  STATUS_STYLES,
  PRIORITAET_STYLES,
  PRIORITAET_LABEL,
  MATERIAL_STATUS_LABEL,
  MATERIAL_STATUS_STYLES,
  formatDate,
} from "@/lib/ui-helpers";
import DiyDetailModal from "./DiyDetailModal";

interface Props {
  task: Task;
  onEdit: (task: Task) => void;
}

export default function TaskCard({ task, onEdit }: Props) {
  const [diyOpen, setDiyOpen] = useState(false);

  return (
    <div className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 transition hover:border-zinc-700 hover:bg-zinc-900/70">
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => onEdit(task)} className="text-left">
          <h3 className="font-semibold text-zinc-100 group-hover:text-orange-400">{task.title}</h3>
        </button>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[task.status]}`}>
          {TASK_STATUS_LABEL[task.status]}
        </span>
      </div>

      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-sm text-zinc-400">{task.description}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-300">{BEREICH_LABEL[task.bereich]}</span>
        <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-zinc-300">{task.gewerk}</span>
        <span className={`rounded-full px-2 py-0.5 font-medium ${PRIORITAET_STYLES[task.prioritaet]}`}>
          {PRIORITAET_LABEL[task.prioritaet]}
        </span>
        {task.materialStatus && (
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 font-medium ${MATERIAL_STATUS_STYLES[task.materialStatus]}`}>
            <Package className="h-3 w-3" /> {MATERIAL_STATUS_LABEL[task.materialStatus]}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <HardHat className="h-3.5 w-3.5" />
          {task.ausfuehrung === "diy" ? "Eigenleistung (DIY)" : "Handwerker"}
        </span>
        {task.flaeche && (
          <span className="flex items-center gap-1">
            <Ruler className="h-3.5 w-3.5" /> {task.flaeche} m²
          </span>
        )}
        {task.deadline && (
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" /> {formatDate(task.deadline)}
          </span>
        )}
      </div>

      {task.ausfuehrung === "handwerker" && task.kontakt && (task.kontakt.name || task.kontakt.firma) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg bg-zinc-950/60 px-2.5 py-1.5 text-xs text-zinc-400">
          {task.kontakt.firma && <span className="flex items-center gap-1"><User className="h-3 w-3" />{task.kontakt.firma}</span>}
          {task.kontakt.name && <span>{task.kontakt.name}</span>}
          {task.kontakt.telefon && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{task.kontakt.telefon}</span>}
          {task.kontakt.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{task.kontakt.email}</span>}
        </div>
      )}

      {task.ausfuehrung === "diy" && (
        <button
          onClick={() => setDiyOpen(true)}
          className="mt-3 flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-2.5 py-1.5 text-xs font-medium text-orange-400 hover:bg-orange-500/20"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {task.diyDetails ? "DIY-Aufbau anzeigen" : "DIY-Material generieren"}
        </button>
      )}

      <DiyDetailModal open={diyOpen} onClose={() => setDiyOpen(false)} task={task} />
    </div>
  );
}
