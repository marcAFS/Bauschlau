"use client";

import { useEffect, useRef, useState } from "react";
import { Scale, Send, Info } from "lucide-react";
import { useBauSchlauStore } from "@/lib/store";
import { mangelAssistentAntwort } from "@/lib/ai-simulator";

const BEISPIELE = [
  "Der Fliesenleger hat den Estrich schon nach 5 Tagen gefliest, jetzt liegen Fliesen hohl.",
  "Der Elektriker ist seit 2 Wochen im Verzug und meldet sich nicht.",
  "An der Kellerwand zeigen sich nach der Abdichtung Feuchtigkeitsflecken.",
];

export default function MaengelModule() {
  const mangelChat = useBauSchlauStore((s) => s.mangelChat);
  const addMangelChatMessage = useBauSchlauStore((s) => s.addMangelChatMessage);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mangelChat]);

  const send = (text: string) => {
    if (!text.trim() || loading) return;
    addMangelChatMessage({ role: "user", text: text.trim() });
    setInput("");
    setLoading(true);
    setTimeout(() => {
      addMangelChatMessage({ role: "assistant", text: mangelAssistentAntwort(text) });
      setLoading(false);
    }, 600);
  };

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[500px] flex-col">
      <div className="mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
          <Scale className="h-5 w-5 text-orange-400" /> Bau-Anwalt &amp; Norm-Check
        </h2>
        <p className="text-sm text-zinc-500">
          Beschreibe eine Baustellen-Situation oder einen Handwerker-Einwand – du erhältst sachliche Argumente auf Basis von DIN/VOB, um Mängel rechtssicher anzusprechen.
        </p>
      </div>

      <div className="mb-3 flex items-start gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 px-3 py-2 text-xs text-blue-300">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Regelbasierte Ersteinschätzung, kein Rechtsberatung-Ersatz. Bei größeren Streitwerten einen Fachanwalt für Baurecht oder Bausachverständigen hinzuziehen.
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        {mangelChat.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm text-zinc-500">Beispiele zum Ausprobieren:</p>
            {BEISPIELE.map((b, i) => (
              <button
                key={i}
                onClick={() => send(b)}
                className="block w-full rounded-lg border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-left text-sm text-zinc-400 hover:border-orange-500/40 hover:text-zinc-200"
              >
                {b}
              </button>
            ))}
          </div>
        )}

        {mangelChat.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user" ? "bg-orange-500 text-zinc-950" : "border border-zinc-800 bg-zinc-900 text-zinc-200"
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-500">Prüfe DIN/VOB…</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Situation beschreiben…"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />
        <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-orange-400">
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
