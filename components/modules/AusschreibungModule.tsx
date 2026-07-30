"use client";

import { useMemo, useRef, useState } from "react";
import { FileText, Printer, Upload, Trash2, AlertTriangle, ListChecks } from "lucide-react";
import { useBauSchlauStore } from "@/lib/store";
import { analyzeAngebotText } from "@/lib/ai-simulator";
import { BEREICH_LABEL } from "@/lib/types";
import { formatCurrency } from "@/lib/ui-helpers";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

function AngebotAnfrageGenerator() {
  const tasks = useBauSchlauStore((s) => s.tasks);
  const [taskId, setTaskId] = useState("");
  const [firma, setFirma] = useState("");

  const task = tasks.find((t) => t.id === taskId);

  const text = useMemo(() => {
    if (!task) return "";
    return `Betreff: Angebotsanfrage – ${task.title}\n\n` +
      `Sehr geehrte Damen und Herren${firma ? " von " + firma : ""},\n\n` +
      `im Rahmen unserer Haussanierung (Eigenbauleitung) bitten wir um ein unverbindliches Angebot für folgendes Gewerk:\n\n` +
      `Gewerk: ${task.gewerk}\n` +
      `Bereich: ${BEREICH_LABEL[task.bereich]}\n` +
      `Aufgabe: ${task.title}\n` +
      (task.description ? `Beschreibung: ${task.description}\n` : "") +
      (task.flaeche ? `Fläche: ${task.flaeche} m²\n` : "") +
      (task.zielKW ? `Gewünschter Ausführungszeitraum: ${task.zielKW}\n` : "") +
      `\nBitte geben Sie in Ihrem Angebot an:\n` +
      `- Festpreis oder Abrechnung nach Aufwand\n` +
      `- Enthaltene Nebenkosten (Anfahrt, Entsorgung, Gerüst, Baustrom)\n` +
      `- Gewährleistungsfrist\n` +
      `- Zahlungsbedingungen / Abschlagszahlungen\n` +
      `- Möglicher Ausführungszeitraum\n\n` +
      `Über eine zeitnahe Rückmeldung würden wir uns freuen.\n\n` +
      `Mit freundlichen Grüßen`;
  }, [task, firma]);

  const drucken = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<pre style="font-family: sans-serif; white-space: pre-wrap; padding: 2rem; font-size: 14px;">${text.replace(/</g, "&lt;")}</pre>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select className={inputClass} value={taskId} onChange={(e) => setTaskId(e.target.value)}>
          <option value="">Aufgabe wählen…</option>
          {tasks.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
        <input className={inputClass} placeholder="Firma (optional)" value={firma} onChange={(e) => setFirma(e.target.value)} />
      </div>

      {task && (
        <>
          <textarea readOnly value={text} rows={12} className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-xs text-zinc-300" />
          <button onClick={drucken} className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-orange-400">
            <Printer className="h-4 w-4" /> Als PDF drucken / Anschreiben generieren
          </button>
        </>
      )}
    </div>
  );
}

function AngebotUpload() {
  const addAngebot = useBauSchlauStore((s) => s.addAngebot);
  const fileRef = useRef<HTMLInputElement>(null);
  const [handwerkerName, setHandwerkerName] = useState("");
  const [summe, setSumme] = useState("");
  const [freitext, setFreitext] = useState("");
  const [file, setFile] = useState<{ name: string; dataUrl: string } | null>(null);

  const handleFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => setFile({ name: f.name, dataUrl: reader.result as string });
    reader.readAsDataURL(f);
  };

  const submit = () => {
    if (!handwerkerName.trim()) return;
    const analyse = freitext.trim() ? analyzeAngebotText(freitext) : { hinweise: [], versteckteKosten: [] };
    addAngebot({
      handwerkerName: handwerkerName.trim(),
      dateiName: file?.name,
      dataUrl: file?.dataUrl,
      freitext: freitext.trim() || undefined,
      summe: summe ? Number(summe) : undefined,
      analyseHinweise: analyse.hinweise,
      analyseVersteckteKosten: analyse.versteckteKosten,
    });
    setHandwerkerName("");
    setSumme("");
    setFreitext("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="grid grid-cols-2 gap-3">
        <input className={inputClass} placeholder="Handwerker / Firma" value={handwerkerName} onChange={(e) => setHandwerkerName(e.target.value)} />
        <input type="number" step="0.01" className={inputClass} placeholder="Angebotssumme (€)" value={summe} onChange={(e) => setSumme(e.target.value)} />
      </div>
      <textarea
        className={inputClass}
        rows={4}
        placeholder="Angebotstext hier einfügen für automatische KI-Analyse (versteckte Kosten, fehlende Angaben)…"
        value={freitext}
        onChange={(e) => setFreitext(e.target.value)}
      />
      <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-700 px-3 py-2 text-xs text-zinc-400 hover:border-orange-500 hover:text-orange-400">
        <Upload className="h-3.5 w-3.5" /> {file ? file.name : "Angebots-PDF/Foto anhängen (optional)"}
      </button>
      <button onClick={submit} className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-orange-400">
        Angebot speichern &amp; analysieren
      </button>
    </div>
  );
}

export default function AusschreibungModule() {
  const angebote = useBauSchlauStore((s) => s.angebote);
  const deleteAngebot = useBauSchlauStore((s) => s.deleteAngebot);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
          <FileText className="h-5 w-5 text-orange-400" /> Ausschreibungs- &amp; Angebots-Checker
        </h2>
        <p className="text-sm text-zinc-500">Anschreiben für Angebotseinholung generieren und eingegangene Angebote auf versteckte Kosten prüfen.</p>
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-zinc-300">Angebotseinholung generieren</h3>
        <AngebotAnfrageGenerator />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-zinc-300">Angebot hochladen &amp; analysieren</h3>
        <AngebotUpload />
      </section>

      {angebote.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-300">
            <ListChecks className="h-4 w-4" /> Vergleichstabelle
          </h3>
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-900/60 text-left text-xs text-zinc-500">
                <tr>
                  <th className="px-3 py-2">Handwerker</th>
                  <th className="px-3 py-2">Summe</th>
                  <th className="px-3 py-2">Hinweise</th>
                  <th className="px-3 py-2">Versteckte Kosten</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {angebote.map((a) => (
                  <tr key={a.id} className="border-t border-zinc-800 align-top">
                    <td className="px-3 py-2 font-medium text-zinc-200">{a.handwerkerName}</td>
                    <td className="px-3 py-2 text-zinc-300">{formatCurrency(a.summe)}</td>
                    <td className="px-3 py-2 text-zinc-400">
                      <ul className="space-y-0.5">
                        {(a.analyseHinweise ?? []).map((h, i) => <li key={i}>· {h}</li>)}
                      </ul>
                    </td>
                    <td className="px-3 py-2 text-amber-400">
                      {(a.analyseVersteckteKosten ?? []).length === 0 ? (
                        <span className="text-zinc-600">–</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {a.analyseVersteckteKosten!.map((h, i) => (
                            <li key={i} className="flex items-start gap-1"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />{h}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => deleteAngebot(a.id)} className="rounded-lg p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-400">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
