"use client";

import { useMemo } from "react";
import { CalendarClock, Hourglass, Package, CheckCircle2, TriangleAlert, GanttChartSquare } from "lucide-react";
import { useBauSchlauStore } from "@/lib/store";
import { empfehleFolgeaufgabe } from "@/lib/ai-simulator";
import { MATERIAL_STATUS_LABEL, MATERIAL_STATUS_STYLES, formatDate } from "@/lib/ui-helpers";
import { BEREICH_LABEL, TASK_STATUS_LABEL, type Task, type TaskStatus } from "@/lib/types";

function tageSeit(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

const GANTT_BAR_COLOR: Record<TaskStatus, string> = {
  offen: "bg-sky-500",
  in_arbeit: "bg-amber-500",
  wartend: "bg-blue-500",
  blockiert: "bg-red-500",
  erledigt: "bg-emerald-500",
};

const DAY_MS = 86400000;
const PX_PER_DAY = 28;
const LABEL_COL_WIDTH = 180;

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// Dezente Wochenend-Schattierung als sich wiederholender Hintergrund (Sa+So),
// ausgerichtet am Wochentag von rangeStart – vermeidet zusätzliche DOM-Knoten
// und Stacking-Probleme mit den absolut positionierten Balken.
function weekendBackground(rangeStartDow: number): string {
  const stops: string[] = [];
  for (let c = 0; c < 7; c++) {
    const weekday = (rangeStartDow + c) % 7;
    const isWeekend = weekday === 0 || weekday === 6;
    const color = isWeekend ? "rgba(255,255,255,0.035)" : "transparent";
    const from = c * PX_PER_DAY;
    const to = from + PX_PER_DAY;
    stops.push(`${color} ${from}px`, `${color} ${to}px`);
  }
  return `repeating-linear-gradient(to right, ${stops.join(", ")})`;
}

function GanttChart({ tasks }: { tasks: Task[] }) {
  const items = useMemo(() => {
    return tasks
      .filter((t) => t.startDatum && t.deadline)
      .map((t) => ({ task: t, start: startOfDay(new Date(t.startDatum!)), end: startOfDay(new Date(t.deadline!)) }))
      .filter((t) => t.end.getTime() >= t.start.getTime())
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [tasks]);

  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Noch keine Aufgaben mit Start-Datum <span className="text-zinc-400">und</span> Deadline. Trag bei einer Aufgabe
        beide Termine ein, damit sie hier als Balken erscheint.
      </p>
    );
  }

  const earliestStart = new Date(Math.min(...items.map((i) => i.start.getTime())));
  const latestEnd = new Date(Math.max(...items.map((i) => i.end.getTime())));
  const rangeStart = new Date(earliestStart.getFullYear(), earliestStart.getMonth(), 1);
  const rangeEndExclusive = new Date(latestEnd.getFullYear(), latestEnd.getMonth() + 1, 1);
  const totalDays = Math.max(1, Math.round((rangeEndExclusive.getTime() - rangeStart.getTime()) / DAY_MS));
  const chartWidth = totalDays * PX_PER_DAY;
  const dayOffset = (d: Date) => Math.round((d.getTime() - rangeStart.getTime()) / DAY_MS);

  const months: { label: string; left: number; width: number }[] = [];
  for (let cursor = new Date(rangeStart); cursor < rangeEndExclusive; cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)) {
    const monthEndExclusive = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const daysInMonth = Math.round((monthEndExclusive.getTime() - cursor.getTime()) / DAY_MS);
    months.push({
      label: cursor.toLocaleDateString("de-DE", { month: "short", year: "2-digit" }),
      left: dayOffset(cursor) * PX_PER_DAY,
      width: daysInMonth * PX_PER_DAY,
    });
  }

  const days: { label: string; left: number }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + i);
    days.push({ label: String(d.getDate()), left: i * PX_PER_DAY });
  }

  const weekendBg = weekendBackground(rangeStart.getDay());
  const todayOffset = dayOffset(startOfDay(new Date())) * PX_PER_DAY;
  const showToday = todayOffset >= 0 && todayOffset <= chartWidth;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
        {Object.entries(TASK_STATUS_LABEL).map(([status, label]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm ${GANTT_BAR_COLOR[status as TaskStatus]}`} />
            {label}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
        <div style={{ minWidth: chartWidth + LABEL_COL_WIDTH }}>
          <div className="relative flex border-b border-zinc-800 text-xs text-zinc-500">
            <div
              className="sticky left-0 z-20 flex shrink-0 items-center border-r border-zinc-800 bg-zinc-900 px-3 font-medium text-zinc-400"
              style={{ width: LABEL_COL_WIDTH }}
            >
              Aufgabe
            </div>
            <div style={{ width: chartWidth }}>
              <div className="relative" style={{ height: 24 }}>
                {months.map((m, i) => (
                  <div
                    key={i}
                    className="absolute top-0 flex h-6 items-center border-l border-zinc-800 pl-1.5 whitespace-nowrap"
                    style={{ left: m.left, width: m.width }}
                  >
                    {m.label}
                  </div>
                ))}
              </div>
              <div className="relative border-t border-zinc-800/60" style={{ height: 20, backgroundImage: weekendBg }}>
                {days.map((d, i) => (
                  <div
                    key={i}
                    className="absolute top-0 flex items-center justify-center text-[10px] text-zinc-600"
                    style={{ left: d.left, width: PX_PER_DAY, height: 20 }}
                  >
                    {d.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            {showToday && (
              <div
                className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-orange-500/70"
                style={{ left: LABEL_COL_WIDTH + todayOffset }}
                title="Heute"
              />
            )}
            {items.map(({ task, start, end }) => {
              const left = dayOffset(start) * PX_PER_DAY;
              const width = Math.max(PX_PER_DAY, (dayOffset(end) - dayOffset(start) + 1) * PX_PER_DAY);
              return (
                <div key={task.id} className="flex border-b border-zinc-800/60 last:border-0" style={{ height: 44 }}>
                  <div
                    className="sticky left-0 z-20 flex shrink-0 items-center truncate border-r border-zinc-800 bg-zinc-900/95 px-3 text-sm text-zinc-300"
                    style={{ width: LABEL_COL_WIDTH }}
                    title={task.title}
                  >
                    {task.title}
                  </div>
                  <div className="relative" style={{ width: chartWidth, backgroundImage: weekendBg }}>
                    <div
                      className={`absolute top-2 flex h-6 items-center overflow-hidden rounded-md px-2 text-[11px] font-medium whitespace-nowrap text-zinc-950 ${GANTT_BAR_COLOR[task.status]}`}
                      style={{ left, width }}
                      title={`${task.title}: ${formatDate(task.startDatum!)} – ${formatDate(task.deadline!)}`}
                    >
                      {BEREICH_LABEL[task.bereich]}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
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
          Projekt-Zeitplan, Sperrfristen nach Fertigstellung, automatische Folgeaufgaben-Empfehlungen und Materiallager-Status.
        </p>
      </div>

      <section>
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-300">
          <GanttChartSquare className="h-4 w-4 text-orange-400" /> Projekt-Zeitplan
        </h3>
        <GanttChart tasks={tasks} />
      </section>

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
                      <TriangleAlert className="h-3.5 w-3.5 shrink-0" /> Lange Lieferzeit – jetzt bestellen, um die Deadline nicht zu gefährden!
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
