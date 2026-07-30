"use client";

import { useState } from "react";
import { Plus, Trash2, AlertTriangle, Ruler } from "lucide-react";
import { useBauSchlauStore } from "@/lib/store";
import { berechneRaum, formatMm } from "@/lib/calculations";
import { BEREICH_LABEL, type Bereich } from "@/lib/types";

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500";
const labelClass = "mb-1 block text-xs font-medium text-zinc-400";

function NewProfilForm() {
  const addRaumProfil = useBauSchlauStore((s) => s.addRaumProfil);
  const [form, setForm] = useState({
    raumName: "",
    etage: "eg" as Bereich,
    daemmungMm: "",
    fbhMm: "",
    estrichMm: "",
    belagMm: "",
    rohdeckeHoeheMm: "",
    fensterBrhRohMm: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.raumName.trim()) return;
    addRaumProfil({
      raumName: form.raumName.trim(),
      etage: form.etage,
      daemmungMm: Number(form.daemmungMm) || 0,
      fbhMm: Number(form.fbhMm) || 0,
      estrichMm: Number(form.estrichMm) || 0,
      belagMm: Number(form.belagMm) || 0,
      rohdeckeHoeheMm: form.rohdeckeHoeheMm ? Number(form.rohdeckeHoeheMm) : undefined,
      fensterBrhRohMm: form.fensterBrhRohMm ? Number(form.fensterBrhRohMm) : undefined,
    });
    setForm({ raumName: "", etage: "eg", daemmungMm: "", fbhMm: "", estrichMm: "", belagMm: "", rohdeckeHoeheMm: "", fensterBrhRohMm: "" });
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Raumname</label>
          <input className={inputClass} placeholder="z. B. Bad OG" value={form.raumName} onChange={(e) => setForm((f) => ({ ...f, raumName: e.target.value }))} />
        </div>
        <div>
          <label className={labelClass}>Etage</label>
          <select className={inputClass} value={form.etage} onChange={(e) => setForm((f) => ({ ...f, etage: e.target.value as Bereich }))}>
            {Object.entries(BEREICH_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label className={labelClass}>Dämmung (mm)</label>
          <input type="number" className={inputClass} value={form.daemmungMm} onChange={(e) => setForm((f) => ({ ...f, daemmungMm: e.target.value }))} />
        </div>
        <div>
          <label className={labelClass}>FBH/Tackerplatte (mm)</label>
          <input type="number" className={inputClass} value={form.fbhMm} onChange={(e) => setForm((f) => ({ ...f, fbhMm: e.target.value }))} />
        </div>
        <div>
          <label className={labelClass}>Estrich (mm)</label>
          <input type="number" className={inputClass} value={form.estrichMm} onChange={(e) => setForm((f) => ({ ...f, estrichMm: e.target.value }))} />
        </div>
        <div>
          <label className={labelClass}>Belag/Kleber (mm)</label>
          <input type="number" className={inputClass} value={form.belagMm} onChange={(e) => setForm((f) => ({ ...f, belagMm: e.target.value }))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Rohdeckenhöhe (mm, optional – für lichte Raumhöhe)</label>
          <input type="number" className={inputClass} value={form.rohdeckeHoeheMm} onChange={(e) => setForm((f) => ({ ...f, rohdeckeHoeheMm: e.target.value }))} />
        </div>
        <div>
          <label className={labelClass}>Fenster-Brüstungshöhe Rohbau (mm, optional)</label>
          <input type="number" className={inputClass} value={form.fensterBrhRohMm} onChange={(e) => setForm((f) => ({ ...f, fensterBrhRohMm: e.target.value }))} />
        </div>
      </div>

      <button type="submit" className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-orange-400">
        <Plus className="h-4 w-4" /> Raum berechnen
      </button>
    </form>
  );
}

export default function HoehenrechnerModule() {
  const raumProfile = useBauSchlauStore((s) => s.raumProfile);
  const deleteRaumProfil = useBauSchlauStore((s) => s.deleteRaumProfil);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-100">
          <Ruler className="h-5 w-5 text-orange-400" /> Bodenaufbau- &amp; Höhenrechner
        </h2>
        <p className="text-sm text-zinc-500">
          OKFF, Meterriss und Fensterbrüstungshöhe automatisch berechnen – inkl. Warnsystem bei Normkonflikten.
        </p>
      </div>

      <NewProfilForm />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {raumProfile.map((p) => {
          const erg = berechneRaum(p);
          return (
            <div key={p.id} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-zinc-100">{p.raumName}</h3>
                  <p className="text-xs text-zinc-500">{BEREICH_LABEL[p.etage]}</p>
                </div>
                <button onClick={() => deleteRaumProfil(p.id)} className="rounded-lg p-1 text-zinc-500 hover:bg-red-500/10 hover:text-red-400">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                <div className="rounded-lg bg-zinc-950/60 p-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">OKFF</p>
                  <p className="font-semibold text-orange-400">{formatMm(erg.okffMm)}</p>
                </div>
                <div className="rounded-lg bg-zinc-950/60 p-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Meterriss</p>
                  <p className="font-semibold text-orange-400">{formatMm(erg.meterrissMm)}</p>
                </div>
                <div className="rounded-lg bg-zinc-950/60 p-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Tür-RBO</p>
                  <p className="font-semibold text-zinc-200">{formatMm(erg.tuerRohbauoeffnungMm)}</p>
                </div>
                <div className="rounded-lg bg-zinc-950/60 p-2.5 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-zinc-500">Eff. BRH</p>
                  <p className="font-semibold text-zinc-200">
                    {erg.effektiveBruestungshoeheMm !== null ? formatMm(erg.effektiveBruestungshoeheMm) : "–"}
                  </p>
                </div>
              </div>

              {erg.lichteRaumhoeheMm !== null && (
                <p className="mt-2 text-xs text-zinc-500">Lichte Raumhöhe: {formatMm(erg.lichteRaumhoeheMm)}</p>
              )}

              {erg.warnungen.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {erg.warnungen.map((w, i) => (
                    <div key={i} className="flex items-start gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs text-red-300">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {w}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {raumProfile.length === 0 && (
        <p className="text-center text-sm text-zinc-500">Noch keine Räume berechnet.</p>
      )}
    </div>
  );
}
