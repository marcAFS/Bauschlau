import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { coerceDates } from "@/lib/api-helpers";

interface ImportPayload {
  tasks?: Record<string, unknown>[];
  wuensche?: Record<string, unknown>[];
  raumProfile?: Record<string, unknown>[];
  protokolle?: Record<string, unknown>[];
  fotos?: Record<string, unknown>[];
  rechnungen?: Record<string, unknown>[];
  angebote?: Record<string, unknown>[];
  bautagebuch?: Record<string, unknown>[];
  mangelChat?: Record<string, unknown>[];
}

// Einmaliger Import bereits im Browser (localStorage) vorhandener Bau-Schlau-
// Daten in die Datenbank. IDs sind bereits client-seitig vergeben (uuid), ein
// erneuter Aufruf überspringt daher bereits vorhandene Datensätze.
export async function POST(request: NextRequest) {
  try {
    const body: ImportPayload = await request.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = (arr: Record<string, unknown>[] | undefined) => (arr ?? []).map(coerceDates) as any[];

    const result = await prisma.$transaction([
      prisma.task.createMany({ data: c(body.tasks), skipDuplicates: true }),
      prisma.wunsch.createMany({ data: c(body.wuensche), skipDuplicates: true }),
      prisma.raumProfil.createMany({ data: c(body.raumProfile), skipDuplicates: true }),
      prisma.protokoll.createMany({ data: c(body.protokolle), skipDuplicates: true }),
      prisma.foto.createMany({ data: c(body.fotos), skipDuplicates: true }),
      prisma.rechnung.createMany({ data: c(body.rechnungen), skipDuplicates: true }),
      prisma.angebot.createMany({ data: c(body.angebote), skipDuplicates: true }),
      prisma.bautagebuchEintrag.createMany({ data: c(body.bautagebuch), skipDuplicates: true }),
      prisma.mangelChatMessage.createMany({ data: c(body.mangelChat), skipDuplicates: true }),
    ]);

    return NextResponse.json({
      ok: true,
      importiert: {
        tasks: result[0].count,
        wuensche: result[1].count,
        raumProfile: result[2].count,
        protokolle: result[3].count,
        fotos: result[4].count,
        rechnungen: result[5].count,
        angebote: result[6].count,
        bautagebuch: result[7].count,
        mangelChat: result[8].count,
      },
    });
  } catch (err) {
    console.error("Import fehlgeschlagen:", err);
    return NextResponse.json({ error: "Import fehlgeschlagen" }, { status: 400 });
  }
}
