import type { PlannedItem, Transaction } from "@/lib/types";

// Tolerance (days) for matching a planned item's approximate charge day to the
// real transaction that fulfilled it. Planned day 5, charged day 7 → still the
// same occurrence.
export const GAP_DAYS = 5;
const DAY_MS = 86_400_000;

export type Occurrence = {
  itemId: string;
  name: string;
  kind: "expense" | "income";
  amount: number; // cents, positive — estimated (real ones are already in balance)
  color: string;
  icon: string;
  date: Date; // expected charge date
  running: number; // projected balance right after this occurrence
};

export type Forecast = {
  projected: number; // balance at targetDate (cents, signed)
  occurrences: Occurrence[]; // future, unfulfilled planned charges up to targetDate
};

function startOfToday(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function clampDay(year: number, monthIdx: number, day: number): Date {
  const last = new Date(year, monthIdx + 1, 0).getDate();
  return new Date(year, monthIdx, Math.min(day, last));
}

function daysApart(a: Date, b: Date): number {
  return Math.abs(a.getTime() - b.getTime()) / DAY_MS;
}

// Project the balance forward to `target`, layering UNFULFILLED planned charges
// on top of the current real balance. Fulfilled occurrences (a linked real tx
// within ±GAP days) are skipped — they're already counted in `currentBalance`.
export function computeForecast(
  currentBalance: number,
  planned: PlannedItem[],
  linkedTxs: Transaction[],
  target: Date,
  now: Date,
): Forecast {
  const today = startOfToday(now);
  const occ: Omit<Occurrence, "running">[] = [];

  for (const item of planned) {
    // Iterate every month from the current one through the target month.
    let y = today.getFullYear();
    let m = today.getMonth();
    const endY = target.getFullYear();
    const endM = target.getMonth();
    while (y < endY || (y === endY && m <= endM)) {
      const date = clampDay(y, m, item.dayOfMonth);

      const fulfilled = linkedTxs.some(
        (t) => t.plannedItemId === item.id && daysApart(new Date(t.occurredAt), date) <= GAP_DAYS,
      );
      const longPast = date.getTime() + GAP_DAYS * DAY_MS < today.getTime();
      const withinTarget = date.getTime() <= target.getTime();

      if (!fulfilled && !longPast && withinTarget) {
        occ.push({
          itemId: item.id,
          name: item.name,
          kind: item.kind,
          amount: item.amount,
          color: item.category?.color ?? (item.kind === "income" ? "#10b981" : "#ef4444"),
          icon: item.category?.icon ?? "circle",
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
