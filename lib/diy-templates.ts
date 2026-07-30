import type { DiyDetails } from "./types";

export type DiyKategorie =
  | "laminat"
  | "fliesen"
  | "trockenbauwand"
  | "streichen"
  | "estrich"
  | "daemmung_dach";

export const DIY_KATEGORIE_LABEL: Record<DiyKategorie, string> = {
  laminat: "Laminat / Vinyl verlegen",
  fliesen: "Fliesen legen",
  trockenbauwand: "Trockenbauwand (Metallständer)",
  streichen: "Wände streichen",
  estrich: "Estrich gießen (Fließestrich-Vorbereitung)",
  daemmung_dach: "Dachschräge dämmen",
};

interface MaterialRegel {
  name: string;
  proM2: number; // Menge pro m² vor Verschnitt
  einheit: string;
  runden?: "auf" | "normal";
}

interface DiyTemplate {
  schichtaufbau: string[];
  material: MaterialRegel[];
  werkzeug: string[];
}

const TEMPLATES: Record<DiyKategorie, DiyTemplate> = {
  laminat: {
    schichtaufbau: [
      "Untergrund prüfen: eben (≤2mm/Meter), trocken, sauber.",
      "Trittschall-/Dämmunterlage großflächig auslegen.",
      "PE-Folie als Feuchtigkeitssperre (bei Beton-/Estrichuntergrund) verlegen.",
      "Laminat/Vinyl im Verband verlegen, Randfuge 8-10mm zu allen Wänden einhalten (Dehnungsfuge).",
      "Sockelleisten montieren, Übergänge mit Profilen abschließen.",
    ],
    material: [
      { name: "Laminat-/Vinyldielen", proM2: 1, einheit: "m²" },
      { name: "Trittschalldämmung", proM2: 1, einheit: "m²" },
      { name: "PE-Feuchtigkeitsfolie", proM2: 1, einheit: "m²" },
      { name: "Sockelleisten (Umfang geschätzt)", proM2: 0.4, einheit: "lfm" },
    ],
    werkzeug: ["Handkreissäge oder Laminatschneider", "Zugeisen & Schlagklotz", "Distanzkeile", "Cuttermesser", "Winkel & Zollstock"],
  },
  fliesen: {
    schichtaufbau: [
      "Untergrund grundieren (Tiefgrund, saugende Untergründe).",
      "Abdichtung im Nassbereich (Dusche/Bad) gemäß DIN 18534 auftragen.",
      "Fliesenkleber mit Zahnspachtel auftragen, Fliesen im Buttering-Floating-Verfahren setzen.",
      "Fugenkreuze setzen, nach Trocknungszeit verfugen.",
      "Silikonfugen an Anschlüssen (Wand/Boden, Ecken) ziehen.",
    ],
    material: [
      { name: "Fliesen", proM2: 1, einheit: "m²" },
      { name: "Flexkleber", proM2: 5, einheit: "kg" },
      { name: "Fugenmörtel", proM2: 0.5, einheit: "kg" },
      { name: "Grundierung", proM2: 0.15, einheit: "L" },
    ],
    werkzeug: ["Fliesenschneider/Nassschneidemaschine", "Zahnspachtel", "Fugenschwamm & Fugenbrett", "Kreuzfugen-Distanzhalter", "Wasserwaage"],
  },
  trockenbauwand: {
    schichtaufbau: [
      "UW-Profile am Boden/Decke mit Dichtband verschrauben.",
      "CW-Ständer im Raster 62,5cm setzen.",
      "Erste Beplankungsseite mit Gipskartonplatten beschrauben.",
      "Dämmung (Mineralwolle) zwischen Ständerwerk einlegen.",
      "Installationsebene/Leerrohre verlegen, dann zweite Seite beplanken.",
      "Fugen spachteln (Q2/Q3), schleifen, grundieren.",
    ],
    material: [
      { name: "Gipskartonplatten (2x beplankt)", proM2: 2, einheit: "m²" },
      { name: "CW-Ständerprofile", proM2: 1.6, einheit: "lfm" },
      { name: "Mineralwolle-Dämmung", proM2: 1, einheit: "m²" },
      { name: "Spachtelmasse", proM2: 0.3, einheit: "kg" },
      { name: "Schrauben (Grobkorn)", proM2: 20, einheit: "Stk" },
    ],
    werkzeug: ["Akkuschrauber", "Blechschere/Profilschere", "Trockenbausäge", "Spachtel-Set", "Lasernivelliergerät"],
  },
  streichen: {
    schichtaufbau: [
      "Untergrund abkleben (Kanten, Steckdosen, Böden).",
      "Löcher/Risse spachteln, schleifen, entstauben.",
      "Grundierung/Tiefgrund bei saugenden Untergründen auftragen.",
      "2 Anstriche mit Deckenfarbe/Wandfarbe im Kreuzgang auftragen.",
    ],
    material: [
      { name: "Wandfarbe (2 Anstriche)", proM2: 0.25, einheit: "L" },
      { name: "Abklebeband", proM2: 0.3, einheit: "lfm" },
      { name: "Grundierung", proM2: 0.1, einheit: "L" },
    ],
    werkzeug: ["Farbrolle & Teleskopstange", "Flächenstreicher/Pinsel", "Abdeckvlies/Malerfolie", "Spachtel"],
  },
  estrich: {
    schichtaufbau: [
      "Randdämmstreifen an allen Wänden anbringen (Trennung zur Wand).",
      "Trennlage/PE-Folie auf Dämmung auslegen, Stöße überlappend verkleben.",
      "Fußbodenheizungsrohre nach Verlegeplan fixieren (falls vorhanden).",
      "Estrich einbringen und abziehen, Nivellierung prüfen.",
      "Belegreife abwarten (CM-Messung vor Belag zwingend!).",
    ],
    material: [
      { name: "Randdämmstreifen", proM2: 0.4, einheit: "lfm" },
      { name: "PE-Trennfolie", proM2: 1, einheit: "m²" },
      { name: "Estrich (je nach Dicke, Richtwert 5cm)", proM2: 0.05, einheit: "m³" },
    ],
    werkzeug: ["Abziehlatte/Estrichlehre", "Rüttler (bei Fließestrich ggf. Stocherstab)", "Nivelliergerät"],
  },
  daemmung_dach: {
    schichtaufbau: [
      "Sparrenzwischenraum vermessen, Dämmmaß (Klemmfilz +2cm Übermaß) berechnen.",
      "Dämmung klemmend zwischen die Sparren einbringen, Hohlräume vermeiden.",
      "Dampfbremse raumseitig luftdicht verkleben (Stöße, Anschlüsse an Bauteile).",
      "Luftdichtheit mit Anpressleisten/Klebeband sichern – Grundlage für Blower-Door-Test.",
      "Konterlattung/Installationsebene für spätere Beplankung montieren.",
    ],
    material: [
      { name: "Klemmfilz-Dämmung", proM2: 1, einheit: "m²" },
      { name: "Dampfbremsfolie", proM2: 1, einheit: "m²" },
      { name: "Klebeband für Dampfbremse", proM2: 0.5, einheit: "lfm" },
      { name: "Konterlattung", proM2: 1, einheit: "lfm" },
    ],
    werkzeug: ["Cuttermesser/Dämmstoffmesser", "Tacker", "Andruckrolle für Klebeband", "Zollstock/Bandmaß"],
  },
};

export function generateDiyDetails(kategorie: DiyKategorie, flaeche: number): DiyDetails {
  const t = TEMPLATES[kategorie];
  const materialliste = t.material.map((m) => {
    const mengeMitVerschnitt = flaeche * m.proM2 * 1.1;
    const menge =
      m.einheit === "Stk" ? Math.ceil(mengeMitVerschnitt) : Math.round(mengeMitVerschnitt * 10) / 10;
    return { name: m.name, menge: `${menge} ${m.einheit}` };
  });

  return {
    flaeche,
    schichtaufbau: t.schichtaufbau,
    materialliste,
    werkzeug: t.werkzeug,
    generiertAm: new Date().toISOString(),
  };
}
