import { prisma } from "@/lib/prisma";

// Default categories created once, the first time the categories list is empty.
const DEFAULTS: { name: string; kind: string }[] = [
  { name: "🍔 Еда", kind: "expense" },
  { name: "☕ Кафе", kind: "expense" },
  { name: "🚗 Транспорт", kind: "expense" },
  { name: "🏠 Дом", kind: "expense" },
  { name: "🛍️ Покупки", kind: "expense" },
  { name: "💊 Здоровье", kind: "expense" },
  { name: "🎮 Развлечения", kind: "expense" },
  { name: "🧾 Счета", kind: "expense" },
  { name: "💰 Зарплата", kind: "income" },
  { name: "🐷 Прочий доход", kind: "income" },
];

export async function ensureSeed(): Promise<void> {
  const count = await prisma.category.count();
  if (count > 0) return;
  await prisma.category.createMany({ data: DEFAULTS });
}
