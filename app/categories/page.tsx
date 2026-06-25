"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Loader2, Lock } from "lucide-react";
import { CategoryEditor } from "@/components/CategoryEditor";
import { apiFetch, initTelegram, telegramUserId } from "@/lib/client";
import { formatCents } from "@/lib/money";
import type { Category, CategoryPlan, Kind } from "@/lib/types";

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [plans, setPlans] = useState<CategoryPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [edit, setEdit] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const [catRes, plRes] = await Promise.all([
        apiFetch("/api/categories"),
        apiFetch("/api/category-plans"),
      ]);
      if (catRes.status === 403) {
        setForbidden(true);
        return;
      }
      if (catRes.ok) setCategories(await catRes.json());
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

  const planByCat = useMemo(() => {
    const m = new Map<string, CategoryPlan>();
    for (const p of plans) m.set(p.categoryId, p);
    return m;
  }, [plans]);

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

  const sections: { label: string; kind: Kind }[] = [
    { label: "Expense", kind: "expense" },
    { label: "Income", kind: "income" },
  ];

  return (
    <main className="flex flex-1 flex-col items-center overflow-y-auto px-4 pt-6 pb-6" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="flex w-full max-w-2xl flex-col gap-5">
        <h1 className="text-xl font-bold tracking-tight">Categories</h1>

        {sections.map((sec) => {
          const cats = categories.filter((c) => c.kind === sec.kind);
          if (cats.length === 0) return null;
          return (
            <div key={sec.kind} className="flex flex-col gap-2">
              <p className="px-1 text-xs font-semibold uppercase" style={{ color: "var(--hint)" }}>
                {sec.label}
              </p>
              {cats.map((c) => {
                const plan = planByCat.get(c.id);
                return (
                  <button
                    key={c.id}
                    onClick={() => setEdit(c)}
                    className="flex flex-col gap-0.5 rounded-2xl border p-3 text-left transition active:scale-[0.99]"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                  >
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="text-xs" style={{ color: "var(--hint)" }}>
                      {plan
                        ? sec.kind === "income"
                          ? `Plan ${formatCents(plan.amount)} · day ${plan.dayOfMonth}`
                          : `Plan ${formatCents(plan.amount)} / month`
                        : "No plan"}
                    </p>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setCreating(true)}
        className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition active:scale-90"
        style={{ background: "var(--button)" }}
        aria-label="New category"
      >
        <Plus size={26} />
      </button>

      {creating && (
        <CategoryEditor
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            load();
          }}
        />
      )}
      {edit && (
        <CategoryEditor
          category={edit}
          plan={planByCat.get(edit.id)}
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
