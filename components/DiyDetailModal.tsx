"use client";

import { useState } from "react";
import { X, Wrench, ListChecks, Layers } from "lucide-react";
import { useBauSchlauStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { DIY_KATEGORIE_LABEL, generateDiyDetails, type DiyKategorie } from "@/lib/diy-templates";

interface Props {
  open: boolean;
  onClose: () => void;
  task: Task;
}

export default function DiyDetailModal({ open, onClose, task }: Props) {
  const updateTask = useBauSchlauStore((s) => s.updateTask);
  const [kategorie, setKategorie] = useState<DiyKategorie>("laminat");
  const [flaeche, setFlaeche] = useState(task.flaeche?.toString() ?? task.diyDetails?.flaeche?.toString() ?? "");

  if (!open) return null;

  const details = task.diyDetails;

  const handleGenerate = () => {
    const f = Number(flaeche);
    if (!f || f <= 0) return;
    const generated = generateDiyDetails(kategorie, f);
    updateTask(task.id, { diyDetails: generated, flaeche: f });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col rounded-t-2xl border border-zinc-800 bg-zinc-950 shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-100">DIY-Material &amp; Aufbau-Generator</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          <p className="text-sm text-zinc-400">
            Aufgabe: <span className="text-zinc-200">{task.title}</span>
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Gewerk-Typ</label>
              <select
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-orange-500 focus:outline-none"
                value={kategorie}
                onChange={(e) => setKategorie(e.target.value as DiyKategorie)}
              >
                {Object.entries(DIY_KATEGORIE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-400">Fläche (m²)</label>
              <input
                type="number"
                step="0.1"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-orange-500 focus:outline-none"
                value={flaeche}
                onChange={(e) => setFlaeche(e.target.value)}
                placeholder="z. B. 18.5"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="w-full rounded-lg bg-orange-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-orange-400"
          >
            Aufbau &amp; Material generieren
          </button>

          {details && details.schichtaufbau && (
            <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-orange-400">
                  <Layers className="h-4 w-4" /> Schritt-für-Schritt-Aufbau
                </div>
                <ol className="space-y-1.5 text-sm text-zinc-300">
                  {details.schichtaufbau.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="text-zinc-500">{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-orange-400">
                  <ListChecks className="h-4 w-4" /> Materialliste (inkl. +10% Verschnitt)
                </div>
                <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-zinc-300">
                  {details.materialliste?.map((m, i) => (
                    <li key={i} className="flex justify-between border-b border-zinc-800/60 py-1">
                      <span>{m.name}</span>
                      <span className="font-medium text-zinc-100">{m.menge}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-orange-400">
                  <Wrench className="h-4 w-4" /> Werkzeug- &amp; Maschinen-Checkliste
                </div>
                <ul className="flex flex-wrap gap-2">
                  {details.werkzeug?.map((w, i) => (
                    <li key={i} className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-300">{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
