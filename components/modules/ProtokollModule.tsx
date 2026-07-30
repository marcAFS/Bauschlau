"use client";

import { useState } from "react";
import { Mic, Sparkles, ClipboardCheck, ScrollText, CalendarClock, CheckCircle2 } from "lucide-react";
import { useBauSchlauStore } from "@/lib/store";
import { extractFromProtokoll } from "@/lib/ai-simulator";
import { BEREICH_LABEL } from "@/lib/types";
import type { Protokoll } from "@/lib/types";

const QUELLEN: Protokoll["quelle"][] = ["Schornsteinfeger", "Energieberater", "Handwerker", "Sonstiges"];

function ProtokollCard({ protokoll }: { protokoll: Protokoll }) {
  const addTask = useBauSchlauStore((s) => s.addTask);
  const updateProtokoll = useBauSchlauStore((s) => s.updateProtokoll);
  const [uebernommenIdx, setUebernommenIdx] = useState<Set<number>>(new Set());

  if (!protokoll.extraktion) return null;
  const { aufgaben, auflagen, termine } = protokoll.extraktion;

  const uebernehmen = (idx: number) => {
    const a = aufgaben[idx];
    addTask({
      title: a.titel,
      description: a.beschreibung,
      bereich: a.bereich,
      gewerk: protokoll.quelle,
      status: "offen",
      ausfuehrung: "handwerker",
      prioritaet: "mittel",
    });
    setUebernommenIdx((prev) => new Set(prev).add(idx));
  };

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">{protokoll.quelle}</span>
        <span className="text-xs text-zinc-500">{new Date(protokoll.createdAt).toLocaleString("de-DE")}</span>
      </div>
      <p className="mb-4 whitespace-pre-wrap text-sm text-zinc-400">{protokoll.text}</p>

      <div className="space-y-4">
        {aufgaben.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
              <ClipboardCheck className="h-3.5 w-3.5" /> Neue Aufgaben
            </div>
            <ul className="space-y-1.5">
              {aufgaben.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-2 rounded-lg bg-zinc-950/60 px-2.5 py-1.5 text-sm">
                  <span className="text-zinc-300">
                    {a.titel} <span className="text-xs text-zinc-500">· {BEREICH_LABEL[a.bereich]}</span>
                  </span>
                  {uebernommenIdx.has(i) ? (
                    <span className="flex shrink-0 items-center gap-1 text-xs text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Übernommen</span>
                  ) : (
                    <button onClick={() => uebernehmen(i)} className="shrink-0 rounded-lg bg-orange-500/15 px-2 py-1 text-xs font-medium text-orange-400 hover:bg-orange-500/25">
                      Übernehmen
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {auflagen.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-amber-400">
              <ScrollText className="h-3.5 w-3.5" /> Auflagen &amp; Norm-Hinweise
            </div>
            <ul className="space-y-1 text-sm text-zinc-300">
              {auflagen.map((a, i) => <li key={i} className="flex gap-2"><span className="text-zinc-600">–</span>{a}</li>)}
            </ul>
          </div>
        )}

        {termine.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-blue-400">
              <CalendarClock className="h-3.5 w-3.5" /> Wichtige Termine / Fristen
            </div>
            <ul className="space-y-1 text-sm text-zinc-300">
              {termine.map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-zinc-600">–</span>{t.text}
                  {t.datum && <span className="rounded bg-blue-500/15 px-1.5 text-xs text-blue-300">{t.datum}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProtokollModule() {
  const protokolle = useBauSchlauStore((s) => s.protokolle);
  const addProtokoll = useBauSchlauStore((s) => s.addProtokoll);
  const [text, setText] = useState("");
  const [quelle, setQuelle] = useState<Protokoll["quelle"]>("Handwerker");
  const [loading, setLoading] = useState(false);

  const verarbeiten = () => {
    if (!text.trim()) return;
    setLoading(true);
    setTimeout(() => {
      const extraktion = extractFromProtokoll(text.trim());
      addProtokoll({ text: text.trim(), quelle, extraktion, uebernommen: false });
      setText("");
      setLoading(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
          <Mic className="h-5 w-5 text-orange-400" /> Neues Gesprächsprotokoll verarbeiten
        </h2>
        <p className="text-sm text-zinc-500">
          Freitext/Diktat von Telefonaten mit Schornsteinfeger, Energieberater oder Handwerkern einfügen – die KI extrahiert Aufgaben, Auflagen und Termine.
        </p>
      </div>

      <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex flex-wrap gap-1.5">
          {QUELLEN.map((q) => (
            <button
              key={q}
              onClick={() => setQuelle(q)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                quelle === q ? "border-orange-500/50 bg-orange-500/10 text-orange-400" : "border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {q}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="z. B. Telefonat mit Energieberater: Die Dämmstärke im Dach muss laut GEG mindestens 20cm betragen. Blower-Door-Test ist bis KW 40 einzuplanen. Fenster im Bad müssen noch bestellt werden…"
          className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
        <button
          onClick={verarbeiten}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-orange-400 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" /> {loading ? "Analysiere…" : "Protokoll analysieren"}
        </button>
      </div>

      <div className="space-y-3">
        {protokolle.map((p) => (
          <ProtokollCard key={p.id} protokoll={p} />
        ))}
      </div>
    </div>
  );
}
