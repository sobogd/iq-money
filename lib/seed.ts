import { prisma } from "@/lib/prisma";

// Default categories created once, the first time the categories list is empty.
const DEFAULTS: { name: string; icon: string; color: string; kind: string }[] = [
  { name: "Food", icon: "utensils", color: "#10b981", kind: "expense" },
  { name: "Cafe", icon: "coffee", color: "#f97316", kind: "expense" },
  { name: "Transport", icon: "car", color: "#3b82f6", kind: "expense" },
  { name: "Home", icon: "home", color: "#8b5cf6", kind: "expense" },
  { name: "Shopping", icon: "shopping-bag", color: "#ec4899", kind: "expense" },
  { name: "Health", icon: "heart-pulse", color: "#ef4444", kind: "expense" },
  { name: "Fun", icon: "gamepad-2", color: "#14b8a6", kind: "expense" },
  { name: "Bills", icon: "receipt", color: "#64748b", kind: "expense" },
  { name: "Salary", icon: "wallet", color: "#10b981", kind: "income" },
  { name: "Other income", icon: "piggy-bank", color: "#84cc16", kind: "income" },
];

export async function ensureSeed(): Promise<void> {
  const count = await prisma.category.count();
  if (count > 0) return;
  await prisma.category.createMany({ data: DEFAULTS });
}
