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

export interface ProtokollExtraktion {
  aufgaben: { titel: string; bereich: Bereich; beschreibung: string }[];
  auflagen: string[];
  termine: { text: string; datum?: string }[];
}

export interface Protokoll {
  id: string;
  quelle: "Schornsteinfeger" | "Energieberater" | "Handwerker" | "Sonstiges";
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
