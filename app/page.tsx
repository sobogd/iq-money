"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Loader2, Lock, Tags, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { AddSheet } from "@/components/AddSheet";
import { CategoriesSheet } from "@/components/CategoriesSheet";
import { apiFetch, initTelegram, telegramUserId } from "@/lib/client";
import { formatBalance, formatCents } from "@/lib/money";
import { iconFor } from "@/lib/icons";
import type { Category, Transaction, TransactionsResponse } from "@/lib/types";

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Today";
  if (same(d, y)) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

function groupByDay(txs: Transaction[]): { label: string; items: Transaction[] }[] {
  const out: { label: string; items: Transaction[] }[] = [];
  for (const t of txs) {
    const label = dayLabel(t.occurredAt);
    const last = out[out.length - 1];
    if (last && last.label === label) last.items.push(t);
    else out.push({ label, items: [t] });
  }
  return out;
}

export default function Home() {
  const [balance, setBalance] = useState(0);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showCats, setShowCats] = useState(false);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const load = useCallback(async () => {
    try {
      const [txRes, catRes] = await Promise.all([
        apiFetch("/api/transactions"),
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
        <p className="max-w-xs text-sm" style={{ color: "var(--hint)" }}>
          Отправьте свой Telegram-ID администратору, чтобы получить доступ.
        </p>
        {id && (
          <div className="rounded-xl border px-4 py-2 font-mono text-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
            ID: {id}
          </div>
        )}
      </main>
    );
  }

  const groups = groupByDay(txs);

  return (
    <main className="flex min-h-[100dvh] flex-col items-center px-4 pb-28 pt-6" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="flex w-full max-w-2xl flex-col gap-5">
        <header className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide" style={{ color: "var(--hint)" }}>
              Balance
            </p>
            <p className="mt-1 text-4xl font-bold tracking-tight" style={{ color: balance < 0 ? "#ef4444" : "var(--text)" }}>
              {formatBalance(balance)}
            </p>
          </div>
          <button
            onClick={() => setShowCats(true)}
            className="flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium transition active:scale-95"
            style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}
          >
            <Tags size={16} /> Categories
          </button>
        </header>

        {txs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center" style={{ color: "var(--hint)" }}>
            <p className="text-sm">No transactions yet. Tap + to add one.</p>
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.label} className="flex flex-col gap-2">
              <p className="px-1 text-xs font-semibold uppercase" style={{ color: "var(--hint)" }}>
                {g.label}
              </p>
              {g.items.map((t) => {
                const Icon = t.category ? iconFor(t.category.icon) : t.kind === "income" ? ArrowDownLeft : ArrowUpRight;
                const color = t.category?.color ?? (t.kind === "income" ? "#10b981" : "#ef4444");
                return (
                  <button
                    key={t.id}
                    onClick={() => setEditTx(t)}
                    className="flex items-center gap-3 rounded-2xl border p-3 text-left shadow-sm transition active:scale-[0.99]"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: color + "22", color }}>
                      <Icon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{t.category?.name ?? (t.kind === "income" ? "Income" : "Expense")}</p>
                      {t.note && <p className="truncate text-xs" style={{ color: "var(--hint)" }}>{t.note}</p>}
                    </div>
                    <span className="shrink-0 font-semibold" style={{ color: t.kind === "income" ? "#10b981" : "var(--text)" }}>
                      {t.kind === "income" ? "+" : "−"}
                      {formatCents(t.amount)}
                    </span>
                  </button>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAdd(true)}
        className="fixed bottom-6 right-1/2 flex h-14 w-14 translate-x-1/2 items-center justify-center rounded-full text-white shadow-lg transition active:scale-90"
        style={{ background: "var(--button)" }}
        aria-label="Add"
      >
        <Plus size={26} />
      </button>

      {showAdd && (
        <AddSheet
          categories={categories}
          onClose={() => setShowAdd(false)}
          onSaved={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}
      {editTx && (
        <AddSheet
          categories={categories}
          edit={editTx}
          onClose={() => setEditTx(null)}
          onSaved={() => {
            setEditTx(null);
            load();
          }}
        />
      )}
      {showCats && (
        <CategoriesSheet
          categories={categories}
          onClose={() => setShowCats(false)}
          onChanged={load}
        />
      )}
    </main>
  );
}
