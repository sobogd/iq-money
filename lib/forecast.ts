import type { PlannedItem } from "@/lib/types";

// Month-by-month forecast layered on top of the running balance.
//  - future months: add every planned income, subtract every planned expense.
//  - current month: a planned item whose day-of-month has already passed is
//    treated as paid/received (assumed reflected in the balance) and skipped;
//    items still upcoming this month are applied. The balance carries reality;
//    the forecast only adds what is still pending for the rest of the month.

export type MonthPoint = {
  year: number;
  monthIdx: number; // 0..11
  net: number; // signed cents change during the month
  endBalance: number; // signed cents at month end
};

export function monthlyForecast(
  items: PlannedItem[],
  currentBalance: number,
  now: Date,
  monthsAhead: number,
): MonthPoint[] {
  const out: MonthPoint[] = [];
  let running = currentBalance;
  const today = now.getDate();

  for (let i = 0; i <= monthsAhead; i++) {
    const y = now.getFullYear() + Math.floor((now.getMonth() + i) / 12);
    const m = (now.getMonth() + i) % 12;
    const isCurrent = i === 0;
    let net = 0;

    for (const it of items) {
      // Current month: a payment whose day already passed counts as done.
      if (isCurrent && today > it.dayOfMonth) continue;
      net += it.category?.kind === "income" ? it.amount : -it.amount;
    }

    running += net;
    out.push({ year: y, monthIdx: m, net, endBalance: running });
  }

  return out;
}
