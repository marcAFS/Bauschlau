import "server-only";
import { Type } from "@google/genai";
import { getGeminiClient, AI_MODEL, BAULEITER_SYSTEM_PROMPT } from "./ai-client";
import type { Bereich, WunschAnalyse, ProtokollExtraktion, MangelChatMessage } from "./types";

const BEREICH_ENUM: Bereich[] = ["keller", "eg", "og", "dach", "garage", "garten", "fassade"];

function parseJson<T>(text: string | undefined): T {
  if (!text) throw new Error("Gemini hat keine Antwort geliefert.");
  return JSON.parse(text) as T;
}

// ---------------------------------------------------------------------------
// Wunsch-Analyse
// ---------------------------------------------------------------------------

export async function analyzeWunschAI(text: string): Promise<WunschAnalyse> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: AI_MODEL,
    contents:
      `Ein Bauherr hat folgenden Sanierungs-/Ausstattungswunsch notiert:\n\n"${text}"\n\n` +
      "Analysiere ihn wie ein erfahrener Bauleiter: Welche technischen Hinweise/Schnittstellen sind wichtig, " +
      "welche Rückfragen sollten geklärt werden, und welche konkreten Gewerke-Aufgaben (mit passendem 3D-Hausbereich) ergeben sich daraus?",
    config: {
      systemInstruction: BAULEITER_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hinweise: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3-5 konkrete, technische Hinweise/Schnittstellen (z.B. Normen, Vorlaufarbeiten)",
          },
          rueckfragen: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "1-3 gezielte Rückfragen zur Konkretisierung",
          },
          vorgeschlageneGewerke: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                bereich: { type: Type.STRING, enum: BEREICH_ENUM },
                gewerk: { type: Type.STRING, description: "z.B. Elektro-Rohinstallation, Dachdecker" },
                titel: { type: Type.STRING, description: "Kurzer Aufgaben-Titel" },
              },
              required: ["bereich", "gewerk", "titel"],
            },
            description: "1-4 konkrete Aufgaben, die aus dem Wunsch entstehen",
          },
        },
        required: ["hinweise", "rueckfragen", "vorgeschlageneGewerke"],
      },
    },
  });

  return parseJson<WunschAnalyse>(response.text);
}

// ---------------------------------------------------------------------------
// Protokoll-Extraktion
// ---------------------------------------------------------------------------

export async function extractFromProtokollAI(text: string): Promise<ProtokollExtraktion> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: AI_MODEL,
    contents:
      `Folgendes ist ein frei diktiertes Gesprächsprotokoll von der Baustelle (Telefonat/Notiz):\n\n"${text}"\n\n` +
      "Extrahiere daraus: 1) konkrete, in sich verständliche neue Aufgaben (fasse zusammenhängende Sätze zu " +
      "sinnvollen, eigenständigen Aufgaben zusammen statt jeden Satz einzeln zu nehmen), 2) Auflagen/Norm-Hinweise " +
      "(z.B. Vorgaben von Energieberater/Schornsteinfeger), 3) wichtige Termine/Fristen. " +
      "Erfinde nichts hinzu, was nicht im Text steht.",
    config: {
      systemInstruction: BAULEITER_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          aufgaben: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                titel: { type: Type.STRING, description: "Kurzer, eigenständig verständlicher Aufgaben-Titel" },
                bereich: { type: Type.STRING, enum: BEREICH_ENUM },
                beschreibung: { type: Type.STRING, description: "1-2 Sätze Kontext aus dem Protokoll" },
              },
              required: ["titel", "bereich", "beschreibung"],
            },
          },
          auflagen: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Norm-/Auflagen-Hinweise, wörtlich oder sinngemäß aus dem Text",
          },
          termine: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                datum: { type: Type.STRING, description: "Erkanntes Datum/KW/Frist, falls vorhanden" },
              },
              required: ["text"],
            },
          },
        },
        required: ["aufgaben", "auflagen", "termine"],
      },
    },
  });

  return parseJson<ProtokollExtraktion>(response.text);
}

// ---------------------------------------------------------------------------
// Angebots-Analyse
// ---------------------------------------------------------------------------

export interface AngebotAnalyseErgebnis {
  hinweise: string[];
  versteckteKosten: string[];
}

export async function analyzeAngebotAI(text: string): Promise<AngebotAnalyseErgebnis> {
  const ai = getGeminiClient();

  const response = await ai.models.generateContent({
    model: AI_MODEL,
    contents: `Prüfe folgenden Handwerker-Angebotstext auf versteckte Zusatzkosten und fehlende Angaben:\n\n"${text}"`,
    config: {
      systemInstruction: BAULEITER_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          hinweise: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Fehlende Angaben oder Punkte, die vor Auftragsvergabe geklärt werden sollten",
          },
          versteckteKosten: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Erkannte separat abgerechnete oder unklare Kostenpositionen",
          },
        },
        required: ["hinweise", "versteckteKosten"],
      },
    },
  });

  return parseJson<AngebotAnalyseErgebnis>(response.text);
}

// ---------------------------------------------------------------------------
// Bau-Anwalt & Norm-Check (Chat)
// ---------------------------------------------------------------------------

const MANGEL_SYSTEM_PROMPT =
  BAULEITER_SYSTEM_PROMPT +
  " Du hilfst konkret dabei, Mängel oder Streitpunkte mit Handwerkern sachlich und rechtssicher anzusprechen, " +
  "unter Verweis auf einschlägige DIN-Normen und die VOB/B bzw. das BGB-Werkvertragsrecht. " +
  "Weise bei größeren/unklaren Fällen darauf hin, einen Fachanwalt für Baurecht oder Bausachverständigen hinzuzuziehen.";

export async function mangelChatAI(history: Pick<MangelChatMessage, "role" | "text">[]): Promise<string> {
  const ai = getGeminiClient();
  const recent = history.slice(-20);

  const response = await ai.models.generateContent({
    model: AI_MODEL,
    contents: recent.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    })),
    config: {
      systemInstruction: MANGEL_SYSTEM_PROMPT,
    },
  });

  return response.text ?? "";
}
