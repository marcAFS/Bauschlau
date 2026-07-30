import type { TaskStatus, Prioritaet, MaterialStatus } from "./types";

export const STATUS_STYLES: Record<TaskStatus, string> = {
  offen: "bg-zinc-700/40 text-zinc-300 border-zinc-600/50",
  in_arbeit: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  wartend: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  blockiert: "bg-red-500/15 text-red-400 border-red-500/30",
  erledigt: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export const PRIORITAET_STYLES: Record<Prioritaet, string> = {
  niedrig: "bg-zinc-700/40 text-zinc-400",
  mittel: "bg-amber-500/15 text-amber-400",
  hoch: "bg-red-500/15 text-red-400",
};

export const PRIORITAET_LABEL: Record<Prioritaet, string> = {
  niedrig: "Niedrig",
  mittel: "Mittel",
  hoch: "Hoch",
};

export const MATERIAL_STATUS_LABEL: Record<MaterialStatus, string> = {
  muss_bestellt: "Muss bestellt werden",
  bestellt: "Bestellt",
  vor_ort: "Vor Ort",
};

export const MATERIAL_STATUS_STYLES: Record<MaterialStatus, string> = {
  muss_bestellt: "bg-red-500/15 text-red-400",
  bestellt: "bg-amber-500/15 text-amber-400",
  vor_ort: "bg-emerald-500/15 text-emerald-400",
};

export function formatCurrency(n: number | undefined): string {
  if (n === undefined || n === null || isNaN(n)) return "–";
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return "–";
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(iso)
  );
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return "–";
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
