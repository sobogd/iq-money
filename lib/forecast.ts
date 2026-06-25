import type { PlannedItem, Transaction } from "@/lib/types";

// Month-by-month forecast. Each month layers the planned items (summed per
// category) on top of the running balance.
//  - future months: add full planned income, subtract full planned expense.
//  - current month: the balance already reflects whatever actually happened
//    this month, so we only "top up" to the plan — for BOTH income and expense
//    symmetrically: remaining = max(0, plan − actual-this-month-by-category).
//    (`dayOfMonth` is informational; it does not affect the math.)

export type MonthPoint = {
  year: number;
  monthIdx: number; // 0..11
  net: number; // signed cents change during the month
  endBalance: number; // signed cents at month end
};

function sameMonth(d: Date, y: number, m: number): boolean {
  return d.getFullYear() === y && d.getMonth() === m;
}

type CatGroup = { kind: string; items: PlannedItem[] };

export function monthlyForecast(
  items: PlannedItem[],
  txs: Transaction[],
  currentBalance: number,
  now: Date,
  monthsAhead: number,
): MonthPoint[] {
  // Group planned items by their category.
  const cats = new Map<string, CatGroup>();
  for (const it of items) {
    const kind = it.category?.kind ?? "expense";
    let g = cats.get(it.categoryId);
    if (!g) {
      g = { kind, items: [] };
      cats.set(it.categoryId, g);
    }
    g.items.push(it);
  }

  const out: MonthPoint[] = [];
  let running = currentBalance;

  for (let i = 0; i <= monthsAhead; i++) {
    const y = now.getFullYear() + Math.floor((now.getMonth() + i) / 12);
    const m = (now.getMonth() + i) % 12;
    const isCurrent = i === 0;
    let net = 0;

    for (const [categoryId, g] of cats) {
      const planned = g.items.reduce((s, it) => s + it.amount, 0);
      let rem = planned;
      if (isCurrent) {
        // What already happened this month for this category is in the balance;
        // only the remainder up to the plan still affects the projection.
        const actual = txs
          .filter((t) => t.categoryId === categoryId && sameMonth(new Date(t.occurredAt), y, m))
          .reduce((s, t) => s + t.amount, 0);
        rem = Math.max(0, planned - actual);
      }
      net += g.kind === "income" ? rem : -rem;
    }

    running += net;
    out.push({ year: y, monthIdx: m, net, endBalance: running });
  }

  return out;
}
