"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Loader2, Lock } from "lucide-react";
import { CategoryEditor } from "@/components/CategoryEditor";
import { apiFetch, initTelegram, telegramUserId } from "@/lib/client";
import { formatCents } from "@/lib/money";
import type { Category, Kind, PlannedItem } from "@/lib/types";

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<PlannedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [edit, setEdit] = useState<Category | null>(null);
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

  // Category budget = sum of its planned items.
  const budgetByCat = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) m.set(it.categoryId, (m.get(it.categoryId) ?? 0) + it.amount);
    return m;
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

  const sections: { label: string; kind: Kind }[] = [
    { label: "Расходы", kind: "expense" },
    { label: "Доходы", kind: "income" },
  ];

  return (
    <main className="flex flex-1 flex-col overflow-y-auto" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <header
        className="sticky top-0 z-10 border-b px-4 py-3"
        style={{ background: "var(--accent)", borderColor: "var(--border)" }}
      >
        <h1 className="text-xl font-bold tracking-tight">Категории</h1>
      </header>
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pt-5 pb-6">

        {sections.map((sec) => {
          const cats = categories.filter((c) => c.kind === sec.kind);
          if (cats.length === 0) return null;
          return (
            <div key={sec.kind} className="flex flex-col gap-2">
              <p className="px-1 text-xs font-semibold uppercase" style={{ color: "var(--hint)" }}>
                {sec.label}
              </p>
              {cats.map((c) => {
                const budget = budgetByCat.get(c.id) ?? 0;
                return (
                  <button
                    key={c.id}
                    onClick={() => setEdit(c)}
                    className="flex flex-col gap-0.5 rounded-2xl border p-3 text-left transition active:scale-[0.99]"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                  >
                    <p className="truncate font-medium">{c.name}</p>
                    <p className="text-xs" style={{ color: "var(--hint)" }}>
                      {budget > 0 ? `${formatCents(budget)} / мес` : "Нет статей"}
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
        aria-label="Новая категория"
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
