"use client";

import { useMemo } from "react";
import { CalendarClock, Hourglass, Package, CheckCircle2, TriangleAlert } from "lucide-react";
import { useBauSchlauStore } from "@/lib/store";
import { empfehleFolgeaufgabe } from "@/lib/ai-simulator";
import { MATERIAL_STATUS_LABEL, MATERIAL_STATUS_STYLES, formatDate } from "@/lib/ui-helpers";
import { BEREICH_LABEL } from "@/lib/types";

function tageSeit(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export default function TimelineModule() {
  const tasks = useBauSchlauStore((s) => s.tasks);

  const sperrfristen = useMemo(
    () => tasks.filter((t) => t.status === "erledigt" && t.erledigtAm && t.sperrfristBisTag),
    [tasks]
  );

  const materialTasks = useMemo(
    () => tasks.filter((t) => t.materialStatus && t.status !== "erledigt"),
    [tasks]
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
          <CalendarClock className="h-5 w-5 text-orange-400" /> Timeline, Abhängigkeiten &amp; Vorlaufzeiten
        </h2>
        <p className="text-sm text-zinc-500">
          Sperrfristen nach Fertigstellung, automatische Folgeaufgaben-Empfehlungen und Materiallager-Status.
        </p>
      </div>

      <section>
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-300">
          <Hourglass className="h-4 w-4 text-amber-400" /> Aktive Sperrfristen &amp; Trocknungszeiten
        </h3>
        {sperrfristen.length === 0 ? (
          <p className="text-sm text-zinc-500">Keine aktiven Sperrfristen. Trage bei erledigten Aufgaben eine Sperrfrist ein (z. B. 21 Tage Trocknungszeit für Estrich).</p>
        ) : (
          <div className="space-y-2">
            {sperrfristen.map((t) => {
              const vergangen = tageSeit(t.erledigtAm!);
              const rest = (t.sperrfristBisTag ?? 0) - vergangen;
              const abgelaufen = rest <= 0;
              return (
                <div key={t.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium text-zinc-100">{t.title}</p>
                      <p className="text-xs text-zinc-500">{t.sperrfristNotiz || "Sperrfrist"} · {BEREICH_LABEL[t.bereich]}</p>
                    </div>
                    {abgelaufen ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Sperrfrist abgelaufen – Folgegewerk kann starten
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-400">
                        <Hourglass className="h-3.5 w-3.5" /> noch {rest} Tag{rest === 1 ? "" : "e"}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-sm text-zinc-400">
                    Empfohlene Folgeaufgabe: <span className="text-zinc-200">{empfehleFolgeaufgabe(`${t.gewerk} ${t.title}`)}</span>
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-300">
          <Package className="h-4 w-4 text-blue-400" /> Materiallager &amp; Bestell-Erinnerung
        </h3>
        {materialTasks.length === 0 ? (
          <p className="text-sm text-zinc-500">Keine offenen Material-Status hinterlegt.</p>
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {materialTasks.map((t) => {
              const warnung = t.materialStatus === "muss_bestellt" && (t.lieferzeitTage ?? 0) >= 14;
              return (
                <div key={t.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-zinc-100">{t.title}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${MATERIAL_STATUS_STYLES[t.materialStatus!]}`}>
                      {MATERIAL_STATUS_LABEL[t.materialStatus!]}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 text-xs text-zinc-500">
                    {t.lieferzeitTage !== undefined && <span>Lieferzeit: {t.lieferzeitTage} Tage</span>}
                    {t.deadline && <span>Deadline: {formatDate(t.deadline)}</span>}
                  </div>
                  {warnung && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300">
                      <TriangleAlert className="h-3.5 w-3.5 shrink-0" /> Lange Lieferzeit – jetzt bestellen, um Ziel-KW nicht zu gefährden!
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
