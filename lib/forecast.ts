import type { Category, PlannedItem } from "@/lib/types";
import { itemSumByCategory, effectiveAmount } from "@/lib/budget";

// Month-by-month forecast layered on top of the running balance. Each category
// contributes its effective monthly plan — max(category amount, Σ items) — as
// income (+) or expense (−), applied every month including the current one.

export type MonthPoint = {
  year: number;
  monthIdx: number; // 0..11
  net: number; // signed cents change during the month
  endBalance: number; // signed cents at month end
};

export function monthlyForecast(
  categories: Category[],
  items: PlannedItem[],
  currentBalance: number,
  now: Date,
  monthsAhead: number,
): MonthPoint[] {
  const sums = itemSumByCategory(items);

  // Signed monthly net from all categories (income positive, expense negative).
  let monthlyNet = 0;
  for (const c of categories) {
    const e = effectiveAmount(c, sums.get(c.id) ?? 0);
    if (e <= 0) continue;
    monthlyNet += c.kind === "income" ? e : -e;
  }

  const out: MonthPoint[] = [];
  let running = currentBalance;
  for (let i = 0; i <= monthsAhead; i++) {
    const y = now.getFullYear() + Math.floor((now.getMonth() + i) / 12);
    const m = (now.getMonth() + i) % 12;
    running += monthlyNet;
    out.push({ year: y, monthIdx: m, net: monthlyNet, endBalance: running });
  }

  return out;
}
