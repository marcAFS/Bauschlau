"use client";

import { useEffect, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { useBauSchlauStore } from "@/lib/store";
import type { Task, Bereich, TaskStatus, Ausfuehrung, Prioritaet, MaterialStatus } from "@/lib/types";
import { BEREICH_LABEL, TASK_STATUS_LABEL } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  task?: Task | null;
  prefill?: Partial<Task> | null;
  // Wird nur nach erfolgreichem Speichern aufgerufen (nicht bei Abbrechen/X) –
  // z.B. damit der Protokoll-Analysator einen Vorschlag als "übernommen" markieren kann.
  onSaved?: (task: Task) => void;
}

const emptyForm = (prefill?: Partial<Task> | null) => ({
  title: prefill?.title ?? "",
  description: prefill?.description ?? "",
  bereich: (prefill?.bereich ?? "eg") as Bereich,
  gewerk: prefill?.gewerk ?? "",
  status: (prefill?.status ?? "offen") as TaskStatus,
  ausfuehrung: (prefill?.ausfuehrung ?? "handwerker") as Ausfuehrung,
  kontaktName: prefill?.kontakt?.name ?? "",
  kontaktFirma: prefill?.kontakt?.firma ?? "",
  kontaktTelefon: prefill?.kontakt?.telefon ?? "",
  kontaktEmail: prefill?.kontakt?.email ?? "",
  flaeche: prefill?.flaeche?.toString() ?? "",
  prioritaet: (prefill?.prioritaet ?? "mittel") as Prioritaet,
  startDatum: prefill?.startDatum ? prefill.startDatum.slice(0, 10) : "",
  deadline: prefill?.deadline ? prefill.deadline.slice(0, 10) : "",
  abhaengigVon: prefill?.abhaengigVon ?? ([] as string[]),
  materialStatus: prefill?.materialStatus ?? ("" as MaterialStatus | ""),
  lieferzeitTage: prefill?.lieferzeitTage?.toString() ?? "",
  sperrfristBisTag: prefill?.sperrfristBisTag?.toString() ?? "",
  sperrfristNotiz: prefill?.sperrfristNotiz ?? "",
  budgetSoll: prefill?.budgetSoll?.toString() ?? "",
  budgetIst: prefill?.budgetIst?.toString() ?? "",
});

export default function TaskModal({ open, onClose, task, prefill, onSaved }: Props) {
  const addTask = useBauSchlauStore((s) => s.addTask);
  const updateTask = useBauSchlauStore((s) => s.updateTask);
  const deleteTask = useBauSchlauStore((s) => s.deleteTask);
  const alleTasks = useBauSchlauStore((s) => s.tasks);
  const andereTasks = alleTasks.filter((t) => t.id !== task?.id);

  const [form, setForm] = useState(emptyForm(task ?? prefill));

  useEffect(() => {
    if (open) setForm(emptyForm(task ?? prefill));
  }, [open, task, prefill]);

  if (!open) return null;

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleAbhaengigkeit = (id: string) =>
    setForm((f) => ({
      ...f,
      abhaengigVon: f.abhaengigVon.includes(id) ? f.abhaengigVon.filter((x) => x !== id) : [...f.abhaengigVon, id],
    }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (form.startDatum && form.deadline && form.deadline < form.startDatum) return;

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      bereich: form.bereich,
      gewerk: form.gewerk.trim() || "Allgemein",
      status: form.status,
      ausfuehrung: form.ausfuehrung,
      kontakt:
        form.ausfuehrung === "handwerker"
          ? {
              name: form.kontaktName || undefined,
              firma: form.kontaktFirma || undefined,
              telefon: form.kontaktTelefon || undefined,
              email: form.kontaktEmail || undefined,
            }
          : undefined,
      flaeche: form.flaeche ? Number(form.flaeche) : undefined,
      prioritaet: form.prioritaet,
      startDatum: form.startDatum || undefined,
      deadline: form.deadline || undefined,
      abhaengigVon: form.abhaengigVon.length > 0 ? form.abhaengigVon : undefined,
      materialStatus: form.materialStatus || undefined,
      lieferzeitTage: form.lieferzeitTage ? Number(form.lieferzeitTage) : undefined,
      sperrfristBisTag: form.sperrfristBisTag ? Number(form.sperrfristBisTag) : undefined,
      sperrfristNotiz: form.sperrfristNotiz || undefined,
      budgetSoll: form.budgetSoll ? Number(form.budgetSoll) : undefined,
      budgetIst: form.budgetIst ? Number(form.budgetIst) : undefined,
      wunschId: task?.wunschId ?? prefill?.wunschId,
    };

    if (task) {
      updateTask(task.id, payload);
    } else {
      const created = addTask(payload as Omit<Task, "id" | "createdAt" | "updatedAt">);
      onSaved?.(created);
    }
    onClose();
  };

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";
  const labelClass = "mb-1 block text-xs font-medium text-zinc-400";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl border border-zinc-800 bg-zinc-950 shadow-2xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-base font-semibold text-zinc-100">
            {task ? "Aufgabe bearbeiten" : "Neue Aufgabe"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Titel *</label>
              <input
                className={inputClass}
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="z. B. Elektro-Rohinstallation OG"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Beschreibung</label>
              <textarea
                className={inputClass}
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Bereich (3D)</label>
                <select className={inputClass} value={form.bereich} onChange={(e) => set("bereich", e.target.value as Bereich)}>
                  {Object.entries(BEREICH_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Gewerk</label>
                <input className={inputClass} value={form.gewerk} onChange={(e) => set("gewerk", e.target.value)} placeholder="z. B. Dachdecker" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Status</label>
                <select className={inputClass} value={form.status} onChange={(e) => set("status", e.target.value as TaskStatus)}>
                  {Object.entries(TASK_STATUS_LABEL).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Ausführung</label>
                <select className={inputClass} value={form.ausfuehrung} onChange={(e) => set("ausfuehrung", e.target.value as Ausfuehrung)}>
                  <option value="diy">Eigenleistung (DIY)</option>
                  <option value="handwerker">Handwerker / Fachfirma</option>
                </select>
              </div>
            </div>

            {form.ausfuehrung === "handwerker" && (
              <div className="rounded-lg border border-zinc-800 p-3">
                <p className="mb-2 text-xs font-medium text-zinc-400">Kontaktdaten Handwerker</p>
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputClass} placeholder="Name" value={form.kontaktName} onChange={(e) => set("kontaktName", e.target.value)} />
                  <input className={inputClass} placeholder="Firma" value={form.kontaktFirma} onChange={(e) => set("kontaktFirma", e.target.value)} />
                  <input className={inputClass} placeholder="Telefon" value={form.kontaktTelefon} onChange={(e) => set("kontaktTelefon", e.target.value)} />
                  <input className={inputClass} placeholder="E-Mail" value={form.kontaktEmail} onChange={(e) => set("kontaktEmail", e.target.value)} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Raumgröße (m²)</label>
                <input type="number" step="0.1" className={inputClass} value={form.flaeche} onChange={(e) => set("flaeche", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Priorität</label>
                <select className={inputClass} value={form.prioritaet} onChange={(e) => set("prioritaet", e.target.value as Prioritaet)}>
                  <option value="niedrig">Niedrig</option>
                  <option value="mittel">Mittel</option>
                  <option value="hoch">Hoch</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Start-Datum</label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.startDatum}
                  onChange={(e) => {
                    const neuesStartDatum = e.target.value;
                    set("startDatum", neuesStartDatum);
                    if (neuesStartDatum && form.deadline && form.deadline < neuesStartDatum) {
                      set("deadline", "");
                    }
                  }}
                />
              </div>
              <div>
                <label className={labelClass}>Deadline</label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.deadline}
                  min={form.startDatum || undefined}
                  onChange={(e) => set("deadline", e.target.value)}
                />
              </div>
            </div>

            {andereTasks.length > 0 && (
              <div>
                <label className={labelClass}>Abhängig von (muss vorher fertig sein)</label>
                <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 p-2">
                  {andereTasks.map((t) => (
                    <label key={t.id} className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-sm text-zinc-300 hover:bg-zinc-800">
                      <input
                        type="checkbox"
                        checked={form.abhaengigVon.includes(t.id)}
                        onChange={() => toggleAbhaengigkeit(t.id)}
                        className="accent-orange-500"
                      />
                      <span className="truncate">{t.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Material-Status</label>
                <select className={inputClass} value={form.materialStatus} onChange={(e) => set("materialStatus", e.target.value as MaterialStatus)}>
                  <option value="">–</option>
                  <option value="muss_bestellt">Muss bestellt werden</option>
                  <option value="bestellt">Bestellt</option>
                  <option value="vor_ort">Vor Ort</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Lieferzeit (Tage)</label>
                <input type="number" className={inputClass} value={form.lieferzeitTage} onChange={(e) => set("lieferzeitTage", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Sperrfrist nach Abschluss (Tage)</label>
                <input type="number" className={inputClass} placeholder="z. B. 21 (Trocknungszeit)" value={form.sperrfristBisTag} onChange={(e) => set("sperrfristBisTag", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Sperrfrist-Notiz</label>
                <input className={inputClass} placeholder="z. B. Trocknungszeit Estrich" value={form.sperrfristNotiz} onChange={(e) => set("sperrfristNotiz", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Budget Soll (€)</label>
                <input type="number" step="0.01" className={inputClass} value={form.budgetSoll} onChange={(e) => set("budgetSoll", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Budget Ist (€)</label>
                <input type="number" step="0.01" className={inputClass} value={form.budgetIst} onChange={(e) => set("budgetIst", e.target.value)} />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            {task ? (
              <button
                type="button"
                onClick={() => {
                  deleteTask(task.id);
                  onClose();
                }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" /> Löschen
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-900">
                Abbrechen
              </button>
              <button type="submit" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-orange-400">
                Speichern
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
