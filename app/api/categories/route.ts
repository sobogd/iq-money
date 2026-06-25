import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gate } from "@/lib/server-auth";
import { ensureSeed } from "@/lib/seed";

export const dynamic = "force-dynamic";

// List all active categories (seeds defaults on first run).
export async function GET(req: Request) {
  const g = gate(req);
  if ("res" in g) return g.res;

  await ensureSeed();
  const categories = await prisma.category.findMany({
    where: { archived: false },
    orderBy: [{ kind: "asc" }, { createdAt: "asc" }],
  });
  return NextResponse.json(categories);
}

// Create a category.
export async function POST(req: Request) {
  const g = gate(req);
  if ("res" in g) return g.res;

  const body = await req.json().catch(() => null);
  const name = String(body?.name || "").trim();
  const kind = body?.kind === "income" ? "income" : "expense";
  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const category = await prisma.category.create({
    data: {
      name,
      kind,
    },
  });
  return NextResponse.json(category, { status: 201 });
}
