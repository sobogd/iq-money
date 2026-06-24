import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gate } from "@/lib/server-auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// Edit a category (name/icon/color/kind).
export async function PATCH(req: Request, { params }: Ctx) {
  const g = gate(req);
  if ("res" in g) return g.res;
  const { id } = await params;

  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};
  if (typeof body?.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body?.icon === "string") data.icon = body.icon;
  if (typeof body?.color === "string") data.color = body.color;
  if (body?.kind === "income" || body?.kind === "expense") data.kind = body.kind;

  const category = await prisma.category.update({ where: { id }, data });
  return NextResponse.json(category);
}

// Delete a category. Archive (don't hard-delete) so past transactions keep
// their label; the category row is just hidden from the active list.
export async function DELETE(req: Request, { params }: Ctx) {
  const g = gate(req);
  if ("res" in g) return g.res;
  const { id } = await params;

  await prisma.category.update({ where: { id }, data: { archived: true } });
  return NextResponse.json({ ok: true });
}
