import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [tasks, wuensche, raumProfile, protokolle, fotos, rechnungen, angebote, bautagebuch, mangelChat] =
      await Promise.all([
        prisma.task.findMany({ orderBy: { createdAt: "desc" } }),
        prisma.wunsch.findMany({ orderBy: { createdAt: "desc" } }),
        prisma.raumProfil.findMany({ orderBy: { createdAt: "desc" } }),
        prisma.protokoll.findMany({ orderBy: { createdAt: "desc" } }),
        prisma.foto.findMany({ orderBy: { datum: "desc" } }),
        prisma.rechnung.findMany({ orderBy: { datum: "desc" } }),
        prisma.angebot.findMany({ orderBy: { erstelltAm: "desc" } }),
        prisma.bautagebuchEintrag.findMany({ orderBy: { datum: "desc" } }),
        prisma.mangelChatMessage.findMany({ orderBy: { createdAt: "asc" } }),
      ]);

    return NextResponse.json({
      tasks,
      wuensche,
      raumProfile,
      protokolle,
      fotos,
      rechnungen,
      angebote,
      bautagebuch,
      mangelChat,
    });
  } catch (err) {
    console.error("Laden des Gesamtzustands fehlgeschlagen:", err);
    return NextResponse.json({ error: "Laden fehlgeschlagen" }, { status: 500 });
  }
}
