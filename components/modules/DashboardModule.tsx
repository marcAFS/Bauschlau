"use client";

import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { useBauSchlauStore } from "@/lib/store";
import { BEREICH_LABEL, type Bereich } from "@/lib/types";
import { computeBereichStatus, bereichFortschritt } from "@/lib/bereich-status";
import TaskList from "@/components/TaskList";

const House3D = dynamic(() => import("@/components/House3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[380px] w-full items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/40 sm:h-[460px]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
    </div>
  ),
});

const BEREICHE: Bereich[] = ["keller", "eg", "og", "dach", "garage", "garten", "fassade"];

export default function DashboardModule() {
  const tasks = useBauSchlauStore((s) => s.tasks);
  const aktiverBereichFilter = useBauSchlauStore((s) => s.aktiverBereichFilter);
  const setAktiverBereichFilter = useBauSchlauStore((s) => s.setAktiverBereichFilter);

  const gesamtErledigt = tasks.filter((t) => t.status === "erledigt").length;

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Digitaler Zwilling</h2>
            <p className="text-sm text-zinc-500">
              Klicke auf ein Bauteil, um die Aufgabenliste zu filtern · {gesamtErledigt}/{tasks.length} Aufgaben erledigt
            </p>
          </div>
          <div className="hidden items-center gap-3 text-xs text-zinc-400 sm:flex">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-sky-400/40 ring-1 ring-sky-400" />Offen</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />In Arbeit</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Erledigt</span>
          </div>
        </div>

        <House3D />

        <div className="mt-3 flex flex-wrap gap-2">
          {BEREICHE.map((b) => {
            const status = computeBereichStatus(tasks, b);
            const { erledigt, gesamt } = bereichFortschritt(tasks, b);
            const active = aktiverBereichFilter === b;
            return (
              <button
                key={b}
                onClick={() => setAktiverBereichFilter(b)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-orange-500/50 bg-orange-500/10 text-orange-400"
                    : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    status === "erledigt" ? "bg-emerald-500" : status === "in_arbeit" ? "bg-amber-500" : "bg-sky-400"
                  }`}
                />
                {BEREICH_LABEL[b]}
                {gesamt > 0 && <span className="text-zinc-500">({erledigt}/{gesamt})</span>}
              </button>
            );
          })}
          {aktiverBereichFilter && (
            <button
              onClick={() => setAktiverBereichFilter(null)}
              className="flex items-center gap-1 rounded-full border border-zinc-800 px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
            >
              <X className="h-3 w-3" /> Filter zurücksetzen
            </button>
          )}
        </div>
      </div>

      <TaskList bereichFilter={aktiverBereichFilter} title="Aufgaben" />
    </div>
  );
}
