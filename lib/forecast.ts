import type { PlannedItem, Transaction } from "@/lib/types";

// Month-by-month forecast. Each month layers the planned items (summed per
// category) on top of the running balance:
//  - expense: current month → Σitems − already-spent-this-month (min 0, by
//             category since transactions aren't tied to a specific item);
//             future → full Σitems.
//  - income:  per item — current month → counted only if today is before the
//             item's day (else it's already in the balance); future → full.

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
      if (g.kind === "income") {
        for (const it of g.items) {
          if (isCurrent && now.getDate() >= it.dayOfMonth) continue; // already arrived
          net += it.amount;
        }
      } else {
        const planned = g.items.reduce((s, it) => s + it.amount, 0);
        let rem = planned;
        if (isCurrent) {
          const spent = txs
            .filter((t) => t.categoryId === categoryId && sameMonth(new Date(t.occurredAt), y, m))
            .reduce((s, t) => s + t.amount, 0);
          rem = Math.max(0, planned - spent);
        }
        net -= rem;
      }
    }

    running += net;
    out.push({ year: y, monthIdx: m, net, endBalance: running });
  }

  return out;
}
