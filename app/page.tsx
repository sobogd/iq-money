"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Loader2, Lock } from "lucide-react";
import { AddSheet } from "@/components/AddSheet";
import { apiFetch, initTelegram, telegramUserId } from "@/lib/client";
import { formatBalance, formatCents } from "@/lib/money";
import { avatarGlyph, displayName } from "@/lib/avatar";
import type { Category, Transaction, TransactionsResponse } from "@/lib/types";

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Сегодня";
  if (same(d, y)) return "Вчера";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
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
    <main className="flex flex-1 flex-col overflow-y-auto" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* sticky header (styled like the tab bar) */}
      <header
        className="sticky top-0 z-10 border-b px-4 py-3"
        style={{ background: "var(--accent)", borderColor: "var(--border)" }}
      >
        <p className="text-xs uppercase tracking-wide" style={{ color: "var(--hint)" }}>Баланс</p>
        <p className="mt-0.5 text-3xl font-bold tracking-tight" style={{ color: balance < 0 ? "#ef4444" : "var(--text)" }}>
          {formatBalance(balance)}
        </p>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pt-5 pb-6">
        {txs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center" style={{ color: "var(--hint)" }}>
            <p className="text-sm">Пока нет операций. Нажмите +, чтобы добавить.</p>
          </div>
        ) : (
          groups.map((g) => (
            <div key={g.label} className="flex flex-col gap-2">
              <p className="px-1 text-xs font-semibold uppercase" style={{ color: "var(--hint)" }}>
                {g.label}
              </p>
              {g.items.map((t) => {
                const cat = t.category;
                const catLabel = cat
                  ? `${avatarGlyph(cat.name)} ${displayName(cat.name)}`
                  : t.kind === "income" ? "Доход" : "Расход";
                const note = t.note.trim();
                return (
                  <button
                    key={t.id}
                    onClick={() => setEditTx(t)}
                    className="flex items-center justify-between gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{note || catLabel}</p>
                      {note && <p className="truncate text-xs" style={{ color: "var(--hint)" }}>{catLabel}</p>}
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
        className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition active:scale-90"
        style={{ background: "var(--button)" }}
        aria-label="Добавить"
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
    </main>
  );
}
