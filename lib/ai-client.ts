import "server-only";
import { GoogleGenAI } from "@google/genai";

// Server-seitiger Singleton. Der API-Key wird nie an den Client gesendet –
// alle KI-Aufrufe laufen über Next.js Route Handler (app/api/ai/*).
let client: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY fehlt in den Umgebungsvariablen (.env).");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

// "-latest"-Alias statt fixer Versionsnummer, damit das Modell nicht durch
// Googles Modell-Deprecation-Zyklen bricht.
export const AI_MODEL = "gemini-flash-latest";

export const BAULEITER_SYSTEM_PROMPT =
  "Du bist ein erfahrener deutscher Bauleiter und Bausachverständiger, der einen privaten " +
  "Bauherren bei der Eigenleistungs-Sanierung seines Hauses berät. Antworte immer auf Deutsch, " +
  "sachlich, konkret und mit echtem Baufachwissen (DIN-Normen, VOB, Gewerke-Schnittstellen, " +
  "typische Baustellen-Praxis). Sei präzise und praxisnah, keine Allgemeinplätze.";
