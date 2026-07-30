"use client";

import { useMemo } from "react";
import { Network, Euro, Lightbulb } from "lucide-react";
import { useBauSchlauStore } from "@/lib/store";
import { findSynergien } from "@/lib/ai-simulator";

export default function SynergieModule() {
  const tasks = useBauSchlauStore((s) => s.tasks);
  const synergien = useMemo(() => findSynergien(tasks), [tasks]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
          <Network className="h-5 w-5 text-orange-400" /> Gewerke-Synergie- &amp; Kosten-Einspar-Finder
        </h2>
        <p className="text-sm text-zinc-500">
          Automatische Erkennung von Gewerk-Überschneidungen (Gerüst, Erdarbeiten, Schlitzarbeiten) auf Basis deiner geplanten Aufgaben.
        </p>
      </div>

      {synergien.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 py-12 text-center text-sm text-zinc-500">
          Aktuell keine Synergien erkannt. Lege Aufgaben mit passenden Gewerken an (z. B. Dachdecker + PV-Montage), um Einsparpotenziale zu sehen.
        </div>
      ) : (
        <div className="space-y-3">
          {synergien.map((s) => (
            <div key={s.id} className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-emerald-400" />
                <h3 className="font-semibold text-emerald-400">Gewerke-Kopplung möglich: {s.titel}</h3>
              </div>
              <p className="text-sm text-zinc-300">{s.beschreibung}</p>
              <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-zinc-950/60 px-3 py-2 text-sm font-medium text-amber-400">
                <Euro className="h-4 w-4" /> {s.einsparungText}
              </div>
              <p className="mt-2 text-xs text-zinc-500">Betroffene Aufgaben: {s.betroffeneTasks.length}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
