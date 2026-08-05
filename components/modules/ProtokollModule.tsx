"use client";

import { useMemo, useState } from "react";
import {
  Mic,
  Sparkles,
  ClipboardCheck,
  ScrollText,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Trash2,
  Search,
} from "lucide-react";
import { useBauSchlauStore } from "@/lib/store";
import { api } from "@/lib/api-client";
import { BEREICH_LABEL, GEWERKE, GEWERK_COLOR } from "@/lib/types";
import type { Protokoll, ProtokollExtraktion } from "@/lib/types";
import TaskModal from "@/components/TaskModal";

const QUELLEN: Protokoll["quelle"][] = [...GEWERKE];

function protokollHaystack(p: Protokoll) {
  return [
    p.text,
    p.quelle,
    ...(p.extraktion?.aufgaben.flatMap((a) => [a.titel, a.beschreibung]) ?? []),
    ...(p.extraktion?.auflagen ?? []),
    ...(p.extraktion?.termine.map((t) => t.text) ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

function ProtokollCard({ protokoll }: { protokoll: Protokoll }) {
  const deleteProtokoll = useBauSchlauStore((s) => s.deleteProtokoll);
  const updateProtokoll = useBauSchlauStore((s) => s.updateProtokoll);
  const uebernommenIdx = useMemo(() => new Set(protokoll.uebernommeneIndizes ?? []), [protokoll.uebernommeneIndizes]);
  const [open, setOpen] = useState(false);
  const [modalIdx, setModalIdx] = useState<number | null>(null);

  const extraktion = protokoll.extraktion;
  const aufgaben = extraktion?.aufgaben ?? [];
  const auflagen = extraktion?.auflagen ?? [];
  const termine = extraktion?.termine ?? [];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`} />
        <span className="shrink-0 rounded-full bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">{protokoll.quelle}</span>
        <span className="min-w-0 flex-1 truncate text-sm text-zinc-400">{protokoll.text}</span>
        <span className="shrink-0 text-xs text-zinc-500">{new Date(protokoll.createdAt).toLocaleDateString("de-DE")}</span>
        <span
          onClick={(e) => {
            e.stopPropagation();
            deleteProtokoll(protokoll.id);
          }}
          role="button"
          tabIndex={0}
          className="shrink-0 rounded-lg p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </span>
      </button>

      {open && (
        <div className="border-t border-zinc-800 px-4 py-4">
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
                        <button onClick={() => setModalIdx(i)} className="shrink-0 rounded-lg bg-orange-500/15 px-2 py-1 text-xs font-medium text-orange-400 hover:bg-orange-500/25">
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
      )}

      <TaskModal
        open={modalIdx !== null}
        onClose={() => setModalIdx(null)}
        prefill={
          modalIdx !== null
            ? {
                title: aufgaben[modalIdx].titel,
                description: aufgaben[modalIdx].beschreibung,
                bereich: aufgaben[modalIdx].bereich,
                gewerk: protokoll.quelle,
                status: "offen",
                ausfuehrung: "handwerker",
                prioritaet: "mittel",
              }
            : null
        }
        onSaved={() => {
          if (modalIdx === null) return;
          const bisher = protokoll.uebernommeneIndizes ?? [];
          if (!bisher.includes(modalIdx)) {
            updateProtokoll(protokoll.id, { uebernommeneIndizes: [...bisher, modalIdx] });
          }
        }}
      />
    </div>
  );
}

export default function ProtokollModule() {
  const protokolle = useBauSchlauStore((s) => s.protokolle);
  const addProtokoll = useBauSchlauStore((s) => s.addProtokoll);
  const [text, setText] = useState("");
  const [quelle, setQuelle] = useState<Protokoll["quelle"]>("Handwerker");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Protokoll["quelle"] | "alle">("alle");
  const [suche, setSuche] = useState("");

  const verarbeiten = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const extraktion = await api.ai.protokoll<ProtokollExtraktion>(text.trim());
      addProtokoll({ text: text.trim(), quelle, extraktion, uebernommen: false });
      setText("");
    } finally {
      setLoading(false);
    }
  };

  const gefiltert = useMemo(() => {
    const needle = suche.trim().toLowerCase();
    return protokolle.filter((p) => {
      if (filter !== "alle" && p.quelle !== filter) return false;
      if (needle && !protokollHaystack(p).includes(needle)) return false;
      return true;
    });
  }, [protokolle, filter, suche]);

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
                quelle === q ? GEWERK_COLOR[q].active : GEWERK_COLOR[q].badge
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

      {protokolle.length > 0 && (
        <div className="space-y-2">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
              placeholder="Stichwort suchen… (z. B. Fenster, Blower-Door)"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 py-1.5 pl-8 pr-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilter("alle")}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                filter === "alle" ? "border-orange-500/50 bg-orange-500/10 text-orange-400" : "border-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Alle ({protokolle.length})
            </button>
            {QUELLEN.map((q) => {
              const count = protokolle.filter((p) => p.quelle === q).length;
              if (count === 0) return null;
              return (
                <button
                  key={q}
                  onClick={() => setFilter(q)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    filter === q ? GEWERK_COLOR[q].active : GEWERK_COLOR[q].badge
                  }`}
                >
                  {q} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        {gefiltert.map((p) => (
          <ProtokollCard key={p.id} protokoll={p} />
        ))}
        {protokolle.length > 0 && gefiltert.length === 0 && (
          <p className="text-sm text-zinc-500">Keine Protokolle mit diesem Filter.</p>
        )}
      </div>
    </div>
  );
}
