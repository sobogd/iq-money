import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gate } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

// List active planned items.
export async function GET(req: Request) {
  const g = gate(req);
  if ("res" in g) return g.res;

  const items = await prisma.plannedItem.findMany({
    where: { active: true },
    include: { category: true },
    orderBy: [{ kind: "asc" }, { dayOfMonth: "asc" }],
  });
  return NextResponse.json(items);
}

// Create a planned item.
export async function POST(req: Request) {
  const g = gate(req);
  if ("res" in g) return g.res;

  const body = await req.json().catch(() => null);
  const name = String(body?.name || "").trim();
  const kind = body?.kind === "income" ? "income" : "expense";
  const amount = Number(body?.amount);
  const dayOfMonth = Number(body?.dayOfMonth);
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  if (!Number.isInteger(amount) || amount <= 0)
    return NextResponse.json({ error: "bad amount" }, { status: 400 });
  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31)
    return NextResponse.json({ error: "dayOfMonth 1..31" }, { status: 400 });

  const item = await prisma.plannedItem.create({
    data: {
      name,
      kind,
      amount,
      dayOfMonth,
      categoryId: body?.categoryId || null,
      createdBy: g.owner,
    },
    include: { category: true },
  });
  return NextResponse.json(item, { status: 201 });
}
