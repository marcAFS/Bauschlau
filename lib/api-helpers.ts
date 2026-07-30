import { NextRequest, NextResponse } from "next/server";

// Bewusst locker getypt: dies ist eine dünne, generische Schicht über den
// Prisma-Model-Delegates (prisma.task, prisma.wunsch, ...), damit nicht für
// jede der 9 Entitäten eigene, fast identische Route-Handler geschrieben
// werden müssen. Laufzeit-Validierung passiert implizit durch Prisma selbst
// (ungültige Felder/Typen lösen einen Fehler aus, der als 400 beantwortet wird).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyDelegate = any;

const DATE_KEYS = ["createdAt", "updatedAt", "erledigtAm", "datum", "erstelltAm", "deadline"];

export function coerceDates(data: Record<string, unknown>): Record<string, unknown> {
  const copy: Record<string, unknown> = { ...data };
  for (const key of DATE_KEYS) {
    if (typeof copy[key] === "string") {
      copy[key] = new Date(copy[key] as string);
    }
  }
  return copy;
}

export function createCollectionHandlers(delegate: AnyDelegate) {
  async function POST(request: NextRequest) {
    try {
      const body = await request.json();
      const created = await delegate.create({ data: coerceDates(body) });
      return NextResponse.json(created, { status: 201 });
    } catch (err) {
      console.error("POST fehlgeschlagen:", err);
      return NextResponse.json({ error: "Speichern fehlgeschlagen" }, { status: 400 });
    }
  }
  return { POST };
}

export function createItemHandlers(delegate: AnyDelegate) {
  async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await context.params;
      const body = await request.json();
      const updated = await delegate.update({ where: { id }, data: coerceDates(body) });
      return NextResponse.json(updated);
    } catch (err) {
      console.error("PATCH fehlgeschlagen:", err);
      return NextResponse.json({ error: "Aktualisieren fehlgeschlagen" }, { status: 400 });
    }
  }

  async function DELETE(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
    try {
      const { id } = await context.params;
      await delegate.delete({ where: { id } });
      return NextResponse.json({ ok: true });
    } catch (err) {
      console.error("DELETE fehlgeschlagen:", err);
      return NextResponse.json({ error: "Löschen fehlgeschlagen" }, { status: 400 });
    }
  }

  return { PATCH, DELETE };
}
