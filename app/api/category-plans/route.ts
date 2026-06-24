import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gate } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

// List active category plans (with their category).
export async function GET(req: Request) {
  const g = gate(req);
  if ("res" in g) return g.res;

  const plans = await prisma.categoryPlan.findMany({
    where: { active: true },
    include: { category: true },
  });
  return NextResponse.json(plans);
}

// Upsert the plan for a category (one plan per category). amount=0 removes it.
export async function POST(req: Request) {
  const g = gate(req);
  if ("res" in g) return g.res;

  const body = await req.json().catch(() => null);
  const categoryId = String(body?.categoryId || "");
  const amount = Number(body?.amount);
  const dayOfMonth = Number(body?.dayOfMonth);
  if (!categoryId) return NextResponse.json({ error: "categoryId required" }, { status: 400 });
  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31)
    return NextResponse.json({ error: "dayOfMonth 1..31" }, { status: 400 });

  // amount <= 0 → clear the plan for this category.
  if (!Number.isInteger(amount) || amount <= 0) {
    await prisma.categoryPlan.deleteMany({ where: { categoryId } });
    return NextResponse.json({ ok: true, cleared: true });
  }

  const plan = await prisma.categoryPlan.upsert({
    where: { categoryId },
    create: { categoryId, amount, dayOfMonth, createdBy: g.owner },
    update: { amount, dayOfMonth, active: true },
    include: { category: true },
  });
  return NextResponse.json(plan, { status: 201 });
}
