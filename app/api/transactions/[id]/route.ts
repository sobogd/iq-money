import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gate } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Edit a transaction (amount/kind/category/note/date).
export async function PATCH(req: Request, { params }: Ctx) {
  const g = gate(req);
  if ("res" in g) return g.res;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};
  if (body?.kind === "income" || body?.kind === "expense") data.kind = body.kind;
  if (body?.amount !== undefined) {
    const amount = Number(body.amount);
    if (!Number.isInteger(amount) || amount <= 0) {
      return NextResponse.json({ error: "bad amount" }, { status: 400 });
    }
    data.amount = amount;
  }
  if (body?.categoryId !== undefined) data.categoryId = body.categoryId || null;
  if (typeof body?.note === "string") data.note = body.note.trim();
  if (body?.occurredAt) {
    const d = new Date(body.occurredAt);
    if (Number.isNaN(d.getTime())) return NextResponse.json({ error: "bad date" }, { status: 400 });
    data.occurredAt = d;
  }

  const tx = await prisma.transaction.update({
    where: { id },
    data,
    include: { category: true },
  });
  return NextResponse.json(tx);
}

// Delete a transaction (hard delete — balance recomputes from what remains).
export async function DELETE(req: Request, { params }: Ctx) {
  const g = gate(req);
  if ("res" in g) return g.res;
  const { id } = await params;

  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
