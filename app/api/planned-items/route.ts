import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gate } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

// List active planned items (with their category).
export async function GET(req: Request) {
  const g = gate(req);
  if ("res" in g) return g.res;

  const items = await prisma.plannedItem.findMany({
    where: { active: true },
    include: { category: true },
    orderBy: [{ createdAt: "asc" }],
  });
  return NextResponse.json(items);
}

// Create a planned item under a category.
export async function POST(req: Request) {
  const g = gate(req);
  if ("res" in g) return g.res;

  const body = await req.json().catch(() => null);
  const categoryId = String(body?.categoryId || "");
  const name = String(body?.name || "").trim();
  const amount = Number(body?.amount);
  if (!categoryId) return NextResponse.json({ error: "categoryId required" }, { status: 400 });
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });
  if (!Number.isInteger(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount must be positive cents" }, { status: 400 });
  }

  const rawDay = Number(body?.dayOfMonth);
  const dayOfMonth = Number.isInteger(rawDay) && rawDay >= 1 && rawDay <= 31 ? rawDay : 1;

  const item = await prisma.plannedItem.create({
    data: { categoryId, name, amount, dayOfMonth, createdBy: g.owner },
    include: { category: true },
  });
  return NextResponse.json(item, { status: 201 });
}
