"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Lock, CalendarClock } from "lucide-react";
import { apiFetch, initTelegram, telegramUserId } from "@/lib/client";
import { formatBalance } from "@/lib/money";
import { monthlyForecast, type MonthPoint } from "@/lib/forecast";
import type { CategoryPlan, Transaction, TransactionsResponse } from "@/lib/types";

const HORIZONS = [
  { label: "1 year", months: 12 },
  { label: "3 years", months: 36 },
  { label: "5 years", months: 60 },
  { label: "10 years", months: 120 },
];

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function Plan() {
  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [plans, setPlans] = useState<CategoryPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [months, setMonths] = useState(60);

  const load = useCallback(async () => {
    try {
      const [txRes, plRes] = await Promise.all([
        apiFetch("/api/transactions"),
        apiFetch("/api/category-plans"),
      ]);
      if (txRes.status === 403) {
        setForbidden(true);
        return;
      }
      if (txRes.ok) {
        const data: TransactionsResponse = await txRes.json();
        setBalance(data.balance);
        setTxs(data.transactions);
      }
      if (plRes.ok) setPlans(await plRes.json());
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    initTelegram();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const series = useMemo(
    () => monthlyForecast(plans, txs, balance, new Date(), months),
    [plans, txs, balance, months],
  );

  // Group the month points by year.
  const byYear = useMemo(() => {
    const groups: { year: number; points: MonthPoint[] }[] = [];
    for (const p of series) {
      const last = groups[groups.length - 1];
      if (last && last.year === p.year) last.points.push(p);
      else groups.push({ year: p.year, points: [p] });
    }
    return groups;
  }, [series]);

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center" style={{ background: "var(--bg)", color: "var(--hint)" }}>
        <Loader2 size={22} className="animate-spin" />
      </main>
    );
  }

  if (forbidden) {
    const id = telegramUserId();
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <Lock size={30} className="text-emerald-500" />
        <p className="text-base font-medium">Доступ ограничен</p>
        {id && (
          <div className="rounded-xl border px-4 py-2 font-mono text-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            ID: {id}
          </div>
        )}
      </main>
    );
  }

  const final = series[series.length - 1];

  return (
    <main className="flex flex-1 flex-col items-center overflow-y-auto px-4 pt-6 pb-6" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="flex w-full max-w-2xl flex-col gap-5">
        <header className="flex items-center gap-2">
          <CalendarClock size={22} className="text-emerald-500" />
          <h1 className="text-xl font-bold tracking-tight">Plan</h1>
        </header>

        {/* now + final projection */}
        <div className="rounded-2xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <p className="text-xs uppercase tracking-wide" style={{ color: "var(--hint)" }}>Now</p>
          <p className="text-2xl font-bold">{formatBalance(balance)}</p>
          {final && (
            <p className="mt-2 text-xs" style={{ color: "var(--hint)" }}>
              In {months / 12 >= 1 ? `${months / 12} yr` : `${months} mo`} →{" "}
              <span className="font-semibold" style={{ color: final.endBalance < 0 ? "#ef4444" : "var(--text)" }}>
                {formatBalance(final.endBalance)}
              </span>
            </p>
          )}
        </div>

        {/* horizon */}
        <div className="flex flex-wrap gap-2">
          {HORIZONS.map((h) => (
            <button
              key={h.months}
              onClick={() => setMonths(h.months)}
              className="rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95"
              style={
                months === h.months
                  ? { background: "var(--button)", borderColor: "var(--button)", color: "#fff" }
                  : { background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }
              }
            >
              {h.label}
            </button>
          ))}
        </div>

        {plans.length === 0 ? (
          <p className="py-6 text-center text-sm" style={{ color: "var(--hint)" }}>
            No category plans yet. Set monthly plans in the Categories tab.
          </p>
        ) : (
          byYear.map((g) => {
            const yearEnd = g.points[g.points.length - 1].endBalance;
            return (
              <div key={g.year} className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between px-1">
                  <p className="text-sm font-bold">{g.year}</p>
                  <p className="text-sm font-semibold" style={{ color: yearEnd < 0 ? "#ef4444" : "var(--text)" }}>
                    {formatBalance(yearEnd)}
                  </p>
                </div>
                {g.points.map((p) => (
                  <div
                    key={`${p.year}-${p.monthIdx}`}
                    className="flex items-center justify-between rounded-xl border px-3 py-2.5"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                  >
                    <span className="text-sm" style={{ color: "var(--hint)" }}>{MONTH_NAMES[p.monthIdx]}</span>
                    <div className="flex items-baseline gap-3">
                      <span className="text-xs" style={{ color: p.net >= 0 ? "#10b981" : "#ef4444" }}>
                        {p.net >= 0 ? "+" : "−"}
                        {formatBalance(Math.abs(p.net)).replace("-", "")}
                      </span>
                      <span className="w-24 text-right text-sm font-semibold" style={{ color: p.endBalance < 0 ? "#ef4444" : "var(--text)" }}>
                        {formatBalance(p.endBalance)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>

    </main>
  );
}
