import { NextRequest, NextResponse } from "next/server";
import { mangelChatAI } from "@/lib/ai-service";
import { mangelAssistentAntwort } from "@/lib/ai-simulator";
import type { MangelChatMessage } from "@/lib/types";

export async function POST(request: NextRequest) {
  const { history } = (await request.json()) as { history: Pick<MangelChatMessage, "role" | "text">[] };
  if (!Array.isArray(history) || history.length === 0) {
    return NextResponse.json({ error: "history fehlt" }, { status: 400 });
  }

  try {
    const text = await mangelChatAI(history);
    return NextResponse.json({ text });
  } catch (err) {
    console.error("KI-Bau-Anwalt fehlgeschlagen, nutze Fallback:", err);
    const lastUserMessage = [...history].reverse().find((m) => m.role === "user");
    return NextResponse.json({ text: mangelAssistentAntwort(lastUserMessage?.text ?? "") });
  }
}
