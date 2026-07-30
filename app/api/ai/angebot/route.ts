import { NextRequest, NextResponse } from "next/server";
import { analyzeAngebotAI } from "@/lib/ai-service";
import { analyzeAngebotText } from "@/lib/ai-simulator";

export async function POST(request: NextRequest) {
  const { text } = await request.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "text fehlt" }, { status: 400 });
  }

  try {
    const result = await analyzeAngebotAI(text);
    return NextResponse.json(result);
  } catch (err) {
    console.error("KI-Angebotsanalyse fehlgeschlagen, nutze Fallback:", err);
    return NextResponse.json(analyzeAngebotText(text));
  }
}
