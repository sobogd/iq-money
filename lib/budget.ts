import type { Category, PlannedItem } from "@/lib/types";

// Planned-item totals per category id.
export function itemSumByCategory(items: PlannedItem[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) m.set(it.categoryId, (m.get(it.categoryId) ?? 0) + it.amount);
  return m;
}

// A category's effective monthly plan: the larger of its own amount and the
// sum of its planned items.
export function effectiveAmount(category: Category, itemsSum: number): number {
  return Math.max(category.amount || 0, itemsSum || 0);
}
