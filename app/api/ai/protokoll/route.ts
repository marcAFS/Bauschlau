import { NextRequest, NextResponse } from "next/server";
import { extractFromProtokollAI } from "@/lib/ai-service";
import { extractFromProtokoll } from "@/lib/ai-simulator";

export async function POST(request: NextRequest) {
  const { text } = await request.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text fehlt" }, { status: 400 });
  }

  try {
    const result = await extractFromProtokollAI(text);
    return NextResponse.json(result);
  } catch (err) {
    console.error("KI-Protokollanalyse fehlgeschlagen, nutze Fallback:", err);
    return NextResponse.json(extractFromProtokoll(text));
  }
}
