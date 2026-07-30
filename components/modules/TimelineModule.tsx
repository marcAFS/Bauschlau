"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  CalendarClock,
  Hourglass,
  Package,
  CheckCircle2,
  TriangleAlert,
  GanttChartSquare,
  ChevronDown,
  Download,
} from "lucide-react";
import { useBauSchlauStore } from "@/lib/store";
import { empfehleFolgeaufgabe } from "@/lib/ai-simulator";
import { MATERIAL_STATUS_LABEL, MATERIAL_STATUS_STYLES, formatDate } from "@/lib/ui-helpers";
import { BEREICH_LABEL, TASK_STATUS_LABEL, type Bereich, type Task, type TaskStatus } from "@/lib/types";
import TaskModal from "@/components/TaskModal";

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

const GANTT_BAR_COLOR_HEX: Record<TaskStatus, string> = {
  offen: "#0ea5e9",
  in_arbeit: "#f59e0b",
  wartend: "#3b82f6",
  blockiert: "#ef4444",
  erledigt: "#10b981",
};

const BEREICH_ORDER: Bereich[] = ["keller", "eg", "og", "dach", "garage", "garten", "fassade"];

const DAY_MS = 86400000;
const LABEL_COL_WIDTH = 240;

const ZOOM_LEVELS = [
  { key: "monat", label: "Monat", pxPerDay: 32 },
  { key: "2monate", label: "2 Monate", pxPerDay: 18 },
  { key: "3monate", label: "3 Monate", pxPerDay: 12 },
  { key: "halbjahr", label: "Halbjahr", pxPerDay: 6 },
  { key: "jahr", label: "Jahr", pxPerDay: 3 },
] as const;
type ZoomKey = (typeof ZOOM_LEVELS)[number]["key"];
const ZOOM_MONTHS: Record<ZoomKey, number> = {
  monat: 1,
  "2monate": 2,
  "3monate": 3,
  halbjahr: 6,
  jahr: 12,
};

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Dezente Wochenend-Schattierung als sich wiederholender Hintergrund (Sa+So),
// ausgerichtet am Wochentag von rangeStart – vermeidet zusätzliche DOM-Knoten
// und Stacking-Probleme mit den absolut positionierten Balken.
function weekendBackground(rangeStartDow: number, pxPerDay: number): string {
  const stops: string[] = [];
  for (let c = 0; c < 7; c++) {
    const weekday = (rangeStartDow + c) % 7;
    const isWeekend = weekday === 0 || weekday === 6;
    const color = isWeekend ? "rgba(255,255,255,0.035)" : "transparent";
    const from = c * pxPerDay;
    const to = from + pxPerDay;
    stops.push(`${color} ${from}px`, `${color} ${to}px`);
  }
  return `repeating-linear-gradient(to right, ${stops.join(", ")})`;
}

interface GanttItem {
  task: Task;
  start: Date;
  end: Date;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Baut ein echtes PDF client-seitig (jsPDF) und löst direkt einen Download
// aus – kein Druckdialog, kein Server-Rendering nötig.
async function downloadGanttPdf(groups: { bereich: Bereich; items: GanttItem[] }[]) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const marginX = 15;
  const pageWidth = 210;
  const pageHeight = 297;
  const usableWidth = pageWidth - marginX * 2;
  let y = 18;

  const allItems = groups.flatMap((g) => g.items);
  const minStart = Math.min(...allItems.map((i) => i.start.getTime()));
  const maxEnd = Math.max(...allItems.map((i) => i.end.getTime()));
  const span = Math.max(1, maxEnd - minStart + DAY_MS);

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 15) {
      doc.addPage();
      y = 18;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  doc.text("Bau-Schlau – Projekt-Zeitplan", marginX, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Erstellt am ${new Date().toLocaleDateString("de-DE")}`, marginX, y);
  y += 7;

  doc.setFontSize(8);
  let legendX = marginX;
  for (const [status, label] of Object.entries(TASK_STATUS_LABEL)) {
    const [r, g, b] = hexToRgb(GANTT_BAR_COLOR_HEX[status as TaskStatus]);
    doc.setFillColor(r, g, b);
    doc.rect(legendX, y - 2.8, 3, 3, "F");
    doc.setTextColor(60, 60, 60);
    doc.text(label, legendX + 4.5, y);
    legendX += 4.5 + doc.getTextWidth(label) + 6;
  }
  y += 8;

  for (const group of groups) {
    ensureSpace(10);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    doc.text(BEREICH_LABEL[group.bereich], marginX, y);
    doc.setDrawColor(220, 220, 220);
    doc.line(marginX, y + 1.5, marginX + usableWidth, y + 1.5);
    y += 7;

    for (const item of group.items) {
      ensureSpace(13);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      doc.text(item.task.title, marginX, y, { maxWidth: usableWidth * 0.65 });
      doc.setFontSize(7.5);
      doc.setTextColor(130, 130, 130);
      doc.text(`${formatDate(item.task.startDatum)} - ${formatDate(item.task.deadline)}`, marginX + usableWidth, y, {
        align: "right",
      });
      y += 3;

      doc.setFillColor(235, 235, 235);
      doc.roundedRect(marginX, y, usableWidth, 4, 1, 1, "F");
      const leftPct = (item.start.getTime() - minStart) / span;
      const widthPct = Math.max(0.01, (item.end.getTime() - item.start.getTime() + DAY_MS) / span);
      const [r, g, b] = hexToRgb(GANTT_BAR_COLOR_HEX[item.task.status]);
      doc.setFillColor(r, g, b);
      doc.roundedRect(marginX + leftPct * usableWidth, y, Math.max(2, widthPct * usableWidth), 4, 1, 1, "F");
      y += 8;
    }
    y += 3;
  }

  doc.save(`bau-schlau-zeitplan-${toISODate(new Date())}.pdf`);
}

function GanttChart({ tasks }: { tasks: Task[] }) {
  const updateTask = useBauSchlauStore((s) => s.updateTask);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [zoom, setZoom] = useState<ZoomKey>("monat");
  const [collapsed, setCollapsed] = useState<Set<Bereich>>(new Set());
  const [rowCenters, setRowCenters] = useState<Record<string, number>>({});
  const [drag, setDrag] = useState<{ taskId: string; deltaPx: number } | null>(null);

  const pxPerDay = ZOOM_LEVELS.find((z) => z.key === zoom)!.pxPerDay;
  const showDayNumbers = pxPerDay >= 12;
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowsWrapperRef = useRef<HTMLDivElement>(null);
  const rowElRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const items = useMemo(() => {
    return tasks
      .filter((t) => t.startDatum && t.deadline)
      .map((t) => ({ task: t, start: startOfDay(new Date(t.startDatum!)), end: startOfDay(new Date(t.deadline!)) }))
      .filter((t) => t.end.getTime() >= t.start.getTime())
      .sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [tasks]);

  const groups = useMemo(() => {
    const byBereich = new Map<Bereich, GanttItem[]>();
    for (const item of items) {
      const arr = byBereich.get(item.task.bereich) ?? [];
      arr.push(item);
      byBereich.set(item.task.bereich, arr);
    }
    return BEREICH_ORDER.filter((b) => byBereich.has(b)).map((bereich) => ({ bereich, items: byBereich.get(bereich)! }));
  }, [items]);

  const visibleIds = useMemo(() => {
    const ids = new Set<string>();
    for (const g of groups) {
      if (collapsed.has(g.bereich)) continue;
      for (const i of g.items) ids.add(i.task.id);
    }
    return ids;
  }, [groups, collapsed]);

  // Range deckt immer mindestens die Nominal-Monatsspanne der Zoom-Stufe ab
  // (z.B. "Jahr" = 12 Monate), ausgehend vom frühesten von Aufgaben-Start und
  // heutigem Monat – und wird nie kleiner als der tatsächliche Datenbereich.
  const range = useMemo(() => {
    if (items.length === 0) return null;
    const earliestStart = new Date(Math.min(...items.map((i) => i.start.getTime())));
    const latestEnd = new Date(Math.max(...items.map((i) => i.end.getTime())));
    const dataStart = new Date(earliestStart.getFullYear(), earliestStart.getMonth(), 1);
    const dataEndExclusive = new Date(latestEnd.getFullYear(), latestEnd.getMonth() + 1, 1);
    const today = new Date();
    const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const start = dataStart.getTime() < todayMonth.getTime() ? dataStart : todayMonth;
    const minEndExclusive = new Date(start.getFullYear(), start.getMonth() + ZOOM_MONTHS[zoom], 1);
    const endExclusive = dataEndExclusive.getTime() > minEndExclusive.getTime() ? dataEndExclusive : minEndExclusive;
    return { start, endExclusive };
  }, [items, zoom]);
  const rangeStart = range?.start ?? null;
  const rangeEndExclusive = range?.endExclusive ?? null;

  const totalDays =
    rangeStart && rangeEndExclusive ? Math.max(1, Math.round((rangeEndExclusive.getTime() - rangeStart.getTime()) / DAY_MS)) : 0;
  const chartWidth = totalDays * pxPerDay;
  const dayOffset = (d: Date) => (rangeStart ? Math.round((d.getTime() - rangeStart.getTime()) / DAY_MS) : 0);
  const todayOffset = dayOffset(startOfDay(new Date())) * pxPerDay;

  // Pixel-Rechtecke aller Balken (unabhängig von Sichtbarkeit) für Pfeile & Drag.
  const barRects = useMemo(() => {
    const map = new Map<string, { left: number; width: number }>();
    for (const { task, start, end } of items) {
      const left = dayOffset(start) * pxPerDay;
      const width = Math.max(pxPerDay, (dayOffset(end) - dayOffset(start) + 1) * pxPerDay);
      map.set(task.id, { left, width });
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, pxPerDay, rangeStart]);

  const jumpToToday = () => {
    const el = scrollRef.current;
    if (!el) return;
    const visibleChartWidth = Math.max(0, el.clientWidth - LABEL_COL_WIDTH);
    const target = Math.max(0, todayOffset - visibleChartWidth / 2);
    el.scrollTo({ left: target, behavior: "smooth" });
  };

  useEffect(() => {
    if (items.length === 0) return;
    const el = scrollRef.current;
    if (!el) return;
    const visibleChartWidth = Math.max(0, el.clientWidth - LABEL_COL_WIDTH);
    el.scrollLeft = Math.max(0, todayOffset - visibleChartWidth / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, items.length]);

  // Zeilen-Mittelpunkte (Y) für die Abhängigkeits-Pfeile messen – nötig, weil
  // die Zeilenhöhe durch umbrechende Titel variiert und nicht vorab bekannt ist.
  useLayoutEffect(() => {
    const centers: Record<string, number> = {};
    rowElRefs.current.forEach((el, id) => {
      centers[id] = el.offsetTop + el.offsetHeight / 2;
    });
    setRowCenters(centers);
  }, [groups, collapsed, zoom]);

  const toggleGroup = (bereich: Bereich) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(bereich)) next.delete(bereich);
      else next.add(bereich);
      return next;
    });

  const startDrag = (e: React.PointerEvent<HTMLDivElement>, taskId: string) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    setDrag({ taskId, deltaPx: 0 });
    (e.currentTarget as HTMLDivElement & { _dragStartX?: number })._dragStartX = startX;
  };

  const onDragMove = (e: React.PointerEvent<HTMLDivElement>, taskId: string) => {
    if (!drag || drag.taskId !== taskId) return;
    const startX = (e.currentTarget as HTMLDivElement & { _dragStartX?: number })._dragStartX ?? e.clientX;
    const rawDelta = e.clientX - startX;
    const snapped = Math.round(rawDelta / pxPerDay) * pxPerDay;
    setDrag({ taskId, deltaPx: snapped });
  };

  const endDrag = (task: Task, start: Date, end: Date) => {
    if (!drag || drag.taskId !== task.id) return;
    const deltaDays = Math.round(drag.deltaPx / pxPerDay);
    setDrag(null);
    if (deltaDays === 0) return;
    updateTask(task.id, {
      startDatum: toISODate(addDays(start, deltaDays)),
      deadline: toISODate(addDays(end, deltaDays)),
    });
  };

  const exportPdf = () => {
    downloadGanttPdf(groups);
  };

  if (items.length === 0 || !rangeStart || !rangeEndExclusive) {
    return (
      <p className="text-sm text-zinc-500">
        Noch keine Aufgaben mit Start-Datum <span className="text-zinc-400">und</span> Deadline. Trag bei einer Aufgabe
        beide Termine ein, damit sie hier als Balken erscheint.
      </p>
    );
  }

  const months: { label: string; left: number; width: number }[] = [];
  for (let cursor = new Date(rangeStart); cursor < rangeEndExclusive; cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)) {
    const monthEndExclusive = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    const daysInMonth = Math.round((monthEndExclusive.getTime() - cursor.getTime()) / DAY_MS);
    months.push({
      label: cursor.toLocaleDateString("de-DE", { month: "short", year: "2-digit" }),
      left: dayOffset(cursor) * pxPerDay,
      width: daysInMonth * pxPerDay,
    });
  }

  const days: { label: string; left: number }[] = [];
  if (showDayNumbers) {
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), rangeStart.getDate() + i);
      days.push({ label: String(d.getDate()), left: i * pxPerDay });
    }
  }

  const weekendBg = weekendBackground(rangeStart.getDay(), pxPerDay);
  const showToday = todayOffset >= 0 && todayOffset <= chartWidth;
  const dayRowHeight = showDayNumbers ? 20 : 0;

  const arrows = items
    .filter((i) => visibleIds.has(i.task.id) && i.task.abhaengigVon && i.task.abhaengigVon.length > 0)
    .flatMap((i) =>
      (i.task.abhaengigVon ?? [])
        .filter((depId) => visibleIds.has(depId) && barRects.has(depId))
        .map((depId) => {
          const from = barRects.get(depId)!;
          const to = barRects.get(i.task.id)!;
          const y1 = rowCenters[depId];
          const y2 = rowCenters[i.task.id];
          if (y1 === undefined || y2 === undefined) return null;
          const x1 = LABEL_COL_WIDTH + from.left + from.width;
          const x2 = LABEL_COL_WIDTH + to.left;
          const midX = x1 + Math.max(10, (x2 - x1) / 2);
          return { key: `${depId}->${i.task.id}`, x1, y1, x2, y2, midX };
        })
        .filter((a): a is NonNullable<typeof a> => a !== null)
    );

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
          {Object.entries(TASK_STATUS_LABEL).map(([status, label]) => (
            <span key={status} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${GANTT_BAR_COLOR[status as TaskStatus]}`} />
              {label}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex rounded-lg border border-zinc-800 p-0.5">
            {ZOOM_LEVELS.map((z) => (
              <button
                key={z.key}
                onClick={() => setZoom(z.key)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  zoom === z.key ? "bg-orange-500/15 text-orange-400" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {z.label}
              </button>
            ))}
          </div>
          <button
            onClick={jumpToToday}
            className="rounded-lg border border-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200"
          >
            Heute
          </button>
          <button
            onClick={exportPdf}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200"
          >
            <Download className="h-3.5 w-3.5" /> PDF
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-900/40">
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
              {showDayNumbers && (
                <div className="relative border-t border-zinc-800/60" style={{ height: dayRowHeight, backgroundImage: weekendBg }}>
                  {days.map((d, i) => (
                    <div
                      key={i}
                      className="absolute top-0 flex items-center justify-center text-[10px] text-zinc-600"
                      style={{ left: d.left, width: pxPerDay, height: dayRowHeight }}
                    >
                      {d.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div ref={rowsWrapperRef} className="relative">
            {showToday && (
              <div
                className="pointer-events-none absolute top-0 bottom-0 z-10 w-px bg-orange-500/70"
                style={{ left: LABEL_COL_WIDTH + todayOffset }}
                title="Heute"
              />
            )}

            {arrows.length > 0 && (
              <svg
                className="pointer-events-none absolute top-0 left-0 z-10"
                width={chartWidth + LABEL_COL_WIDTH}
                height="100%"
                style={{ overflow: "visible" }}
              >
                <defs>
                  <marker id="gantt-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="#f97316" />
                  </marker>
                </defs>
                {arrows.map((a) => (
                  <polyline
                    key={a.key}
                    points={`${a.x1},${a.y1} ${a.midX},${a.y1} ${a.midX},${a.y2} ${a.x2 - 6},${a.y2}`}
                    fill="none"
                    stroke="#f97316"
                    strokeWidth={1.5}
                    strokeDasharray="3,2"
                    markerEnd="url(#gantt-arrow)"
                  />
                ))}
              </svg>
            )}

            {groups.map((g) => {
              const isCollapsed = collapsed.has(g.bereich);
              return (
                <div key={g.bereich}>
                  <div className="flex border-b border-zinc-800 bg-zinc-900/70">
                    <button
                      onClick={() => toggleGroup(g.bereich)}
                      className="sticky left-0 z-20 flex shrink-0 items-center gap-2 border-r border-zinc-800 bg-zinc-900/95 px-3 py-2 text-left text-xs font-semibold text-zinc-300 hover:bg-zinc-800/80"
                      style={{ width: LABEL_COL_WIDTH }}
                    >
                      <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${isCollapsed ? "-rotate-90" : ""}`} />
                      <span className="truncate">{BEREICH_LABEL[g.bereich]}</span>
                      <span className="shrink-0 font-normal text-zinc-500">({g.items.length})</span>
                    </button>
                    <div style={{ width: chartWidth }} />
                  </div>

                  {!isCollapsed &&
                    g.items.map(({ task, start, end }) => {
                      const rect = barRects.get(task.id)!;
                      const isDragging = drag?.taskId === task.id;
                      const left = isDragging ? rect.left + drag.deltaPx : rect.left;
                      return (
                        <div
                          key={task.id}
                          ref={(el) => {
                            if (el) rowElRefs.current.set(task.id, el);
                            else rowElRefs.current.delete(task.id);
                          }}
                          className="flex border-b border-zinc-800/60 last:border-0"
                        >
                          <button
                            onClick={() => setEditingTask(task)}
                            className="sticky left-0 z-20 flex shrink-0 items-center border-r border-zinc-800 bg-zinc-900/95 px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800/80 hover:text-orange-400"
                            style={{ width: LABEL_COL_WIDTH }}
                            title={task.title}
                          >
                            <span className="leading-snug">{task.title}</span>
                          </button>
                          <div className="relative" style={{ width: chartWidth, backgroundImage: weekendBg }}>
                            <div
                              onPointerDown={(e) => startDrag(e, task.id)}
                              onPointerMove={(e) => onDragMove(e, task.id)}
                              onPointerUp={() => endDrag(task, start, end)}
                              className={`absolute top-1/2 flex h-6 -translate-y-1/2 cursor-grab items-center overflow-hidden rounded-md px-2 text-[11px] font-medium whitespace-nowrap text-zinc-950 select-none active:cursor-grabbing ${GANTT_BAR_COLOR[task.status]}`}
                              style={{ left, width: rect.width, touchAction: "none" }}
                              title={`${task.title}: ${formatDate(task.startDatum!)} – ${formatDate(task.deadline!)} (ziehen zum Verschieben)`}
                            >
                              {pxPerDay >= 10 && BEREICH_LABEL[task.bereich]}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <TaskModal open={editingTask !== null} task={editingTask} onClose={() => setEditingTask(null)} />
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
