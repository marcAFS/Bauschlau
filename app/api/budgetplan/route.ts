import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Es gibt genau einen Finanzierungsplan -> fester Schlüssel, Speichern per Upsert.
const PLAN_ID = "plan";

function geldwert(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const data = {
      bankDarlehen: geldwert(body.bankDarlehen),
      eigenkapital: geldwert(body.eigenkapital),
      kfwDarlehen: geldwert(body.kfwDarlehen),
    };
    const saved = await prisma.budgetPlan.upsert({
      where: { id: PLAN_ID },
      create: { id: PLAN_ID, ...data },
      update: data,
    });
    return NextResponse.json(saved);
  } catch (err) {
    console.error("PUT budgetplan fehlgeschlagen:", err);
    return NextResponse.json({ error: "Speichern fehlgeschlagen" }, { status: 400 });
  }
}
