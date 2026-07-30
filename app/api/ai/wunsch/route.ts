import { NextRequest, NextResponse } from "next/server";
import { analyzeWunschAI } from "@/lib/ai-service";
import { analyzeWunsch } from "@/lib/ai-simulator";

export async function POST(request: NextRequest) {
  const { text } = await request.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text fehlt" }, { status: 400 });
  }

  try {
    const result = await analyzeWunschAI(text);
    return NextResponse.json(result);
  } catch (err) {
    console.error("KI-Wunschanalyse fehlgeschlagen, nutze Fallback:", err);
    return NextResponse.json(analyzeWunsch(text));
  }
}
