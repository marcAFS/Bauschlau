// Zentrale Datenmodelle für Bau-Schlau

export type Bereich =
  | "keller"
  | "eg"
  | "og"
  | "dach"
  | "garage"
  | "garten"
  | "fassade";

export const BEREICH_LABEL: Record<Bereich, string> = {
  keller: "Keller",
  eg: "Erdgeschoss",
  og: "Obergeschoss",
  dach: "Dach",
  garage: "Garage",
  garten: "Garten",
  fassade: "Fenster / Fassade",
};

export type TaskStatus =
  | "offen"
  | "in_arbeit"
  | "wartend"
  | "blockiert"
  | "erledigt";

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  offen: "Offen",
  in_arbeit: "In Arbeit",
  wartend: "Warten auf Gewerk/Material",
  blockiert: "Blockiert",
  erledigt: "Erledigt",
};

export type Ausfuehrung = "diy" | "handwerker";

export type Prioritaet = "niedrig" | "mittel" | "hoch";

export type MaterialStatus = "muss_bestellt" | "bestellt" | "vor_ort";

export interface Kontakt {
  name?: string;
  firma?: string;
  telefon?: string;
  email?: string;
}

export interface DiyDetails {
  flaeche?: number;
  schichtaufbau?: string[];
  materialliste?: { name: string; menge: string }[];
  werkzeug?: string[];
  generiertAm?: string;
}

export interface Foto {
  id: string;
  taskId?: string;
  bereich?: Bereich;
  typ: "vorher" | "nachher" | "verlege";
  dataUrl: string;
  datum: string;
  notiz?: string;
}

export interface Rechnung {
  id: string;
  taskId?: string;
  dateiName: string;
  dataUrl: string;
  betrag?: number;
  datum: string;
  gewerk?: string;
  wohneinheit: "eigennutzung" | "mietwohnung" | "allgemein";
  absetzbarkeit: "nein" | "voll" | "anteilig";
  absetzbarProzent?: number;
  foerderung: "keine" | "kfw" | "bafa";
}

export interface Angebot {
  id: string;
  taskId?: string;
  handwerkerName: string;
  dateiName?: string;
  dataUrl?: string;
  freitext?: string;
  summe?: number;
  analyseHinweise?: string[];
  analyseVersteckteKosten?: string[];
  erstelltAm: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  bereich: Bereich;
  gewerk: string;
  status: TaskStatus;
  ausfuehrung: Ausfuehrung;
  kontakt?: Kontakt;
  flaeche?: number;
  prioritaet: Prioritaet;
  startDatum?: string; // ISO-Datum (YYYY-MM-DD)
  deadline?: string; // ISO-Datum (YYYY-MM-DD)
  abhaengigVon?: string[]; // IDs von Aufgaben, die vorher abgeschlossen sein müssen
  materialStatus?: MaterialStatus;
  lieferzeitTage?: number;
  sperrfristBisTag?: number; // Trocknungszeit etc. in Tagen ab Abschluss
  sperrfristNotiz?: string;
  budgetSoll?: number;
  budgetIst?: number;
  diyDetails?: DiyDetails;
  wunschId?: string;
  createdAt: string;
  updatedAt: string;
  erledigtAm?: string;
}

export interface WunschAnalyse {
  hinweise: string[];
  rueckfragen: string[];
  vorgeschlageneGewerke: { bereich: Bereich; gewerk: string; titel: string }[];
}

export interface Wunsch {
  id: string;
  text: string;
  analyse?: WunschAnalyse;
  uebernommen: boolean;
  createdAt: string;
}

export interface RaumProfil {
  id: string;
  raumName: string;
  etage: Bereich;
  daemmungMm: number;
  fbhMm: number;
  estrichMm: number;
  belagMm: number;
  rohdeckeHoeheMm?: number; // für Türhöhe-Berechnung, optional
  tuerRohbauHoeheMm?: number;
  fensterBrhRohMm?: number; // Brüstungshöhe ab Rohdecke (Planung)
  createdAt: string;
}

export const GEWERKE = [
  "Energieberater",
  "Schornsteinfeger",
  "Zimmermann",
  "Maurer",
  "Dachdecker",
  "Elektriker",
  "Installateur",
  "Trockenbauer",
  "Verputzer",
  "Estrichleger",
  "Fliesenleger",
  "Maler/Lackierer",
  "Fensterbauer/Schreiner",
  "Gerüstbauer",
  "Handwerker",
  "Sonstiges",
] as const;
export type Gewerk = (typeof GEWERKE)[number];

// Statische Tailwind-Klassen (kein dynamisches String-Interpolieren, sonst greift die
// JIT-Klassenerkennung nicht) für farblich unterscheidbare Gewerke-Pills.
export const GEWERK_COLOR: Record<Gewerk, { badge: string; active: string }> = {
  Energieberater: { badge: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300", active: "border-emerald-500/80 bg-emerald-500/25 text-emerald-200" },
  Schornsteinfeger: { badge: "border-slate-500/40 bg-slate-500/10 text-slate-300", active: "border-slate-500/80 bg-slate-500/25 text-slate-200" },
  Zimmermann: { badge: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300", active: "border-yellow-500/80 bg-yellow-500/25 text-yellow-200" },
  Maurer: { badge: "border-red-500/40 bg-red-500/10 text-red-300", active: "border-red-500/80 bg-red-500/25 text-red-200" },
  Dachdecker: { badge: "border-rose-500/40 bg-rose-500/10 text-rose-300", active: "border-rose-500/80 bg-rose-500/25 text-rose-200" },
  Elektriker: { badge: "border-amber-500/40 bg-amber-500/10 text-amber-300", active: "border-amber-500/80 bg-amber-500/25 text-amber-200" },
  Installateur: { badge: "border-blue-500/40 bg-blue-500/10 text-blue-300", active: "border-blue-500/80 bg-blue-500/25 text-blue-200" },
  Trockenbauer: { badge: "border-stone-500/40 bg-stone-500/10 text-stone-300", active: "border-stone-500/80 bg-stone-500/25 text-stone-200" },
  Verputzer: { badge: "border-teal-500/40 bg-teal-500/10 text-teal-300", active: "border-teal-500/80 bg-teal-500/25 text-teal-200" },
  Estrichleger: { badge: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300", active: "border-cyan-500/80 bg-cyan-500/25 text-cyan-200" },
  Fliesenleger: { badge: "border-sky-500/40 bg-sky-500/10 text-sky-300", active: "border-sky-500/80 bg-sky-500/25 text-sky-200" },
  "Maler/Lackierer": { badge: "border-pink-500/40 bg-pink-500/10 text-pink-300", active: "border-pink-500/80 bg-pink-500/25 text-pink-200" },
  "Fensterbauer/Schreiner": { badge: "border-indigo-500/40 bg-indigo-500/10 text-indigo-300", active: "border-indigo-500/80 bg-indigo-500/25 text-indigo-200" },
  Gerüstbauer: { badge: "border-violet-500/40 bg-violet-500/10 text-violet-300", active: "border-violet-500/80 bg-violet-500/25 text-violet-200" },
  Handwerker: { badge: "border-purple-500/40 bg-purple-500/10 text-purple-300", active: "border-purple-500/80 bg-purple-500/25 text-purple-200" },
  Sonstiges: { badge: "border-zinc-500/40 bg-zinc-500/10 text-zinc-300", active: "border-zinc-500/80 bg-zinc-500/25 text-zinc-200" },
};

export interface ProtokollExtraktion {
  aufgaben: { titel: string; bereich: Bereich; beschreibung: string }[];
  auflagen: string[];
  termine: { text: string; datum?: string }[];
}

export interface Protokoll {
  id: string;
  quelle: Gewerk;
  text: string;
  extraktion?: ProtokollExtraktion;
  uebernommen: boolean;
  uebernommeneIndizes?: number[]; // Indizes von extraktion.aufgaben, die schon in Projektplan übernommen wurden
  createdAt: string;
}

export interface BautagebuchEintrag {
  id: string;
  datum: string;
  text: string;
  taskIds?: string[];
  fotoUrls?: string[];
}

export interface MangelChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
}

export type AktiverTab =
  | "dashboard"
  | "wunschliste"
  | "hoehenrechner"
  | "protokoll"
  | "synergie"
  | "timeline"
  | "budget"
  | "maengel"
  | "ausschreibung"
  | "fotos";
