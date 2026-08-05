"use client";

import { useMemo, useRef, useState } from "react";
import { Wallet, Upload, Download, FileText, Trash2 } from "lucide-react";
import { useBauSchlauStore } from "@/lib/store";
import { formatCurrency, formatDate } from "@/lib/ui-helpers";
import type { Rechnung } from "@/lib/types";
import GewerkSelect from "@/components/GewerkSelect";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 focus:border-orange-500 focus:outline-none";

function SollIstVergleich() {
  const tasks = useBauSchlauStore((s) => s.tasks);

  const perGewerk = useMemo(() => {
    const map = new Map<string, { soll: number; ist: number }>();
    tasks.forEach((t) => {
      if (!t.budgetSoll && !t.budgetIst) return;
      const cur = map.get(t.gewerk) ?? { soll: 0, ist: 0 };
      cur.soll += t.budgetSoll ?? 0;
      cur.ist += t.budgetIst ?? 0;
      map.set(t.gewerk, cur);
    });
    return Array.from(map.entries());
  }, [tasks]);

  const gesamtSoll = perGewerk.reduce((a, [, v]) => a + v.soll, 0);
  const gesamtIst = perGewerk.reduce((a, [, v]) => a + v.ist, 0);

  if (perGewerk.length === 0) {
    return <p className="text-sm text-zinc-500">Noch keine Budget-Werte an Aufgaben hinterlegt (Budget Soll/Ist im Aufgaben-Formular).</p>;
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
          <p className="text-xs text-zinc-500">Budget Soll (gesamt)</p>
          <p className="text-lg font-semibold text-zinc-100">{formatCurrency(gesamtSoll)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
          <p className="text-xs text-zinc-500">Budget Ist (gesamt)</p>
          <p className="text-lg font-semibold text-zinc-100">{formatCurrency(gesamtIst)}</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
          <p className="text-xs text-zinc-500">Differenz</p>
          <p className={`text-lg font-semibold ${gesamtIst > gesamtSoll ? "text-red-400" : "text-emerald-400"}`}>
            {formatCurrency(gesamtSoll - gesamtIst)}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {perGewerk.map(([gewerk, v]) => {
          const pct = v.soll > 0 ? Math.min((v.ist / v.soll) * 100, 150) : 0;
          const over = v.ist > v.soll;
          return (
            <div key={gewerk} className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-zinc-200">{gewerk}</span>
                <span className="text-zinc-400">
                  {formatCurrency(v.ist)} / {formatCurrency(v.soll)}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                <div className={`h-full rounded-full ${over ? "bg-red-500" : "bg-orange-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RechnungUpload() {
  const addRechnung = useBauSchlauStore((s) => s.addRechnung);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ dateiName: string; dataUrl: string } | null>(null);
  const [form, setForm] = useState({
    betrag: "",
    datum: new Date().toISOString().slice(0, 10),
    gewerk: "",
    wohneinheit: "eigennutzung" as Rechnung["wohneinheit"],
    absetzbarkeit: "nein" as Rechnung["absetzbarkeit"],
    absetzbarProzent: "",
    foerderung: "keine" as Rechnung["foerderung"],
  });

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setPending({ dateiName: file.name, dataUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!pending) return;
    addRechnung({
      dateiName: pending.dateiName,
      dataUrl: pending.dataUrl,
      betrag: form.betrag ? Number(form.betrag) : undefined,
      datum: form.datum,
      gewerk: form.gewerk || undefined,
      wohneinheit: form.wohneinheit,
      absetzbarkeit: form.absetzbarkeit,
      absetzbarProzent: form.absetzbarProzent ? Number(form.absetzbarProzent) : undefined,
      foerderung: form.foerderung,
    });
    setPending(null);
    setForm({ betrag: "", datum: new Date().toISOString().slice(0, 10), gewerk: "", wohneinheit: "eigennutzung", absetzbarkeit: "nein", absetzbarProzent: "", foerderung: "keine" });
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-700 py-4 text-sm text-zinc-400 hover:border-orange-500 hover:text-orange-400"
      >
        <Upload className="h-4 w-4" /> Rechnung (Foto/PDF) auswählen
      </button>

      {pending && (
        <div className="space-y-3">
          <p className="text-xs text-zinc-400">Datei: {pending.dateiName}</p>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" step="0.01" placeholder="Betrag (€)" className={inputClass} value={form.betrag} onChange={(e) => setForm((f) => ({ ...f, betrag: e.target.value }))} />
            <input type="date" className={inputClass} value={form.datum} onChange={(e) => setForm((f) => ({ ...f, datum: e.target.value }))} />
            <GewerkSelect value={form.gewerk} onChange={(v) => setForm((f) => ({ ...f, gewerk: v }))} className={inputClass} />
            <select className={inputClass} value={form.wohneinheit} onChange={(e) => setForm((f) => ({ ...f, wohneinheit: e.target.value as Rechnung["wohneinheit"] }))}>
              <option value="eigennutzung">Eigennutzung</option>
              <option value="mietwohnung">Mietwohnung</option>
              <option value="allgemein">Allgemein</option>
            </select>
            <select className={inputClass} value={form.absetzbarkeit} onChange={(e) => setForm((f) => ({ ...f, absetzbarkeit: e.target.value as Rechnung["absetzbarkeit"] }))}>
              <option value="nein">Nicht absetzbar</option>
              <option value="voll">100% Absetzbar</option>
              <option value="anteilig">Anteilsmäßig</option>
            </select>
            {form.absetzbarkeit === "anteilig" && (
              <input type="number" placeholder="% Absetzbar" className={inputClass} value={form.absetzbarProzent} onChange={(e) => setForm((f) => ({ ...f, absetzbarProzent: e.target.value }))} />
            )}
            <select className={inputClass} value={form.foerderung} onChange={(e) => setForm((f) => ({ ...f, foerderung: e.target.value as Rechnung["foerderung"] }))}>
              <option value="keine">Keine Förderung</option>
              <option value="kfw">KfW</option>
              <option value="bafa">BAFA</option>
            </select>
          </div>
          <button onClick={submit} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-orange-400">
            Rechnung speichern
          </button>
        </div>
      )}
    </div>
  );
}

function exportCsv(rechnungen: Rechnung[]) {
  const header = ["Datum", "Gewerk", "Betrag", "Wohneinheit", "Absetzbarkeit", "Prozent", "Förderung", "Dateiname"];
  const rows = rechnungen.map((r) => [
    r.datum,
    r.gewerk ?? "",
    r.betrag?.toString() ?? "",
    r.wohneinheit,
    r.absetzbarkeit,
    r.absetzbarProzent?.toString() ?? "",
    r.foerderung,
    r.dateiName,
  ]);
  const csv = [header, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bau-schlau-steuer-export-${new Date().getFullYear()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function BudgetModule() {
  const rechnungen = useBauSchlauStore((s) => s.rechnungen);
  const deleteRechnung = useBauSchlauStore((s) => s.deleteRechnung);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
          <Wallet className="h-5 w-5 text-orange-400" /> Budget, Rechnungen, Steuern &amp; Förderungen
        </h2>
        <p className="text-sm text-zinc-500">Soll/Ist-Vergleich, Rechnungs-Upload mit Steuer-Flags und Jahresend-Export für den Steuerberater.</p>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-zinc-300">Soll/Ist-Kostenvergleich pro Gewerk</h3>
        <SollIstVergleich />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-zinc-300">Rechnungs-Upload</h3>
        <RechnungUpload />
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-300">Rechnungsübersicht ({rechnungen.length})</h3>
          {rechnungen.length > 0 && (
            <button onClick={() => exportCsv(rechnungen)} className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-700">
              <Download className="h-3.5 w-3.5" /> Steuer-Export (CSV)
            </button>
          )}
        </div>
        <div className="space-y-2">
          {rechnungen.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
              <FileText className="h-8 w-8 shrink-0 text-zinc-500" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-200">{r.dateiName}</p>
                <p className="text-xs text-zinc-500">
                  {formatDate(r.datum)} · {r.gewerk || "–"} · {formatCurrency(r.betrag)} · {r.wohneinheit} ·{" "}
                  {r.absetzbarkeit === "voll" ? "100% absetzbar" : r.absetzbarkeit === "anteilig" ? `${r.absetzbarProzent ?? 0}% absetzbar` : "nicht absetzbar"}
                  {r.foerderung !== "keine" && ` · ${r.foerderung.toUpperCase()}`}
                </p>
              </div>
              <button onClick={() => deleteRechnung(r.id)} className="shrink-0 rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
