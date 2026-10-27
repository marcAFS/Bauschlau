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

export interface Anteil {
  kfw: number;
  bank: number;
  ek: number;
  fehlbetrag: number;
}

export interface Verteilung {
  anteile: Record<string, Anteil>;
  /** Nicht abgerufene/verplante Mittel je Quelle. */
  ungenutzt: { kfw: number; bank: number; ek: number };
  foerderfaehigeKosten: number;
  kfwGenutzt: number;
}

// Verteilt die Finanzierung auf die Positionen:
// 1. KfW zweckgebunden – nur in förderfähige Positionen, anteilig nach Kosten.
// 2. Den Rest deckt zuerst das Bankdarlehen (anteilig), danach das Eigenkapital.
// 3. Was dann noch fehlt, ist Fehlbetrag.
export function verteileFinanzierung(plan: BudgetPlan, posten: BudgetPosten[]): Verteilung {
  const items = posten.map((p) => ({ p, wert: postenWert(p) })).filter((i) => i.wert > 0);

  const foerderfaehigeKosten = items.filter((i) => i.p.kfwFaehig).reduce((a, i) => a + i.wert, 0);
  const kfwGenutzt = Math.min(plan.kfwDarlehen, foerderfaehigeKosten);

  const nachKfw = items.map((i) => {
    const kfw = i.p.kfwFaehig && foerderfaehigeKosten > 0 ? (kfwGenutzt * i.wert) / foerderfaehigeKosten : 0;
    return { ...i, kfw, rest: i.wert - kfw };
  });
  const restNachKfw = nachKfw.reduce((a, i) => a + i.rest, 0);

  const bankGenutzt = Math.min(plan.bankDarlehen, restNachKfw);
  const nachBank = nachKfw.map((i) => {
    const bank = restNachKfw > 0 ? (bankGenutzt * i.rest) / restNachKfw : 0;
    return { ...i, bank, rest2: i.rest - bank };
  });
  const restNachBank = restNachKfw - bankGenutzt;

  const ekGenutzt = Math.min(plan.eigenkapital, restNachBank);
  const anteile: Record<string, Anteil> = {};
  for (const i of nachBank) {
    const ek = restNachBank > 0 ? (ekGenutzt * i.rest2) / restNachBank : 0;
    anteile[i.p.id] = { kfw: i.kfw, bank: i.bank, ek, fehlbetrag: Math.max(i.rest2 - ek, 0) };
  }

  return {
    anteile,
    ungenutzt: {
      kfw: plan.kfwDarlehen - kfwGenutzt,
      bank: plan.bankDarlehen - bankGenutzt,
      ek: plan.eigenkapital - ekGenutzt,
    },
    foerderfaehigeKosten,
    kfwGenutzt,
  };
}
