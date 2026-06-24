import type { CategoryPlan, Transaction } from "@/lib/types";

// Month-by-month forecast. Each month layers category plans on top of the
// running balance:
//  - expense: current month → plan − already-spent (min 0); future → full plan.
//  - income:  current month → full plan only if today is before the arrival day
//             (else it's already in the balance); future → full plan.

export type MonthPoint = {
  year: number;
  monthIdx: number; // 0..11
  net: number; // signed cents change during the month
  endBalance: number; // signed cents at month end
};

function sameMonth(d: Date, y: number, m: number): boolean {
  return d.getFullYear() === y && d.getMonth() === m;
}

export function monthlyForecast(
  plans: CategoryPlan[],
  txs: Transaction[],
  currentBalance: number,
  now: Date,
  monthsAhead: number,
): MonthPoint[] {
  const out: MonthPoint[] = [];
  let running = currentBalance;

  for (let i = 0; i <= monthsAhead; i++) {
    const y = now.getFullYear() + Math.floor((now.getMonth() + i) / 12);
    const m = (now.getMonth() + i) % 12;
    const isCurrent = i === 0;
    let net = 0;

    for (const plan of plans) {
      const cat = plan.category;
      if (!cat) continue;

      if (cat.kind === "income") {
        if (isCurrent && now.getDate() >= plan.dayOfMonth) continue; // already arrived
        net += plan.amount;
      } else {
        let rem = plan.amount;
        if (isCurrent) {
          const spent = txs
            .filter((t) => t.categoryId === plan.categoryId && sameMonth(new Date(t.occurredAt), y, m))
            .reduce((s, t) => s + t.amount, 0);
          rem = Math.max(0, plan.amount - spent);
        }
        net -= rem;
      }
    }

    running += net;
    out.push({ year: y, monthIdx: m, net, endBalance: running });
  }

  return out;
}
