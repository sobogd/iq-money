"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Loader2, Lock } from "lucide-react";
import { PlannedItemEditor } from "@/components/PlannedItemEditor";
import { apiFetch, initTelegram, telegramUserId } from "@/lib/client";
import { formatCents } from "@/lib/money";
import { avatarGlyph, displayName } from "@/lib/avatar";
import type { Category, Kind, PlannedItem } from "@/lib/types";

export default function Planned() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<PlannedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [edit, setEdit] = useState<PlannedItem | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const [catRes, itRes] = await Promise.all([
        apiFetch("/api/categories"),
        apiFetch("/api/planned-items"),
      ]);
      if (catRes.status === 403) {
        setForbidden(true);
        return;
      }
      if (catRes.ok) setCategories(await catRes.json());
      if (itRes.ok) setItems(await itRes.json());
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

  const totals = useMemo(() => {
    let expense = 0;
    let income = 0;
    for (const it of items) {
      if (it.category?.kind === "income") income += it.amount;
      else expense += it.amount;
    }
    return { expense, income };
  }, [items]);

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

  const sections: { label: string; kind: Kind; total: number }[] = [
    { label: "Expense", kind: "expense", total: totals.expense },
    { label: "Income", kind: "income", total: totals.income },
  ];

  return (
    <main className="flex flex-1 flex-col items-center overflow-y-auto px-4 pt-6 pb-6" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="flex w-full max-w-2xl flex-col gap-5">
        <h1 className="text-xl font-bold tracking-tight">Planned</h1>

        {items.length === 0 && (
          <p className="py-10 text-center text-sm" style={{ color: "var(--hint)" }}>
            No planned items yet. Tap + to add recurring monthly expenses or income.
          </p>
        )}

        {sections.map((sec) => {
          const list = items.filter((it) => (it.category?.kind ?? "expense") === sec.kind);
          if (list.length === 0) return null;
          return (
            <div key={sec.kind} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between px-1">
                <p className="text-xs font-semibold uppercase" style={{ color: "var(--hint)" }}>{sec.label}</p>
                <p className="text-xs font-semibold" style={{ color: sec.kind === "income" ? "#10b981" : "var(--text)" }}>
                  {formatCents(sec.total)} / month
                </p>
              </div>
              {list.map((it) => (
                <button
                  key={it.id}
                  onClick={() => setEdit(it)}
                  className="flex items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]"
                  style={{ background: "var(--card)", borderColor: "var(--border)" }}
                >
                  <span className="w-7 shrink-0 text-center text-xl">
                    {it.category ? avatarGlyph(it.category.name) : "•"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{it.name}</p>
                    <p className="truncate text-xs" style={{ color: "var(--hint)" }}>
                      {it.category ? displayName(it.category.name) : "—"} · day {it.dayOfMonth}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold" style={{ color: sec.kind === "income" ? "#10b981" : "var(--text)" }}>
                    {formatCents(it.amount)}
                  </span>
                </button>
              ))}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setCreating(true)}
        className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition active:scale-90"
        style={{ background: "var(--button)" }}
        aria-label="New planned item"
      >
        <Plus size={26} />
      </button>

      {creating && (
        <PlannedItemEditor
          categories={categories}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}
      {edit && (
        <PlannedItemEditor
          categories={categories}
          edit={edit}
          onClose={() => setEdit(null)}
          onSaved={() => {
            setEdit(null);
            load();
          }}
        />
      )}
    </main>
  );
}
