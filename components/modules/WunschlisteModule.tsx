"use client";

import { useState } from "react";
import { Sparkles, Send, AlertTriangle, HelpCircle, Hammer, CheckCircle2, Trash2 } from "lucide-react";
import { useBauSchlauStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import { BEREICH_LABEL } from "@/lib/types";
import type { Wunsch, WunschAnalyse } from "@/lib/types";

function WunschCard({ wunsch }: { wunsch: Wunsch }) {
  const updateWunsch = useBauSchlauStore((s) => s.updateWunsch);
  const deleteWunsch = useBauSchlauStore((s) => s.deleteWunsch);
  const addTask = useBauSchlauStore((s) => s.addTask);
  const [loading, setLoading] = useState(false);

  const runCheck = async () => {
    setLoading(true);
    try {
      const analyse = await api.ai.wunsch<WunschAnalyse>(wunsch.text);
      updateWunsch(wunsch.id, { analyse });
    } finally {
      setLoading(false);
    }
  };

  const uebernehmen = () => {
    if (!wunsch.analyse) return;
    wunsch.analyse.vorgeschlageneGewerke.forEach((g) => {
      addTask({
        title: g.titel,
        description: `Automatisch aus Wunschliste erzeugt: "${wunsch.text}"`,
        bereich: g.bereich,
        gewerk: g.gewerk,
        status: "offen",
        ausfuehrung: "handwerker",
        prioritaet: "mittel",
        wunschId: wunsch.id,
      });
    });
    updateWunsch(wunsch.id, { uebernommen: true });
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-zinc-100">{wunsch.text}</p>
        <button onClick={() => deleteWunsch(wunsch.id)} className="shrink-0 rounded-lg p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-400">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {!wunsch.analyse && (
        <button
          onClick={runCheck}
          disabled={loading}
          className="mt-3 flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-3 py-1.5 text-xs font-medium text-orange-400 hover:bg-orange-500/20 disabled:opacity-50"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {loading ? "Analysiere…" : "Interaktiven KI-Check starten"}
        </button>
      )}

      {wunsch.analyse && (
        <div className="mt-4 space-y-4">
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <AlertTriangle className="h-3.5 w-3.5" /> Wichtige Hinweise &amp; Schnittstellen
            </div>
            <ul className="space-y-1 text-sm text-zinc-300">
              {wunsch.analyse.hinweise.map((h, i) => (
                <li key={i} className="flex gap-2"><span className="text-zinc-600">–</span>{h}</li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-blue-400">
              <HelpCircle className="h-3.5 w-3.5" /> Gezielte Rückfragen zur Konkretisierung
            </div>
            <ul className="space-y-1 text-sm text-zinc-300">
              {wunsch.analyse.rueckfragen.map((r, i) => (
                <li key={i} className="flex gap-2"><span className="text-zinc-600">–</span>{r}</li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <Hammer className="h-3.5 w-3.5" /> Vorgeschlagene Gewerke
            </div>
            <div className="flex flex-wrap gap-1.5">
              {wunsch.analyse.vorgeschlageneGewerke.map((g, i) => (
                <span key={i} className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-300">
                  {g.titel} <span className="text-zinc-500">· {BEREICH_LABEL[g.bereich]}</span>
                </span>
              ))}
            </div>
          </div>

          {wunsch.uebernommen ? (
            <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> In Projektplan übernommen
            </div>
          ) : (
            <button
              onClick={uebernehmen}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/25"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> In Projektplan übernehmen
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function WunschlisteModule() {
  const wuensche = useBauSchlauStore((s) => s.wuensche);
  const addWunsch = useBauSchlauStore((s) => s.addWunsch);
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    addWunsch(text.trim());
    setText("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-100">Wunschliste &amp; Ideen-Fabrik</h2>
        <p className="text-sm text-zinc-500">
          Trag alles ein, was dir zur Sanierung einfällt – die KI prüft jeden Wunsch auf Schnittstellen, stellt Rückfragen und schlägt Gewerke vor.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='z. B. "Klimaanlage im OG", "Großes Dachfenster", "Ankleidezimmer", "Balkon anbauen", "Smart-Home Lichtleisten"…'
          rows={2}
          className="flex-1 resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
        <button
          type="submit"
          className="flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-orange-400 sm:self-end"
        >
          <Send className="h-4 w-4" /> Hinzufügen
        </button>
      </form>

      {wuensche.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 py-12 text-center text-sm text-zinc-500">
          Noch keine Wünsche eingetragen. Starte mit deiner ersten Idee oben.
        </div>
      ) : (
        <div className="space-y-3">
          {wuensche.map((w) => (
            <WunschCard key={w.id} wunsch={w} />
          ))}
        </div>
      )}
    </div>
  );
}
