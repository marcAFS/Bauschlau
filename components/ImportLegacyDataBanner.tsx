"use client";

import { useEffect, useState } from "react";
import { DatabaseZap, X } from "lucide-react";
import { useBauSchlauStore } from "@/lib/store";

const FLAG_KEY = "bau-schlau-legacy-import-handled";

interface Props {
  // Nur beim Überspringen aufgerufen: Banner ausblenden, lokalen Stand NICHT
  // anfassen (kein Server-Hydrate!) – sonst würde noch nicht synchronisierte
  // lokale Daten durch den (leeren) Server-Stand überschrieben werden.
  onSkip: () => void;
  // Nur nach erfolgreichem Import aufgerufen: jetzt ist der Server-Stand die
  // importierten Daten, ein Hydrate danach ist sicher.
  onImported: () => void;
}

export default function ImportLegacyDataBanner({ onSkip, onImported }: Props) {
  const importLegacyLocalStorageData = useBauSchlauStore((s) => s.importLegacyLocalStorageData);
  const [status, setStatus] = useState<"idle" | "importing" | "done">("idle");

  const skip = () => {
    localStorage.setItem(FLAG_KEY, "true");
    onSkip();
  };

  const importNow = async () => {
    setStatus("importing");
    try {
      await importLegacyLocalStorageData();
      localStorage.setItem(FLAG_KEY, "true");
      setStatus("done");
      setTimeout(onImported, 1200);
    } catch (err) {
      console.error(err);
      setStatus("idle");
    }
  };

  return (
    <div className="mx-auto mb-4 flex max-w-7xl flex-col gap-3 rounded-xl border border-orange-500/30 bg-orange-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <DatabaseZap className="mt-0.5 h-5 w-5 shrink-0 text-orange-400" />
        <div>
          <p className="text-sm font-medium text-zinc-100">Alte Daten aus diesem Browser gefunden</p>
          <p className="text-xs text-zinc-400">
            {status === "done"
              ? "Import abgeschlossen – deine Daten sind jetzt dauerhaft in der Datenbank gespeichert."
              : "Sollen deine bisherigen Wünsche, Aufgaben und Räume in die neue Datenbank übernommen werden, damit nichts verloren geht?"}
          </p>
        </div>
      </div>
      {status !== "done" && (
        <div className="flex shrink-0 gap-2">
          <button
            onClick={skip}
            disabled={status === "importing"}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-400 hover:bg-zinc-900 disabled:opacity-50"
          >
            Nein danke
          </button>
          <button
            onClick={importNow}
            disabled={status === "importing"}
            className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-orange-400 disabled:opacity-50"
          >
            {status === "importing" ? "Übernehme…" : "Ja, übernehmen"}
          </button>
        </div>
      )}
    </div>
  );
}

export function hasHandledLegacyImport(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(FLAG_KEY) === "true";
}

export function markLegacyImportHandled(): void {
  localStorage.setItem(FLAG_KEY, "true");
}
