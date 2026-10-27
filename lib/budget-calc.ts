import type { BudgetPlan, BudgetPosten } from "./types";

// Wert, mit dem ein Posten in die Prognose eingeht: umgesetzte Maßnahmen zählen
// mit ihrem Ist-Wert (fallback Plan), offene mit dem Plan - oder, falls schon mehr
// angefallen ist als geplant, mit dem bisher Angefallenen.
export function postenWert(p: BudgetPosten): number {
  if (p.umgesetzt) return p.ist ?? p.geplant;
  return Math.max(p.geplant, p.ist ?? 0);
}

export function berechneBudget(plan: BudgetPlan, posten: BudgetPosten[]) {
  const budget = plan.bankDarlehen + plan.eigenkapital + plan.kfwDarlehen;
  const geplant = posten.reduce((a, p) => a + p.geplant, 0);
  const ausgegeben = posten.reduce((a, p) => a + (p.ist ?? 0), 0);
  const prognose = posten.reduce((a, p) => a + postenWert(p), 0);
  return { budget, geplant, ausgegeben, prognose, rest: budget - prognose };
}

// Akzeptiert deutsche Eingaben wie "250.000", "250.000,50", "1234,5" oder "45000 €".
export function parseGeld(input: string): number | undefined {
  let s = input.replace(/[€\s]/g, "");
  if (!s) return undefined;
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, "");
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

export const zahlFormat = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 });
