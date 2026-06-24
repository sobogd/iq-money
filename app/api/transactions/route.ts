import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gate } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

// List transactions (newest first) + the current signed balance.
export async function GET(req: Request) {
  const g = gate(req);
  if ("res" in g) return g.res;

  const [transactions, agg] = await Promise.all([
    prisma.transaction.findMany({
      orderBy: { occurredAt: "desc" },
      include: { category: true },
      take: 1000,
    }),
    prisma.transaction.groupBy({ by: ["kind"], _sum: { amount: true } }),
  ]);

  let balance = 0;
  for (const row of agg) {
    const sum = row._sum.amount ?? 0;
    balance += row.kind === "income" ? sum : -sum;
  }

  return NextResponse.json({ balance, transactions });
}

// Create a transaction.
export async function POST(req: Request) {
  const g = gate(req);
  if ("res" in g) return g.res;

  const body = await req.json().catch(() => null);
  const kind = body?.kind === "income" ? "income" : "expense";
  const amount = Number(body?.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount must be positive cents" }, { status: 400 });
  }

  const occurredAt = body?.occurredAt ? new Date(body.occurredAt) : new Date();
  if (Number.isNaN(occurredAt.getTime())) {
    return NextResponse.json({ error: "bad date" }, { status: 400 });
  }

  const tx = await prisma.transaction.create({
    data: {
      kind,
      amount,
      categoryId: body?.categoryId || null,
      note: String(body?.note || "").trim(),
      createdBy: g.owner,
      occurredAt,
    },
    include: { category: true },
  });
  return NextResponse.json(tx, { status: 201 });
}
