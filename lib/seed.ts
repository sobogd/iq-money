import { prisma } from "@/lib/prisma";

// Default categories created once, the first time the categories list is empty.
const DEFAULTS: { name: string; color: string; kind: string }[] = [
  { name: "🍔 Food", color: "#10b981", kind: "expense" },
  { name: "☕ Cafe", color: "#f97316", kind: "expense" },
  { name: "🚗 Transport", color: "#3b82f6", kind: "expense" },
  { name: "🏠 Home", color: "#8b5cf6", kind: "expense" },
  { name: "🛍️ Shopping", color: "#ec4899", kind: "expense" },
  { name: "💊 Health", color: "#ef4444", kind: "expense" },
  { name: "🎮 Fun", color: "#14b8a6", kind: "expense" },
  { name: "🧾 Bills", color: "#64748b", kind: "expense" },
  { name: "💰 Salary", color: "#10b981", kind: "income" },
  { name: "🐷 Other income", color: "#84cc16", kind: "income" },
];

export async function ensureSeed(): Promise<void> {
  const count = await prisma.category.count();
  if (count > 0) return;
  await prisma.category.createMany({ data: DEFAULTS });
}
