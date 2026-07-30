// Regelbasierte "KI"-Simulations-Engine für Bau-Schlau.
// Läuft komplett offline/lokal (kein API-Call) und liefert Fachwissen zu
// typischen Sanierungs-Themen. Die Struktur ist so gehalten, dass die
// Funktionen 1:1 durch echte LLM-Calls (z. B. Anthropic API) ersetzt werden
// können, ohne die aufrufenden Komponenten anzupassen.

import type {
  Bereich,
  ProtokollExtraktion,
  Task,
  WunschAnalyse,
} from "./types";

// ---------------------------------------------------------------------------
// 1) Wunsch-/Ideen-Analyse
// ---------------------------------------------------------------------------

interface WunschRegel {
  keywords: string[];
  hinweise: string[];
  rueckfragen: string[];
  gewerke: { bereich: Bereich; gewerk: string; titel: string }[];
}

const WUNSCH_REGELN: WunschRegel[] = [
  {
    keywords: ["klima", "klimaanlage", "split-klima", "kühlen"],
    hinweise: [
      "Stromversorgung (eigener 230V-Kreis, ggf. 16A) vor Wandabschluss/Verputz einplanen.",
      "Kondensatablauf einplanen – entweder mit Gefälle nach außen oder an Abwasser anschließen.",
      "Wanddurchbruch für Kältemittelleitung vor Fassadendämmung/Verputz koordinieren.",
      "Aufstellort Außengerät prüfen: Schallschutz, Mindestabstand zur Grundstücksgrenze, Optik an der Fassade.",
    ],
    rueckfragen: [
      "Soll die Anlage nur kühlen oder auch heizen (Wärmepumpen-Funktion)?",
      "Multi-Split (mehrere Räume, 1 Außengerät) oder Einzelgeräte pro Raum?",
      "Ist ein Kondensatanschluss an die Abwasserleitung in der Nähe vorhanden?",
    ],
    gewerke: [
      { bereich: "og", gewerk: "Elektro-Rohinstallation", titel: "Stromkreis für Klimaanlage OG verlegen" },
      { bereich: "og", gewerk: "Klima- / Kältetechnik", titel: "Klimaanlage OG montieren" },
    ],
  },
  {
    keywords: ["dachfenster", "velux", "dachflächenfenster"],
    hinweise: [
      "Statik prüfen – je nach Größe müssen Sparren ausgewechselt (verstärkt) werden.",
      "Eindeckung rund um das Fenster muss vom Dachdecker fachgerecht angeschlossen werden (Eindeckrahmen).",
      "Sonnenschutz/Verdunklung von innen und außen direkt mitplanen (oft nur beim Fenstereinbau montierbar).",
      "Bei Nutzung als Rettungsweg: Mindestmaße der Öffnung beachten.",
    ],
    rueckfragen: [
      "Soll das Dachfenster manuell oder elektrisch mit Regensensor gesteuert werden?",
      "Wird ein außenliegender Sonnenschutz (Rollladen) gewünscht?",
      "Ist das Fenster als zweiter Rettungsweg für den Dachraum vorgesehen?",
    ],
    gewerke: [
      { bereich: "dach", gewerk: "Dachdecker", titel: "Dachfenster einbauen & eindecken" },
      { bereich: "dach", gewerk: "Elektro-Rohinstallation", titel: "Stromzuleitung für elektrisches Dachfenster" },
    ],
  },
  {
    keywords: ["ankleide", "begehbarer kleiderschrank", "ankleidezimmer"],
    hinweise: [
      "Ausreichende Beleuchtung direkt über den Kleiderstangen einplanen (Steckdosen/Schalter mit Bewegungsmelder).",
      "Stellfläche für Schranksysteme vorab mit Maßen planen (Gangbreite min. 70–90 cm).",
      "Belüftung/Fenster prüfen – geschlossene Ankleiden brauchen Entfeuchtung.",
    ],
    rueckfragen: [
      "Offene Regalsysteme oder geschlossene Schrankfronten gewünscht?",
      "Soll ein Spiegel mit zusätzlicher Beleuchtung integriert werden?",
    ],
    gewerke: [
      { bereich: "og", gewerk: "Trockenbau", titel: "Ankleidezimmer – Trockenbau & Aufteilung" },
      { bereich: "og", gewerk: "Elektro-Endmontage", titel: "Beleuchtung Ankleidezimmer" },
    ],
  },
  {
    keywords: ["balkon"],
    hinweise: [
      "Statik/Fundament klären: freitragende Konstruktion oder Stützen im Garten?",
      "Anschluss an die Fassade unbedingt wärmebrückenfrei ausführen (Balkonanschlusselement) – sonst Schimmelrisiko im Anschlussraum.",
      "Abdichtung und Gefälle (mind. 1,5–2 %) zur Entwässerung einplanen.",
      "Baugenehmigung je nach Bundesland und Anbaugröße prüfen.",
    ],
    rueckfragen: [
      "Klassischer Anbaubalkon auf Stützen oder thermisch entkoppelter Vorstellbalkon?",
      "Material und Höhe des Geländers – Absturzsicherung nach DIN 18065 beachten?",
    ],
    gewerke: [
      { bereich: "og", gewerk: "Rohbau / Statik", titel: "Balkon anbauen – Fundament & Tragkonstruktion" },
      { bereich: "og", gewerk: "Abdichtung", titel: "Balkonabdichtung & Anschluss Fassade" },
      { bereich: "fassade", gewerk: "Metallbau", titel: "Balkongeländer montieren" },
    ],
  },
  {
    keywords: ["smart home", "smart-home", "lichtleiste", "led-leiste", "knx"],
    hinweise: [
      "Für dimmbare LED-Leisten separate, dimmbare Stromkreise vom Elektriker planen lassen.",
      "Leerrohre für Sensorik (Bewegungsmelder, Präsenzmelder) rechtzeitig vor Verputz verlegen.",
      "WLAN-Abdeckung im gesamten Haus prüfen, ggf. Access Points/LAN-Leerrohre mit einplanen.",
    ],
    rueckfragen: [
      "Kabelgebundenes Bus-System (z. B. KNX) oder funkbasiert (WLAN/Zigbee)?",
      "Zentrale App-Steuerung für das ganze Haus gewünscht?",
    ],
    gewerke: [
      { bereich: "eg", gewerk: "Elektro-Rohinstallation", titel: "Leerrohre & Stromkreise Smart-Home Beleuchtung" },
      { bereich: "eg", gewerk: "Elektro-Endmontage", titel: "Smart-Home Lichtleisten montieren & einrichten" },
    ],
  },
  {
    keywords: ["fußbodenheizung", "fbh"],
    hinweise: [
      "Aufbauhöhe (Dämmung + Tackerplatte + Estrich) frühzeitig mit dem Höhenrechner prüfen – wirkt sich auf Türhöhen und Fensterbrüstungen aus.",
      "Vor Estrich: Dichtheitsprobe mit Prüfprotokoll dokumentieren (wichtig bei späteren Ansprüchen).",
      "Aufheizprotokoll für den Estrich einfordern – Voraussetzung für Belagsverlegung.",
    ],
    rueckfragen: [
      "Nasssystem oder Trockenbausystem (bei geringer Aufbauhöhe im Altbau)?",
      "Raumweise Einzelraumregelung gewünscht?",
    ],
    gewerke: [
      { bereich: "eg", gewerk: "Heizung / Sanitär", titel: "Fußbodenheizung verlegen" },
      { bereich: "eg", gewerk: "Estrich", titel: "Estrich auf Fußbodenheizung gießen" },
    ],
  },
  {
    keywords: ["photovoltaik", "pv-anlage", "solaranlage", "pv anlage"],
    hinweise: [
      "Dachstatik und Ausrichtung/Verschattung prüfen lassen.",
      "Leerrohr/Kabeltrasse vom Dach zum Zählerschrank frühzeitig mit Elektriker & Dachdecker abstimmen.",
      "Synergie mit Dachdecker-Gerüst nutzen (siehe Gewerke-Synergie-Finder).",
    ],
    rueckfragen: [
      "Ist ein Batteriespeicher geplant (Platzbedarf im Keller/Hauswirtschaftsraum)?",
      "Soll eine Wallbox fürs E-Auto mit demselben Zählerschrank-Umbau realisiert werden?",
    ],
    gewerke: [
      { bereich: "dach", gewerk: "PV-Montage", titel: "PV-Anlage auf Dach montieren" },
      { bereich: "keller", gewerk: "Elektro-Endmontage", titel: "Wechselrichter & Speicher im Keller anschließen" },
    ],
  },
  {
    keywords: ["bad", "badezimmer", "dusche", "wc"],
    hinweise: [
      "Abdichtung nach DIN 18534 im Nassbereich zwingend vor Fliesen einplanen.",
      "Position der Anschlüsse (Wasser/Abwasser) vor Rohbau-Sanitärinstallation final festlegen.",
      "Barrierefreiheit (bodengleiche Dusche) jetzt mitdenken, auch wenn aktuell nicht nötig.",
    ],
    rueckfragen: [
      "Bodengleiche Dusche oder Duschwanne?",
      "Fußbodenheizung im Bad gewünscht?",
    ],
    gewerke: [
      { bereich: "og", gewerk: "Sanitär-Rohinstallation", titel: "Bad – Sanitär-Rohinstallation" },
      { bereich: "og", gewerk: "Fliesenleger", titel: "Bad fliesen" },
    ],
  },
  {
    keywords: ["kamin", "ofen", "kaminofen"],
    hinweise: [
      "Vor Kauf/Einbau den Schornsteinfeger konsultieren (Feuerstättenschau, Abgasweg, Raumluftverbund).",
      "Verbrennungsluftversorgung bei dichten (KfW-)Gebäuden gesondert prüfen.",
    ],
    rueckfragen: ["Ist bereits ein geeigneter Schornstein vorhanden oder muss einer nachgerüstet werden?"],
    gewerke: [{ bereich: "eg", gewerk: "Ofenbauer", titel: "Kaminofen einbauen" }],
  },
  {
    keywords: ["garage"],
    hinweise: [
      "Erdarbeiten für Fundament mit ggf. weiteren Erdarbeiten am Grundstück bündeln (siehe Synergie-Finder).",
      "Elektro-Leerrohr für Wallbox/E-Auto-Ladepunkt direkt mitverlegen, auch wenn aktuell kein E-Auto vorhanden.",
    ],
    rueckfragen: ["Soll die Garage beheizt/gedämmt werden (z. B. als Werkstatt)?"],
    gewerke: [{ bereich: "garage", gewerk: "Rohbau", titel: "Garage – Fundament & Rohbau" }],
  },
  {
    keywords: ["garten", "terrasse"],
    hinweise: [
      "Erdkabel (Strom für Beleuchtung/Pumpe) vor Pflasterarbeiten verlegen.",
      "Gefälle vom Haus weg einplanen, um Staunässe an der Fassade zu vermeiden.",
    ],
    rueckfragen: ["Ist eine Bewässerungsanlage geplant, die vor dem Pflastern verlegt werden sollte?"],
    gewerke: [{ bereich: "garten", gewerk: "Garten- und Landschaftsbau", titel: "Terrasse/Garten anlegen" }],
  },
];

const GENERISCHE_HINWEISE = [
  "Schnittstelle zu vorlaufenden Gewerken prüfen (wer muss vorher fertig sein?).",
  "Elektro- und Sanitäranschlüsse vor Wandschluss final festlegen.",
  "Kosten grob schätzen und im Budget-Modul als Position anlegen.",
];

const GENERISCHE_RUECKFRAGEN = [
  "In welchem Bauabschnitt/Zeitraum soll das umgesetzt werden?",
  "Eigenleistung oder Fachfirma – gibt es dazu schon eine Tendenz?",
];

function guessBereichFromText(text: string): Bereich {
  const t = text.toLowerCase();
  if (/(keller|souterrain)/.test(t)) return "keller";
  if (/(dach|solar|photovoltaik|pv-)/.test(t)) return "dach";
  if (/(garage|carport)/.test(t)) return "garage";
  if (/(garten|terrasse|außenanlage)/.test(t)) return "garten";
  if (/(fenster|fassade|putz|dämmung)/.test(t)) return "fassade";
  if (/(og|obergeschoss|dachgeschoss|schlafzimmer|ankleide)/.test(t)) return "og";
  return "eg";
}

export function analyzeWunsch(text: string): WunschAnalyse {
  const t = text.toLowerCase();
  const treffer = WUNSCH_REGELN.filter((r) => r.keywords.some((k) => t.includes(k)));

  if (treffer.length === 0) {
    return {
      hinweise: GENERISCHE_HINWEISE,
      rueckfragen: GENERISCHE_RUECKFRAGEN,
      vorgeschlageneGewerke: [
        {
          bereich: guessBereichFromText(text),
          gewerk: "Allgemein",
          titel: text.length > 60 ? text.slice(0, 60) + "…" : text,
        },
      ],
    };
  }

  const hinweise = Array.from(new Set(treffer.flatMap((r) => r.hinweise)));
  const rueckfragen = Array.from(new Set(treffer.flatMap((r) => r.rueckfragen)));
  const vorgeschlageneGewerke = treffer.flatMap((r) => r.gewerke);

  return { hinweise, rueckfragen, vorgeschlageneGewerke };
}

// ---------------------------------------------------------------------------
// 2) Protokoll-Analysator (Gesprächsnotizen / Diktate)
// ---------------------------------------------------------------------------

const AUFLAGEN_KEYWORDS = [
  "din", "vob", "enev", "geg", "auflage", "pflicht", "nachweis", "vorschrift",
  "norm", "muss eingehalten", "gefordert", "blower-door", "luftdichtheit",
  "brandschutz", "vorgeschrieben",
];

const TERMIN_PATTERN = /\b(\d{1,2}\.\d{1,2}\.(\d{2,4})?|kw\s?\d{1,2}|montag|dienstag|mittwoch|donnerstag|freitag|nächste woche|übernächste woche)\b/i;

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

export function extractFromProtokoll(text: string): ProtokollExtraktion {
  const sentences = splitSentences(text);
  const auflagen: string[] = [];
  const termine: { text: string; datum?: string }[] = [];
  const aufgaben: { titel: string; bereich: Bereich; beschreibung: string }[] = [];

  for (const s of sentences) {
    const lower = s.toLowerCase();
    const isAuflage = AUFLAGEN_KEYWORDS.some((k) => lower.includes(k));
    const terminMatch = s.match(TERMIN_PATTERN);

    if (isAuflage) {
      auflagen.push(s);
      continue;
    }
    if (terminMatch) {
      termine.push({ text: s, datum: terminMatch[0] });
      continue;
    }
    aufgaben.push({
      titel: s.length > 55 ? s.slice(0, 55) + "…" : s,
      bereich: guessBereichFromText(s),
      beschreibung: s,
    });
  }

  return { aufgaben, auflagen, termine };
}

// ---------------------------------------------------------------------------
// 3) Gewerke-Synergie- & Kosten-Einspar-Finder
// ---------------------------------------------------------------------------

export interface SynergieHinweis {
  id: string;
  titel: string;
  beschreibung: string;
  betroffeneTasks: string[];
  einsparungText: string;
}

const GERUEST_KEYWORDS = ["dachdecker", "fassade", "putz", "pv-montage", "photovoltaik", "spengler", "dachrinne", "maler außen"];
const ERDARBEITEN_KEYWORDS = ["kelleraußenabdichtung", "erdarbeiten", "garten", "erdkabel", "baggerarbeiten", "fundament"];
const SCHLITZ_VORGEWERKE = ["elektro-rohinstallation", "sanitär-rohinstallation", "klima", "heizung"];
const SCHLITZ_FOLGEGEWERKE = ["innenputz", "trockenbau"];

function matchesAny(haystack: string, needles: string[]) {
  const h = haystack.toLowerCase();
  return needles.some((n) => h.includes(n));
}

export function findSynergien(tasks: Task[]): SynergieHinweis[] {
  const offen = tasks.filter((t) => t.status !== "erledigt");
  const hinweise: SynergieHinweis[] = [];

  const geruestTasks = offen.filter((t) => matchesAny(`${t.gewerk} ${t.title}`, GERUEST_KEYWORDS));
  if (geruestTasks.length >= 2) {
    hinweise.push({
      id: "geruest",
      titel: "Gerüst-Synergie entdeckt",
      beschreibung: `Gerüst gemeinsam nutzen! ${geruestTasks.map((t) => t.gewerk).join(", ")} sind zeitlich bündelbar.`,
      betroffeneTasks: geruestTasks.map((t) => t.id),
      einsparungText: "Einsparung bis zu 3.000 € durch abgestimmte Standzeiten statt Mehrfach-Aufbau.",
    });
  }

  const erdTasks = offen.filter((t) => matchesAny(`${t.gewerk} ${t.title} ${t.description}`, ERDARBEITEN_KEYWORDS));
  if (erdTasks.length >= 2) {
    hinweise.push({
      id: "erdarbeiten",
      titel: "Erdarbeiten-Synergie entdeckt",
      beschreibung: `Baggerarbeiten bündeln: ${erdTasks.map((t) => t.title).join(", ")} – ein gemeinsamer Baggereinsatz spart Anfahrt & Standzeit.`,
      betroffeneTasks: erdTasks.map((t) => t.id),
      einsparungText: "Einsparung durch einen statt mehrere Baggereinsätze (Anfahrt, Vorhaltekosten).",
    });
  }

  const vorTasks = offen.filter((t) => matchesAny(t.gewerk, SCHLITZ_VORGEWERKE));
  const folgeTasks = offen.filter((t) => matchesAny(`${t.gewerk} ${t.title}`, SCHLITZ_FOLGEGEWERKE));
  if (vorTasks.length >= 1 && folgeTasks.length >= 1) {
    hinweise.push({
      id: "schlitz",
      titel: "Rohbau/Schlitz-Synergie entdeckt",
      beschreibung: `Elektro, Sanitär und Klima zeitlich VOR ${folgeTasks.map((t) => t.title).join(", ")} koordinieren – sonst müssen frische Wände wieder aufgestemmt werden.`,
      betroffeneTasks: [...vorTasks.map((t) => t.id), ...folgeTasks.map((t) => t.id)],
      einsparungText: "Vermeidet teures Nachträgliches Schlitzen/Stemmen in fertigem Putz.",
    });
  }

  return hinweise;
}

// ---------------------------------------------------------------------------
// 4) Bau-Anwalt & Norm-Check (Mängel-Assistent)
// ---------------------------------------------------------------------------

interface MangelRegel {
  keywords: string[];
  antwort: string;
}

const MANGEL_REGELN: MangelRegel[] = [
  {
    keywords: ["riss", "risse"],
    antwort:
      "Sachlicher Hinweis: Risse können auf unzureichende Bewehrung, zu schnelle Austrocknung oder falsche Materialwahl hindeuten. " +
      "Nach § 633 BGB bzw. VOB/B § 13 liegt ein Mangel vor, wenn das Werk nicht die vereinbarte Beschaffenheit hat. " +
      "Fordern Sie schriftlich (Mängelrüge mit Frist, z. B. 14 Tage) zur Nachbesserung auf und dokumentieren Sie die Risse mit Fotos, Maßstab und Datum. " +
      "Verweisen Sie auf DIN 18550 (Putz) bzw. DIN 18560 (Estrich), je nach betroffenem Gewerk.",
  },
  {
    keywords: ["feuchtigkeit", "feucht", "schimmel", "wasser eindringen"],
    antwort:
      "Feuchtigkeitsschäden sind ein klassischer Mangel nach VOB/B § 13 bzw. BGB § 633, wenn die Abdichtung nicht normgerecht ausgeführt wurde. " +
      "Relevante Normen: DIN 18533 (Abdichtung erdberührter Bauteile) bzw. DIN 18531 (Dachabdichtung). " +
      "Setzen Sie eine angemessene Frist zur Mängelbeseitigung schriftlich, sonst drohen Folgeschäden (Schimmel), für die der Verursacher haftbar bleibt. " +
      "Empfehlung: Vor der Rüge ein Feuchtigkeitsprotokoll (Messwerte, Fotos) erstellen.",
  },
  {
    keywords: ["estrich", "zu früh", "belag verlegen"],
    antwort:
      "Estrich darf erst nach Erreichen der Belegreife (CM-Messung!) mit Bodenbelag versehen werden – Richtwerte nach DIN 18560: " +
      "Zementestrich ca. ≤2,0 CM-% (mit Fußbodenheizung ≤1,8 CM-%), Anhydritestrich ≤0,5 CM-% (mit FBH ≤0,3 CM-%). " +
      "Bestehen Sie auf einem schriftlichen CM-Messprotokoll vor Belagsverlegung – ohne dieses Protokoll haftet bei späteren Schäden ggf. der Verleger mit.",
  },
  {
    keywords: ["fliesen", "hohl", "hohlliegend"],
    antwort:
      "Hohlliegende Fliesen sind nach DIN 18157 (Fliesenverlegung) ein anerkannter Mangel – zulässig sind nur punktuelle, kleinflächige Hohlstellen. " +
      "Fordern Sie eine fachgerechte Nachbesserung (Ausbau & Neuverlegung der betroffenen Fliesen) und setzen Sie eine Frist gemäß VOB/B § 13 Abs. 5.",
  },
  {
    keywords: ["termin", "verzug", "verzögert", "verspätet", "nicht fertig"],
    antwort:
      "Bei Terminverzug ohne triftigen Grund können Sie sich auf § 286 BGB (Verzug) bzw. bei VOB-Verträgen auf § 5 VOB/B berufen. " +
      "Setzen Sie schriftlich eine angemessene Nachfrist mit Ankündigung der Konsequenzen (z. B. Ersatzvornahme auf Kosten des Auftragnehmers, § 8 VOB/B) – " +
      "ohne fristgebundene, schriftliche Mahnung ist eine spätere Kündigung/Ersatzvornahme rechtlich schwer durchsetzbar.",
  },
  {
    keywords: ["abnahme"],
    antwort:
      "Vor der Abnahme sollten Sie das Gewerk gemeinsam mit dem Handwerker begehen und alle Mängel in einem Abnahmeprotokoll dokumentieren (§ 640 BGB / § 12 VOB/B). " +
      "Unterschreiben Sie nur eine 'Abnahme unter Vorbehalt', solange Mängel offen sind – sonst kehrt sich die Beweislast für später entdeckte Mängel zu Ihren Ungunsten um.",
  },
  {
    keywords: ["gewährleistung", "mängelrüge", "garantie"],
    antwort:
      "Die gesetzliche Gewährleistungsfrist beträgt bei Bauwerken i. d. R. 5 Jahre ab Abnahme (§ 634a BGB), bei VOB/B-Verträgen kann sie vertraglich auf 4 Jahre verkürzt sein (§ 13 Abs. 4 VOB/B). " +
      "Rügen Sie Mängel immer schriftlich mit Fristsetzung – mündliche Hinweise sind im Streitfall schwer nachweisbar.",
  },
  {
    keywords: ["zusatzkosten", "nachtrag", "mehrkosten"],
    antwort:
      "Nachträge müssen vor Ausführung angekündigt und nach Möglichkeit schriftlich bestätigt werden (§ 2 Abs. 6 VOB/B bei Mehrleistungen). " +
      "Bestehen Sie auf einem Angebot vor Ausführungsbeginn – nachträglich mündlich behauptete Mehrkosten sind rechtlich angreifbar, wenn sie nicht vorher vereinbart wurden.",
  },
];

const MANGEL_FALLBACK =
  "Grundsätzlich gilt: Dokumentieren Sie die Situation mit Fotos/Datum, formulieren Sie eine sachliche, schriftliche Mängelrüge " +
  "mit angemessener Frist zur Nachbesserung (VOB/B § 13 bzw. BGB § 633/635) und verweisen Sie auf die einschlägige DIN-Norm des betroffenen Gewerks. " +
  "Bei Unsicherheit über die konkrete Norm empfiehlt sich Rücksprache mit einem unabhängigen Bausachverständigen, bevor Sie unterschreiben oder zahlen.";

export function mangelAssistentAntwort(input: string): string {
  const t = input.toLowerCase();
  const treffer = MANGEL_REGELN.filter((r) => r.keywords.some((k) => t.includes(k)));
  if (treffer.length === 0) return MANGEL_FALLBACK;
  return treffer.map((r) => r.antwort).join("\n\n");
}

// ---------------------------------------------------------------------------
// 5) Angebots-Analyse
// ---------------------------------------------------------------------------

const VERSTECKTE_KOSTEN_KEYWORDS = [
  { k: "baustrom", hinweis: "Baustrom wird gesondert abgerechnet – klären, ob im Angebot enthalten." },
  { k: "entsorgung", hinweis: "Entsorgungskosten separat ausgewiesen – Menge/Pauschale prüfen." },
  { k: "gerüst", hinweis: "Gerüstkosten geprüft – ggf. mit anderem Gewerk teilbar (siehe Synergie-Finder)." },
  { k: "express", hinweis: "Express-/Eilzuschlag enthalten – ist die Eile wirklich notwendig?" },
  { k: "anfahrt", hinweis: "Anfahrtspauschale enthalten – bei mehreren Terminen ggf. mehrfach fällig." },
  { k: "zuschlag", hinweis: "Zuschlag erkannt – genaue Definition beim Handwerker erfragen." },
  { k: "vorhaltekosten", hinweis: "Vorhaltekosten (z. B. Gerüst-Standzeit) – bei Verzögerungen können Zusatzkosten entstehen." },
];

// ---------------------------------------------------------------------------
// 6) Folgeaufgaben-Empfehlung (Timeline)
// ---------------------------------------------------------------------------

const FOLGEAUFGABEN_REGELN: { keywords: string[]; empfehlung: string }[] = [
  { keywords: ["estrich"], empfehlung: "Bodenbelag verlegen (erst nach CM-Messung / Belegreife)." },
  { keywords: ["putz", "verputz"], empfehlung: "Anstrich/Tapezieren nach Durchtrocknung planen." },
  { keywords: ["grundierung", "grundieren"], empfehlung: "Deckanstrich terminieren." },
  { keywords: ["abdichtung", "abdichten"], empfehlung: "Verfüllung/Folgegewerk erst nach Prüfung der Abdichtung freigeben." },
  { keywords: ["dampfbremse", "dämmung"], empfehlung: "Beplankung/Trockenbau als nächsten Schritt einplanen." },
  { keywords: ["rohinstallation"], empfehlung: "Zweite Beplankungsseite bzw. Innenputz erst nach Abnahme der Rohinstallation." },
];

export function empfehleFolgeaufgabe(gewerkUndTitel: string): string {
  const t = gewerkUndTitel.toLowerCase();
  const treffer = FOLGEAUFGABEN_REGELN.find((r) => r.keywords.some((k) => t.includes(k)));
  return treffer?.empfehlung ?? "Nachfolgegewerk prüfen und im Zeitplan terminieren.";
}

export function analyzeAngebotText(text: string): { hinweise: string[]; versteckteKosten: string[] } {
  const t = text.toLowerCase();
  const versteckteKosten = VERSTECKTE_KOSTEN_KEYWORDS.filter((v) => t.includes(v.k)).map((v) => v.hinweis);

  const hinweise: string[] = [];
  if (!/gewährleistung/.test(t)) hinweise.push("Keine Gewährleistungsangabe gefunden – vor Auftrag nachfragen.");
  if (!/(pauschal|festpreis)/.test(t) && !/nach aufwand/.test(t)) {
    hinweise.push("Unklar, ob Pauschal-/Festpreis oder Abrechnung nach Aufwand – unbedingt klären.");
  }
  if (!/(zahlungsziel|zahlung nach|skonto)/.test(t)) {
    hinweise.push("Keine Zahlungsbedingungen erkannt – Zahlungsplan (z. B. Abschlagszahlungen) einfordern.");
  }
  if (versteckteKosten.length === 0) {
    hinweise.push("Keine offensichtlichen Zusatzkosten-Schlagworte gefunden – Angebot wirkt auf den ersten Blick transparent.");
  }

  return { hinweise, versteckteKosten };
}
