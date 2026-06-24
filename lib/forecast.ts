import type { CategoryPlan, Transaction } from "@/lib/types";

// Forecast layers monthly category plans on top of the current real balance.
// Matching is by category over the calendar month: a category's remaining plan
// for a month = plan amount − real spending in that category that month.

export type Occurrence = {
  categoryId: string;
  name: string;
  kind: "expense" | "income";
  amount: number; // remaining cents for that month, positive
  color: string;
  icon: string;
  date: Date; // expected charge date (plan day, clamped)
  running: number; // projected balance right after this occurrence
};

export type Forecast = {
  projected: number; // balance at targetDate (cents, signed)
  occurrences: Occurrence[];
};

function clampDay(year: number, monthIdx: number, day: number): Date {
  const last = new Date(year, monthIdx + 1, 0).getDate();
  return new Date(year, monthIdx, Math.min(day, last));
}

function sameMonth(d: Date, y: number, m: number): boolean {
  return d.getFullYear() === y && d.getMonth() === m;
}

// Project balance forward to `target`. For each month from the current one to
// the target month, every active category plan contributes its remaining amount
// (plan − already-spent-in-category for the current month; full plan for future
// months). Past months are skipped.
export function computeForecast(
  plans: CategoryPlan[],
  txs: Transaction[],
  currentBalance: number,
  target: Date,
  now: Date,
): Forecast {
  const curY = now.getFullYear();
  const curM = now.getMonth();
  const endY = target.getFullYear();
  const endM = target.getMonth();

  const occ: Omit<Occurrence, "running">[] = [];

  for (const plan of plans) {
    const cat = plan.category;
    if (!cat) continue;

    let y = curY;
    let m = curM;
    while (y < endY || (y === endY && m <= endM)) {
      const date = clampDay(y, m, plan.dayOfMonth);
      const isCurrentMonth = y === curY && m === curM;

      let remaining = plan.amount;
      if (isCurrentMonth) {
        const spent = txs
          .filter((t) => t.categoryId === plan.categoryId && sameMonth(new Date(t.occurredAt), y, m))
          .reduce((s, t) => s + t.amount, 0);
        remaining = Math.max(0, plan.amount - spent);
      }

      if (remaining > 0 && date.getTime() <= target.getTime()) {
        occ.push({
          categoryId: plan.categoryId,
          name: cat.name,
          kind: cat.kind,
          amount: remaining,
          color: cat.color,
          icon: cat.icon,
          date,
        });
      }

      m += 1;
      if (m > 11) {
        m = 0;
        y += 1;
      }
    }
  }

  occ.sort((a, b) => a.date.getTime() - b.date.getTime());

  let running = currentBalance;
  const occurrences: Occurrence[] = occ.map((o) => {
    running += o.kind === "income" ? o.amount : -o.amount;
    return { ...o, running };
  });

  return { projected: running, occurrences };
}
