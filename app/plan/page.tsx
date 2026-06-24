"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Loader2, Lock, CalendarClock } from "lucide-react";
import { PlannedSheet } from "@/components/PlannedSheet";
import { TabBar } from "@/components/TabBar";
import { apiFetch, initTelegram, telegramUserId } from "@/lib/client";
import { formatBalance, formatCents } from "@/lib/money";
import { iconFor } from "@/lib/icons";
import { computeForecast } from "@/lib/forecast";
import type { Category, PlannedItem, Transaction, TransactionsResponse } from "@/lib/types";

function iso(d: Date): string {
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

function endOfMonth(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth() + 1, 0);
}
function addMonths(n: number): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
}

function monthLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function Plan() {
  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [planned, setPlanned] = useState<PlannedItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [target, setTarget] = useState(() => iso(endOfMonth()));
  const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<PlannedItem | null>(null);

  const load = useCallback(async () => {
    try {
      const [txRes, plRes, catRes] = await Promise.all([
        apiFetch("/api/transactions"),
        apiFetch("/api/planned"),
        apiFetch("/api/categories"),
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
      if (plRes.ok) setPlanned(await plRes.json());
      if (catRes.ok) setCategories(await catRes.json());
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

  const forecast = useMemo(() => {
    const t = new Date(target + "T23:59:59");
    if (Number.isNaN(t.getTime())) return null;
    const linked = txs.filter((x) => x.plannedItemId);
    return computeForecast(balance, planned, linked, t, new Date());
  }, [balance, planned, txs, target]);

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center" style={{ background: "var(--bg)", color: "var(--hint)" }}>
        <Loader2 size={22} className="animate-spin" />
      </main>
    );
  }

  if (forbidden) {
    const id = telegramUserId();
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center" style={{ background: "var(--bg)", color: "var(--text)" }}>
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

  const presets: { label: string; value: string }[] = [
    { label: "End of month", value: iso(endOfMonth()) },
    { label: "+1 month", value: iso(addMonths(1)) },
    { label: "+3 months", value: iso(addMonths(3)) },
  ];

  // Group forecast occurrences by month for the timeline.
  const groups: { label: string; items: NonNullable<typeof forecast>["occurrences"] }[] = [];
  for (const o of forecast?.occurrences ?? []) {
    const label = monthLabel(o.date);
    const last = groups[groups.length - 1];
    if (last && last.label === label) last.items.push(o);
    else groups.push({ label, items: [o] });
  }

  return (
    <main className="flex min-h-[100dvh] flex-col items-center px-4 pb-28 pt-6" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="flex w-full max-w-2xl flex-col gap-5">
        <header className="flex items-center gap-2">
          <CalendarClock size={22} className="text-emerald-500" />
          <h1 className="text-xl font-bold tracking-tight">Plan</h1>
        </header>

        {/* target date control */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => setTarget(p.value)}
                className="rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95"
                style={
                  target === p.value
                    ? { background: "var(--button)", borderColor: "var(--button)", color: "#fff" }
                    : { background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }
                }
              >
                {p.label}
              </button>
            ))}
            <input
              type="date"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="rounded-full border px-3 py-1.5 text-xs outline-none"
              style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>
        </div>

        {/* projected balance */}
        <div className="rounded-2xl border p-4" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
          <p className="text-xs uppercase tracking-wide" style={{ color: "var(--hint)" }}>
            Projected balance · {new Date(target + "T00:00:00").toLocaleDateString()}
          </p>
          <p className="mt-1 text-3xl font-bold" style={{ color: (forecast?.projected ?? 0) < 0 ? "#ef4444" : "var(--text)" }}>
            {formatBalance(forecast?.projected ?? balance)}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--hint)" }}>
            Now: {formatBalance(balance)}
          </p>
        </div>

        {/* forecast timeline */}
        {groups.length > 0 ? (
          groups.map((g) => (
            <div key={g.label} className="flex flex-col gap-2">
              <p className="px-1 text-xs font-semibold uppercase" style={{ color: "var(--hint)" }}>
                {g.label}
              </p>
              {g.items.map((o, i) => {
                const Icon = iconFor(o.icon);
                return (
                  <div
                    key={o.itemId + i}
                    className="flex items-center gap-3 rounded-2xl border p-3"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: o.color + "22", color: o.color }}>
                      <Icon size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{o.name}</p>
                      <p className="text-xs" style={{ color: "var(--hint)" }}>
                        ~{o.date.toLocaleDateString(undefined, { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold" style={{ color: o.kind === "income" ? "#10b981" : "var(--text)" }}>
                        {o.kind === "income" ? "+" : "−"}
                        {formatCents(o.amount)}
                      </p>
                      <p className="text-xs" style={{ color: "var(--hint)" }}>
                        {formatBalance(o.running)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <p className="py-6 text-center text-sm" style={{ color: "var(--hint)" }}>
            No upcoming planned charges before this date.
          </p>
        )}

        {/* planned items management */}
        <div className="mt-2 flex flex-col gap-2">
          <p className="px-1 text-xs font-semibold uppercase" style={{ color: "var(--hint)" }}>
            Recurring items
          </p>
          {planned.length === 0 ? (
            <p className="py-2 text-sm" style={{ color: "var(--hint)" }}>
              No planned items yet. Add one to forecast your balance.
            </p>
          ) : (
            planned.map((p) => {
              const Icon = iconFor(p.category?.icon ?? "circle");
              const color = p.category?.color ?? (p.kind === "income" ? "#10b981" : "#ef4444");
              return (
                <button
                  key={p.id}
                  onClick={() => setEditItem(p)}
                  className="flex items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]"
                  style={{ background: "var(--card)", borderColor: "var(--border)" }}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: color + "22", color }}>
                    <Icon size={17} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs" style={{ color: "var(--hint)" }}>
                      Day {p.dayOfMonth} · monthly
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold" style={{ color: p.kind === "income" ? "#10b981" : "var(--text)" }}>
                    {p.kind === "income" ? "+" : "−"}
                    {formatCents(p.amount)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition active:scale-90"
        style={{ background: "var(--button)" }}
        aria-label="Add planned"
      >
        <Plus size={26} />
      </button>

      {showAdd && (
        <PlannedSheet
          categories={categories}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}
      {editItem && (
        <PlannedSheet
          categories={categories}
          edit={editItem}
          onClose={() => setEditItem(null)}
          onSaved={() => {
            setEditItem(null);
            load();
          }}
        />
      )}

      <TabBar />
    </main>
  );
}
