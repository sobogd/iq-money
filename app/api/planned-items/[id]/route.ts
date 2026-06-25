import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gate } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Edit a planned item (name/amount/dayOfMonth/categoryId).
export async function PATCH(req: Request, { params }: Ctx) {
  const g = gate(req);
  if ("res" in g) return g.res;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};
  if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body?.categoryId === "string" && body.categoryId) data.categoryId = body.categoryId;
  if (body?.amount !== undefined) {
    const amount = Number(body.amount);
    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "bad amount" }, { status: 400 });
    }
    data.amount = amount;
  }
  if (body?.dayOfMonth !== undefined) {
    const day = Number(body.dayOfMonth);
    if (!Number.isInteger(day) || day < 1 || day > 31) {
      return NextResponse.json({ error: "bad day" }, { status: 400 });
    }
    data.dayOfMonth = day;
  }

  try {
    const item = await prisma.plannedItem.update({ where: { id }, data, include: { category: true } });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}

// Delete a planned item.
export async function DELETE(req: Request, { params }: Ctx) {
  const g = gate(req);
  if ("res" in g) return g.res;
  const { id } = await params;

  try {
    await prisma.plannedItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
