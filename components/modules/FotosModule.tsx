"use client";

import { useMemo, useRef, useState } from "react";
import { Camera, Upload, Trash2, Mic, MicOff, FileDown, MessageCircle, Mail, BookOpen, Pencil, ImagePlus, X } from "lucide-react";
import { useBauSchlauStore } from "@/lib/store";
import { BEREICH_LABEL, type Bereich, type BautagebuchEintrag } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/ui-helpers";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";

function FotoUpload() {
  const addFoto = useBauSchlauStore((s) => s.addFoto);
  const fileRef = useRef<HTMLInputElement>(null);
  const [bereich, setBereich] = useState<Bereich>("eg");
  const [typ, setTyp] = useState<"vorher" | "nachher" | "verlege">("vorher");
  const [notiz, setNotiz] = useState("");

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      addFoto({ bereich, typ, dataUrl: reader.result as string, datum: new Date().toISOString(), notiz: notiz || undefined });
      setNotiz("");
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <select className={inputClass} value={bereich} onChange={(e) => setBereich(e.target.value as Bereich)}>
          {Object.entries(BEREICH_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className={inputClass} value={typ} onChange={(e) => setTyp(e.target.value as typeof typ)}>
          <option value="vorher">Vorher</option>
          <option value="nachher">Nachher</option>
          <option value="verlege">Verlege-Foto</option>
        </select>
        <input className={inputClass} placeholder="Notiz (optional)" value={notiz} onChange={(e) => setNotiz(e.target.value)} />
      </div>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <button onClick={() => fileRef.current?.click()} className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-700 py-4 text-sm text-zinc-400 hover:border-orange-500 hover:text-orange-400">
        <Upload className="h-4 w-4" /> Foto aufnehmen / hochladen
      </button>
    </div>
  );
}

function FotoGalerie() {
  const fotos = useBauSchlauStore((s) => s.fotos);
  const deleteFoto = useBauSchlauStore((s) => s.deleteFoto);

  if (fotos.length === 0) return <p className="text-sm text-zinc-500">Noch keine Fotos dokumentiert.</p>;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {fotos.map((f) => (
        <div key={f.id} className="group relative overflow-hidden rounded-xl border border-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={f.dataUrl} alt={f.notiz || f.typ} className="h-32 w-full object-cover sm:h-36" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
            <p className="text-[10px] font-medium text-white">{BEREICH_LABEL[f.bereich!]} · {f.typ}</p>
            <p className="text-[10px] text-zinc-300">{formatDate(f.datum)}</p>
          </div>
          <button
            onClick={() => deleteFoto(f.id)}
            className="absolute right-1.5 top-1.5 rounded-lg bg-black/60 p-1.5 text-white opacity-0 transition group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}

// Minimal ambient typing for the (non-standard) Web Speech API
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: { results: { transcript: string }[][]; }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function readFilesAsDataUrls(files: FileList, onEach: (dataUrl: string) => void) {
  Array.from(files).forEach((file) => {
    const reader = new FileReader();
    reader.onload = () => onEach(reader.result as string);
    reader.readAsDataURL(file);
  });
}

function FotoAnhangEditor({ fotos, onChange }: { fotos: string[]; onChange: (fotos: string[]) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mt-2 space-y-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) readFilesAsDataUrls(e.target.files, (url) => onChange([...fotos, url]));
          e.target.value = "";
        }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:border-orange-500 hover:text-orange-400"
      >
        <ImagePlus className="h-3.5 w-3.5" /> Foto(s) hinzufügen
      </button>
      {fotos.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {fotos.map((url, i) => (
            <div key={i} className="group/foto relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-16 w-16 rounded-md border border-zinc-700 object-cover" />
              <button
                onClick={() => onChange(fotos.filter((_, idx) => idx !== i))}
                className="absolute -right-1.5 -top-1.5 rounded-full bg-black/80 p-0.5 text-white opacity-0 transition group-hover/foto:opacity-100"
                title="Entfernen"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BautagebuchEintragRow({ eintrag }: { eintrag: BautagebuchEintrag }) {
  const updateBautagebuchEintrag = useBauSchlauStore((s) => s.updateBautagebuchEintrag);
  const deleteBautagebuchEintrag = useBauSchlauStore((s) => s.deleteBautagebuchEintrag);
  const [editing, setEditing] = useState(false);
  const [datum, setDatum] = useState(eintrag.datum.slice(0, 10));
  const [text, setText] = useState(eintrag.text);
  const [fotos, setFotos] = useState<string[]>(eintrag.fotoUrls ?? []);

  const beginEdit = () => {
    setDatum(eintrag.datum.slice(0, 10));
    setText(eintrag.text);
    setFotos(eintrag.fotoUrls ?? []);
    setEditing(true);
  };

  const speichern = () => {
    if (!text.trim()) return;
    const alt = new Date(eintrag.datum);
    const [y, m, d] = datum.split("-").map(Number);
    const neuesDatum = new Date(y, (m ?? 1) - 1, d ?? 1, alt.getHours(), alt.getMinutes(), alt.getSeconds());
    updateBautagebuchEintrag(eintrag.id, { datum: neuesDatum.toISOString(), text: text.trim(), fotoUrls: fotos });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="rounded-lg border border-orange-500/50 bg-zinc-900/40 p-3">
        <input
          type="date"
          className={`${inputClass} mb-2 sm:max-w-[180px]`}
          value={datum}
          max={todayStr()}
          onChange={(e) => setDatum(e.target.value)}
        />
        <textarea className={inputClass} rows={3} value={text} onChange={(e) => setText(e.target.value)} />
        <FotoAnhangEditor fotos={fotos} onChange={setFotos} />
        <div className="mt-2 flex gap-2">
          <button onClick={speichern} className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 hover:bg-orange-400">
            Speichern
          </button>
          <button onClick={() => setEditing(false)} className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700">
            Abbrechen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group rounded-lg border border-zinc-800 bg-zinc-900/40 p-3">
      <div className="flex items-start justify-between gap-2">
        <p className="mb-1 text-xs text-zinc-500">{formatDateTime(eintrag.datum)}</p>
        <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
          <button onClick={beginEdit} className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-orange-400" title="Bearbeiten">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => deleteBautagebuchEintrag(eintrag.id)}
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-800 hover:text-red-400"
            title="Löschen"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm text-zinc-300">{eintrag.text}</p>
      {!!eintrag.fotoUrls?.length && (
        <div className="mt-2 flex flex-wrap gap-2">
          {eintrag.fotoUrls.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt=""
              className="h-16 w-16 cursor-pointer rounded-md border border-zinc-700 object-cover"
              onClick={() => window.open(url, "_blank")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BautagebuchSection() {
  const bautagebuch = useBauSchlauStore((s) => s.bautagebuch);
  const addBautagebuchEintrag = useBauSchlauStore((s) => s.addBautagebuchEintrag);
  const [text, setText] = useState("");
  const [datum, setDatum] = useState(todayStr());
  const [fotos, setFotos] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [speechSupported] = useState(
    () => typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
  );

  const toggleListening = () => {
    if (!speechSupported) return;
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const w = window as unknown as Record<string, unknown>;
    const SpeechRecognitionCtor = (w.SpeechRecognition ?? w.webkitSpeechRecognition) as new () => SpeechRecognitionLike;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "de-DE";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results as unknown as { transcript: string }[][])
        .map((r) => r[0].transcript)
        .join(" ");
      setText((prev) => (prev ? prev + " " : "") + transcript);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const speichern = () => {
    if (!text.trim()) return;
    const now = new Date();
    const [y, m, d] = datum.split("-").map(Number);
    const eintragsDatum = new Date(y, (m ?? 1) - 1, d ?? 1, now.getHours(), now.getMinutes(), now.getSeconds());
    addBautagebuchEintrag({ datum: eintragsDatum.toISOString(), text: text.trim(), fotoUrls: fotos });
    setText("");
    setDatum(todayStr());
    setFotos([]);
  };

  const sortierterBautagebuch = useMemo(
    () => [...bautagebuch].sort((a, b) => b.datum.localeCompare(a.datum)),
    [bautagebuch]
  );

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-zinc-400">Datum des Eintrags</label>
          <input
            type="date"
            className={`${inputClass} sm:max-w-[180px]`}
            value={datum}
            max={todayStr()}
            onChange={(e) => setDatum(e.target.value)}
          />
        </div>
        <textarea
          className={inputClass}
          rows={3}
          placeholder="Heutiger Baustellen-Tag… (per Mikrofon diktieren oder eintippen)"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <FotoAnhangEditor fotos={fotos} onChange={setFotos} />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={toggleListening}
            disabled={!speechSupported}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ${
              listening ? "bg-red-500/15 text-red-400" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            } disabled:opacity-40`}
            title={speechSupported ? "" : "Spracherkennung wird von diesem Browser nicht unterstützt"}
          >
            {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
            {listening ? "Aufnahme stoppen" : "Voice-to-Log"}
          </button>
          <button onClick={speichern} className="rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-orange-400">
            Eintrag speichern
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {sortierterBautagebuch.map((e) => (
          <BautagebuchEintragRow key={e.id} eintrag={e} />
        ))}
      </div>
    </div>
  );
}

function ErinnerungsGenerator() {
  const tasks = useBauSchlauStore((s) => s.tasks);
  const handwerkerTasks = useMemo(() => tasks.filter((t) => t.ausfuehrung === "handwerker"), [tasks]);
  const [taskId, setTaskId] = useState("");

  const task = handwerkerTasks.find((t) => t.id === taskId);
  const text = task
    ? `Guten Tag${task.kontakt?.name ? " " + task.kontakt.name : ""}, kurze Erinnerung zu "${task.title}"${task.deadline ? ` (Deadline: ${formatDate(task.deadline)})` : ""}. Können wir den Stand kurz abstimmen? Danke und viele Grüße.`
    : "";

  return (
    <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <select className={inputClass} value={taskId} onChange={(e) => setTaskId(e.target.value)}>
        <option value="">Aufgabe / Handwerker wählen…</option>
        {handwerkerTasks.map((t) => (
          <option key={t.id} value={t.id}>{t.title} {t.kontakt?.firma ? `(${t.kontakt.firma})` : ""}</option>
        ))}
      </select>
      {task && (
        <>
          <textarea readOnly value={text} rows={3} className={inputClass} />
          <div className="flex flex-wrap gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(text)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-500/25"
            >
              <MessageCircle className="h-3.5 w-3.5" /> In WhatsApp öffnen
            </a>
            <a
              href={`mailto:${task.kontakt?.email ?? ""}?subject=${encodeURIComponent("Erinnerung: " + task.title)}&body=${encodeURIComponent(text)}`}
              className="flex items-center gap-1.5 rounded-lg bg-blue-500/15 px-3 py-2 text-xs font-medium text-blue-400 hover:bg-blue-500/25"
            >
              <Mail className="h-3.5 w-3.5" /> Als E-Mail
            </a>
          </div>
        </>
      )}
    </div>
  );
}

function kfwExport(fotos: ReturnType<typeof useBauSchlauStore.getState>["fotos"]) {
  const w = window.open("", "_blank");
  if (!w) return;
  const rows = fotos
    .map(
      (f) =>
        `<div style="margin-bottom:24px;break-inside:avoid;"><img src="${f.dataUrl}" style="max-width:300px;border-radius:8px;" /><p style="font-family:sans-serif;font-size:12px;">${BEREICH_LABEL[f.bereich!]} · ${f.typ} · ${new Date(f.datum).toLocaleDateString("de-DE")}${f.notiz ? " · " + f.notiz : ""}</p></div>`
    )
    .join("");
  w.document.write(
    `<h1 style="font-family:sans-serif;">Bau-Schlau – Foto-Nachweis (KfW / Energieberater)</h1><div style="display:flex;flex-wrap:wrap;gap:16px;">${rows}</div>`
  );
  w.document.close();
  w.focus();
  w.print();
}

export default function FotosModule() {
  const fotos = useBauSchlauStore((s) => s.fotos);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
            <Camera className="h-5 w-5 text-orange-400" /> Foto-Dokumentation &amp; Bautagebuch
          </h2>
          <p className="text-sm text-zinc-500">Vorher/Nachher/Verlege-Fotos, KfW-Nachweis-Export und Voice-to-Log für dein Bautagebuch.</p>
        </div>
        {fotos.length > 0 && (
          <button onClick={() => kfwExport(fotos)} className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700">
            <FileDown className="h-3.5 w-3.5" /> KfW / Energieberater-Nachweis exportieren
          </button>
        )}
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-zinc-300">Foto hinzufügen</h3>
        <FotoUpload />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-zinc-300">Galerie ({fotos.length})</h3>
        <FotoGalerie />
      </section>

      <section>
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-300">
          <BookOpen className="h-4 w-4" /> Bautagebuch
        </h3>
        <BautagebuchSection />
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-zinc-300">WhatsApp / Mail-Erinnerungs-Generator</h3>
        <ErinnerungsGenerator />
      </section>
    </div>
  );
}
