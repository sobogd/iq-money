import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gate } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Edit a planned item.
export async function PATCH(req: Request, { params }: Ctx) {
  const g = gate(req);
  if ("res" in g) return g.res;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};
  if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (body?.kind === "income" || body?.kind === "expense") data.kind = body.kind;
  if (body?.amount !== undefined) {
    const amount = Number(body.amount);
    if (!Number.isInteger(amount) || amount <= 0)
      return NextResponse.json({ error: "bad amount" }, { status: 400 });
    data.amount = amount;
  }
  if (body?.dayOfMonth !== undefined) {
    const d = Number(body.dayOfMonth);
    if (!Number.isInteger(d) || d < 1 || d > 31)
      return NextResponse.json({ error: "dayOfMonth 1..31" }, { status: 400 });
    data.dayOfMonth = d;
  }
  if (body?.categoryId !== undefined) data.categoryId = body.categoryId || null;

  const item = await prisma.plannedItem.update({
    where: { id },
    data,
    include: { category: true },
  });
  return NextResponse.json(item);
}

// Delete (archive) a planned item. Linked real transactions keep their data;
// the link is nulled by the DB (onDelete: SetNull) only on a hard delete, so we
// archive to preserve the link history.
export async function DELETE(req: Request, { params }: Ctx) {
  const g = gate(req);
  if ("res" in g) return g.res;
  const { id } = await params;

  await prisma.plannedItem.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ ok: true });
}
