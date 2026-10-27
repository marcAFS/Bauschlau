"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { useBauSchlauStore } from "@/lib/store";
import { formatCurrency } from "@/lib/ui-helpers";
import { berechneBudget, parseGeld, postenWert, verteileFinanzierung, zahlFormat, type Anteil } from "@/lib/budget-calc";
import type { BudgetPosten } from "@/lib/types";
import BudgetSankey, { type SankeyFluss, type SankeyKnoten } from "@/components/BudgetSankey";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none";

const VORSCHLAEGE = [
  "Dach",
  "PV-Anlage",
  "Küche",
  "Dämmung außen",
  "Estrich",
  "Fenster",
  "Heizung",
  "Elektrik",
  "Bad",
  "Fassade/Putz",
  "Bodenbeläge",
  "Außenanlagen",
];

const FARBE_EK = "#34d399";
const FARBE_BANK = "#60a5fa";
const FARBE_KFW = "#fbbf24";
const FARBE_FEHLBETRAG = "#f87171";
const FARBE_PLAN = "#818cf8";
const FARBE_UMGESETZT = "#10b981";
const FARBE_REST = "#a1a1aa";

// Geldfeld: tippt sich als Rohtext, wird erst beim Verlassen geparst und gespeichert.
function MoneyInput({
  value,
  onCommit,
  placeholder = "0",
  ariaLabel,
}: {
  value?: number;
  onCommit: (v: number | undefined) => void;
  placeholder?: string;
  ariaLabel: string;
}) {
  const [text, setText] = useState<string | null>(null);
  const anzeige = text ?? (value ? zahlFormat.format(value) : "");
  return (
    <div className="relative">
      <input
        inputMode="decimal"
        aria-label={ariaLabel}
        className={`${inputClass} pr-7 text-right tabular-nums`}
        placeholder={placeholder}
        value={anzeige}
        onFocus={() => setText(value ? String(value).replace(".", ",") : "")}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          if (text !== null) {
            const parsed = parseGeld(text);
            if (text.trim() === "" || parsed !== undefined) onCommit(parsed);
            setText(null);
          }
        }}
        onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500">€</span>
    </div>
  );
}

function NameInput({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [text, setText] = useState<string | null>(null);
  return (
    <input
      aria-label="Bezeichnung"
      className="w-full min-w-0 bg-transparent text-sm font-medium text-zinc-100 focus:outline-none focus:ring-0"
      value={text ?? value}
      onFocus={() => setText(value)}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        if (text !== null && text.trim() && text.trim() !== value) onCommit(text.trim());
        setText(null);
      }}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
    />
  );
}

function Kachel({ label, wert, sub, farbe = "text-zinc-100" }: { label: string; wert: string; sub?: string; farbe?: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold tabular-nums ${farbe}`}>{wert}</p>
      {sub && <p className="text-[11px] text-zinc-500">{sub}</p>}
    </div>
  );
}

// Regler: Aufteilung des Nicht-KfW-Rests einer Position auf Bank und Eigenkapital.
// Die Töpfe sind endlich: Was andere Positionen schon belegen, steht hier nicht mehr zur Verfügung.
function AufteilungsRegler({ posten, anteil, freiBank, freiEk }: { posten: BudgetPosten; anteil: Anteil; freiBank: number; freiEk: number }) {
  const updateBudgetPosten = useBauSchlauStore((s) => s.updateBudgetPosten);
  const [zieh, setZieh] = useState<number | null>(null);
  const ziehRef = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const istRef = useRef(0);

  const rest = anteil.bank + anteil.ek + anteil.fehlbetrag;

  const maxBank = Math.min(rest, anteil.bank + freiBank);
  const minBank = Math.min(Math.max(0, rest - anteil.ek - freiEk), maxBank);
  const minPct = rest > 0 ? (minBank / rest) * 100 : 0;
  const maxPct = rest > 0 ? (maxBank / rest) * 100 : 0;
  const istPct = rest > 0 ? (anteil.bank / rest) * 100 : 0;

  // Änderungen werden entprellt gespeichert; unveränderte Werte lassen die Position automatisch.
  const speichern = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    const wert = ziehRef.current;
    ziehRef.current = null;
    setZieh(null);
    if (wert !== null && Math.abs(wert - istRef.current) > 0.05) {
      updateBudgetPosten(posten.id, { bankAnteil: Math.round(wert * 10) / 10 });
    }
  };
  useEffect(() => {
    istRef.current = istPct;
  });
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  if (rest < 0.5) return null;

  const pct = Math.min(Math.max(zieh ?? istPct, minPct), maxPct);
  const bank = (rest * pct) / 100;
  const ek = rest - bank;
  const manuell = posten.bankAnteil != null;
  const festgelegt = maxPct - minPct < 0.5;

  const geaendert = (roh: number) => {
    const wert = Math.min(Math.max(roh, minPct), maxPct);
    ziehRef.current = wert;
    setZieh(wert);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(speichern, 500);
  };

  return (
    <div className="mt-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-2.5">
      <div className="mb-1.5 flex items-center justify-between text-[11px]">
        <span className="font-medium text-blue-300">Bank {formatCurrency(bank)}</span>
        <span className="text-zinc-500">{manuell ? "manuell" : "automatisch"}</span>
        <span className="font-medium text-emerald-300">Eigenkapital {formatCurrency(ek)}</span>
      </div>
      <div className="relative h-5">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-zinc-800">
          <div className="absolute inset-y-0 bg-zinc-600" style={{ left: `${minPct}%`, width: `${Math.max(maxPct - minPct, 0)}%` }} />
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={0.1}
          value={pct}
          disabled={festgelegt}
          aria-label={`Aufteilung Bank/Eigenkapital ${posten.name}`}
          onChange={(e) => geaendert(Number(e.target.value))}
          onPointerUp={speichern}
          onKeyUp={speichern}
          onBlur={speichern}
          className="absolute inset-0 h-5 w-full cursor-pointer appearance-none bg-transparent disabled:cursor-not-allowed disabled:opacity-40 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-orange-500 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500"
        />
      </div>
      <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-amber-400/90">
        <span>
          {festgelegt
            ? "Bank und Eigenkapital sind ausgeschöpft – nichts zu verschieben."
            : [pct >= maxPct - 0.05 && freiBank < 0.5 ? "Bank ausgeschöpft" : "", pct <= minPct + 0.05 && freiEk < 0.5 ? "Eigenkapital ausgeschöpft" : ""].filter(Boolean).join(" · ")}
        </span>
        {manuell && (
          <button onClick={() => updateBudgetPosten(posten.id, { bankAnteil: null })} className="shrink-0 rounded-md border border-zinc-700 px-2 py-0.5 text-zinc-300 hover:text-white">
            Auto
          </button>
        )}
      </div>
    </div>
  );
}

function PostenZeile({ posten, anteil, freiBank, freiEk }: { posten: BudgetPosten; anteil?: Anteil; freiBank: number; freiEk: number }) {
  const updateBudgetPosten = useBauSchlauStore((s) => s.updateBudgetPosten);
  const deleteBudgetPosten = useBauSchlauStore((s) => s.deleteBudgetPosten);
  const abweichung = posten.ist !== undefined && posten.umgesetzt ? posten.ist - posten.geplant : undefined;
  const finanzierung = anteil
    ? [
        { label: "KfW", wert: anteil.kfw, farbe: "text-amber-300" },
        { label: "Bank", wert: anteil.bank, farbe: "text-blue-300" },
        { label: "Eigenkapital", wert: anteil.ek, farbe: "text-emerald-300" },
        { label: "ungedeckt", wert: anteil.fehlbetrag, farbe: "text-red-400" },
      ].filter((f) => f.wert >= 0.5)
    : [];

  return (
    <div className={`rounded-lg border p-3 ${posten.umgesetzt ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-800 bg-zinc-900/40"}`}>
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateBudgetPosten(posten.id, { umgesetzt: !posten.umgesetzt })}
          title={posten.umgesetzt ? "Als noch nicht umgesetzt markieren" : "Als umgesetzt markieren"}
          className={`shrink-0 ${posten.umgesetzt ? "text-emerald-400" : "text-zinc-600 hover:text-zinc-300"}`}
        >
          {posten.umgesetzt ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
        </button>
        <NameInput value={posten.name} onCommit={(name) => updateBudgetPosten(posten.id, { name })} />
        <button onClick={() => deleteBudgetPosten(posten.id)} className="shrink-0 rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400" title="Löschen">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[11px] text-zinc-500">Geplant</label>
          <MoneyInput ariaLabel={`Geplant ${posten.name}`} value={posten.geplant} onCommit={(v) => updateBudgetPosten(posten.id, { geplant: v ?? 0 })} />
        </div>
        <div>
          <label className="mb-1 block text-[11px] text-zinc-500">Tatsächlich (Ist)</label>
          <MoneyInput
            ariaLabel={`Ist ${posten.name}`}
            value={posten.ist}
            placeholder="noch offen"
            onCommit={(v) => updateBudgetPosten(posten.id, { ist: v })}
          />
        </div>
      </div>
      <button
        onClick={() => updateBudgetPosten(posten.id, { kfwFaehig: !posten.kfwFaehig })}
        aria-pressed={posten.kfwFaehig}
        title="Nur wenn die Maßnahme nach deinem KfW-Programm förderfähig ist"
        className={`mt-2 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
          posten.kfwFaehig ? "border-amber-500/60 bg-amber-500/15 text-amber-300" : "border-zinc-700 text-zinc-500 hover:text-zinc-300"
        }`}
      >
        {posten.kfwFaehig ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />} KfW-förderfähig
      </button>
      {finanzierung.length > 0 && (
        <p className="mt-1.5 text-[11px] text-zinc-500">
          Finanziert aus:{" "}
          {finanzierung.map((f, i) => (
            <span key={f.label}>
              {i > 0 && " · "}
              <span className={f.farbe}>
                {f.label} {formatCurrency(f.wert)}
              </span>
            </span>
          ))}
        </p>
      )}
      {anteil && <AufteilungsRegler key={String(posten.bankAnteil ?? "auto")} posten={posten} anteil={anteil} freiBank={freiBank} freiEk={freiEk} />}
      {abweichung !== undefined && abweichung !== 0 && (
        <p className={`mt-1.5 text-[11px] ${abweichung > 0 ? "text-red-400" : "text-emerald-400"}`}>
          {formatCurrency(Math.abs(abweichung))} {abweichung > 0 ? "teurer" : "günstiger"} als geplant
        </p>
      )}
    </div>
  );
}

export default function BudgetPlanungModule() {
  const budgetPlan = useBauSchlauStore((s) => s.budgetPlan);
  const budgetPosten = useBauSchlauStore((s) => s.budgetPosten);
  const setBudgetPlan = useBauSchlauStore((s) => s.setBudgetPlan);
  const addBudgetPosten = useBauSchlauStore((s) => s.addBudgetPosten);

  const [neuerName, setNeuerName] = useState("");
  const [neuerBetrag, setNeuerBetrag] = useState<number | undefined>(undefined);

  const kennzahlen = useMemo(() => berechneBudget(budgetPlan, budgetPosten), [budgetPlan, budgetPosten]);
  const { budget, geplant, ausgegeben, prognose } = kennzahlen;

  const verteilung = useMemo(() => verteileFinanzierung(budgetPlan, budgetPosten), [budgetPlan, budgetPosten]);
  const { ungenutzt, kfwGenutzt, foerderfaehigeKosten } = verteilung;
  const fehlbetrag = Object.values(verteilung.anteile).reduce((a, x) => a + x.fehlbetrag, 0);
  const frei = ungenutzt.bank + ungenutzt.ek;

  const quellen = useMemo<SankeyKnoten[]>(() => {
    const liste: SankeyKnoten[] = [
      { key: "kfw", label: "KfW-Darlehen", value: budgetPlan.kfwDarlehen, color: FARBE_KFW, detail: "zweckgebunden" },
      { key: "bank", label: "Bankdarlehen", value: budgetPlan.bankDarlehen, color: FARBE_BANK },
      { key: "ek", label: "Eigenkapital", value: budgetPlan.eigenkapital, color: FARBE_EK },
    ].filter((q) => q.value > 0);
    if (fehlbetrag >= 0.5) liste.push({ key: "fehl", label: "Fehlbetrag (ungedeckt)", value: fehlbetrag, color: FARBE_FEHLBETRAG });
    return liste;
  }, [budgetPlan, fehlbetrag]);

  const ziele = useMemo<SankeyKnoten[]>(() => {
    const liste: SankeyKnoten[] = budgetPosten
      .filter((p) => postenWert(p) > 0)
      .sort((a, b) => postenWert(b) - postenWert(a))
      .map((p) => {
        let detail = "geplant";
        if (p.umgesetzt) detail = p.ist !== undefined && p.ist !== p.geplant ? `umgesetzt · Plan ${formatCurrency(p.geplant)}` : "umgesetzt";
        else if (p.ist) detail = `geplant · bisher ${formatCurrency(p.ist)}`;
        return { key: p.id, label: p.name, value: postenWert(p), color: p.umgesetzt ? FARBE_UMGESETZT : FARBE_PLAN, detail, geplant: !p.umgesetzt };
      });
    // Nicht verplante Mittel je Quelle getrennt ausweisen, damit sichtbar ist, was von wem übrig bleibt.
    const rest: { key: string; wert: number; quelle: string }[] = [
      { key: "frei-kfw", wert: ungenutzt.kfw, quelle: "KfW-Darlehen" },
      { key: "frei-bank", wert: ungenutzt.bank, quelle: "Bankdarlehen" },
      { key: "frei-ek", wert: ungenutzt.ek, quelle: "Eigenkapital" },
    ];
    for (const r of rest) {
      if (r.wert >= 0.5) liste.push({ key: r.key, label: "Nicht verplant", value: r.wert, color: FARBE_REST, detail: r.quelle });
    }
    return liste;
  }, [budgetPosten, ungenutzt]);

  const fluesse = useMemo<SankeyFluss[]>(() => {
    const liste: SankeyFluss[] = [];
    for (const [id, a] of Object.entries(verteilung.anteile)) {
      liste.push({ von: "kfw", nach: id, value: a.kfw }, { von: "bank", nach: id, value: a.bank }, { von: "ek", nach: id, value: a.ek }, { von: "fehl", nach: id, value: a.fehlbetrag });
    }
    liste.push({ von: "kfw", nach: "frei-kfw", value: ungenutzt.kfw }, { von: "bank", nach: "frei-bank", value: ungenutzt.bank }, { von: "ek", nach: "frei-ek", value: ungenutzt.ek });
    return liste;
  }, [verteilung, ungenutzt]);

  const vorhandene = new Set(budgetPosten.map((p) => p.name.trim().toLowerCase()));
  const offeneVorschlaege = VORSCHLAEGE.filter((v) => !vorhandene.has(v.toLowerCase()));

  const hinzufuegen = () => {
    if (!neuerName.trim()) return;
    addBudgetPosten({ name: neuerName.trim(), geplant: neuerBetrag ?? 0 });
    setNeuerName("");
    setNeuerBetrag(undefined);
  };

  const anteile = [
    { label: "Eigenkapital", wert: budgetPlan.eigenkapital, farbe: FARBE_EK },
    { label: "Bankdarlehen", wert: budgetPlan.bankDarlehen, farbe: FARBE_BANK },
    { label: "KfW-Darlehen", wert: budgetPlan.kfwDarlehen, farbe: FARBE_KFW },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-1 text-sm font-semibold text-zinc-300">Finanzierung</h3>
        <p className="mb-3 text-xs text-zinc-500">Woher kommt das Geld? Die Summe ist dein Gesamtbudget. Das KfW-Darlehen ist zweckgebunden und wird nur für förderfähige Positionen eingesetzt. Den Rest deckt automatisch zuerst die Bank, dann das Eigenkapital – pro Position kannst du das mit dem Regler selbst festlegen.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {anteile.map((a, i) => (
            <div key={a.label} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: a.farbe }} />
                {a.label}
              </label>
              <MoneyInput
                ariaLabel={a.label}
                value={a.wert}
                onCommit={(v) =>
                  setBudgetPlan(i === 0 ? { eigenkapital: v ?? 0 } : i === 1 ? { bankDarlehen: v ?? 0 } : { kfwDarlehen: v ?? 0 })
                }
              />
            </div>
          ))}
        </div>
        {budget > 0 && (
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-zinc-800" aria-hidden>
            {anteile.map((a) => (
              <div key={a.label} style={{ width: `${(a.wert / budget) * 100}%`, backgroundColor: a.farbe }} />
            ))}
          </div>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kachel label="Gesamtbudget" wert={formatCurrency(budget)} />
        <Kachel label="Geplant" wert={formatCurrency(geplant)} sub="Summe aller Planwerte" />
        <Kachel label="Bisher angefallen" wert={formatCurrency(ausgegeben)} sub="Summe der Ist-Werte" />
        <Kachel label="Prognose" wert={formatCurrency(prognose)} sub="Ist, wo umgesetzt – sonst Plan" />
        <Kachel
          label="KfW genutzt"
          wert={formatCurrency(kfwGenutzt)}
          sub={`von ${formatCurrency(budgetPlan.kfwDarlehen)} · förderfähig: ${formatCurrency(foerderfaehigeKosten)}`}
          farbe="text-amber-300"
        />
        <Kachel
          label={fehlbetrag >= 0.5 ? "Fehlbetrag" : "Noch frei"}
          wert={formatCurrency(fehlbetrag >= 0.5 ? fehlbetrag : frei)}
          farbe={fehlbetrag >= 0.5 ? "text-red-400" : "text-emerald-400"}
          sub={fehlbetrag >= 0.5 ? "Kosten ohne passende Finanzierung" : "Bank + Eigenkapital, nicht verplant"}
        />
      </section>

      {ungenutzt.kfw >= 0.5 && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          {formatCurrency(ungenutzt.kfw)} des KfW-Darlehens haben keine förderfähige Position. Das Darlehen ist zweckgebunden – markiere weitere passende Positionen als „KfW-förderfähig“, sonst kann dieser Teil nicht eingesetzt werden.
        </p>
      )}
      {fehlbetrag >= 0.5 && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          {formatCurrency(fehlbetrag)} der geplanten Kosten sind nicht durch Bank, Eigenkapital oder KfW gedeckt.
        </p>
      )}

      <section>
        <h3 className="mb-1 text-sm font-semibold text-zinc-300">Mittelverwendung</h3>
        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-4 rounded-sm" style={{ backgroundColor: FARBE_UMGESETZT }} /> umgesetzt (Ist)
          </span>
          <span className="flex items-center gap-1.5">
            <span
              className="h-2.5 w-4 rounded-sm border"
              style={{ borderColor: FARBE_PLAN, backgroundImage: `repeating-linear-gradient(45deg, ${FARBE_PLAN}90 0 2px, transparent 2px 5px)` }}
            />
            geplant
          </span>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
          {budget <= 0 && ziele.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">Trage oben deine Finanzierung ein und lege unten Positionen an – dann entsteht hier der Geldfluss.</p>
          ) : quellen.length === 0 || ziele.length === 0 ? (
            <p className="py-8 text-center text-sm text-zinc-500">
              {quellen.length === 0 ? "Trage mindestens einen Finanzierungswert ein." : "Lege mindestens eine Position mit einem Betrag an."}
            </p>
          ) : (
            <BudgetSankey quellen={quellen} ziele={ziele} fluesse={fluesse} />
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-sm font-semibold text-zinc-300">Positionen ({budgetPosten.length})</h3>
        <p className="mb-3 text-xs text-zinc-500">Plan-Wert eintragen, später den tatsächlichen Betrag ergänzen und per Haken als umgesetzt markieren. „KfW-förderfähig“ nur setzen, wenn die Maßnahme von deinem KfW-Darlehen bezahlt werden darf.</p>

        <div className="mb-3 flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 sm:flex-row">
          <input
            className={inputClass}
            placeholder="Neue Position, z. B. Dach"
            value={neuerName}
            onChange={(e) => setNeuerName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && hinzufuegen()}
          />
          <div className="sm:w-44">
            <MoneyInput ariaLabel="Geplanter Betrag neue Position" value={neuerBetrag} onCommit={setNeuerBetrag} placeholder="Plan-Wert" />
          </div>
          <button
            onClick={hinzufuegen}
            disabled={!neuerName.trim()}
            className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-sm font-semibold text-zinc-950 hover:bg-orange-400 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> Hinzufügen
          </button>
        </div>

        {offeneVorschlaege.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {offeneVorschlaege.map((v) => (
              <button
                key={v}
                onClick={() => addBudgetPosten({ name: v })}
                className="rounded-full border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              >
                + {v}
              </button>
            ))}
          </div>
        )}

        {budgetPosten.length === 0 ? (
          <p className="text-sm text-zinc-500">Noch keine Positionen. Nutze die Vorschläge oben oder lege eigene an.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {budgetPosten.map((p) => (
              <PostenZeile key={p.id} posten={p} anteil={verteilung.anteile[p.id]} freiBank={ungenutzt.bank} freiEk={ungenutzt.ek} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
