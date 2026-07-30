import type { Bereich, Task } from "./types";

export type BereichVisualStatus = "offen" | "in_arbeit" | "erledigt";

export function computeBereichStatus(tasks: Task[], bereich: Bereich): BereichVisualStatus {
  const inBereich = tasks.filter((t) => t.bereich === bereich);
  if (inBereich.length === 0) return "offen";
  if (inBereich.every((t) => t.status === "erledigt")) return "erledigt";
  if (inBereich.some((t) => t.status === "in_arbeit" || t.status === "wartend" || t.status === "blockiert")) {
    return "in_arbeit";
  }
  return "offen";
}

export function bereichFortschritt(tasks: Task[], bereich: Bereich): { erledigt: number; gesamt: number } {
  const inBereich = tasks.filter((t) => t.bereich === bereich);
  return { erledigt: inBereich.filter((t) => t.status === "erledigt").length, gesamt: inBereich.length };
}
