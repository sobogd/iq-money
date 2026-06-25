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
  const [filter, setFilter] = useState<string>("all"); // categoryId | "all"

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

  // Apply the category filter (if any).
  const visibleItems = useMemo(
    () => (filter === "all" ? items : items.filter((it) => it.categoryId === filter)),
    [items, filter],
  );

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

  const kinds: { label: string; kind: Kind }[] = [
    { label: "Расходы", kind: "expense" },
    { label: "Доходы", kind: "income" },
  ];

  return (
    <main className="flex flex-1 flex-col overflow-y-auto" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* sticky header (styled like the tab bar) */}
      <header
        className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b px-4 py-3"
        style={{ background: "var(--accent)", borderColor: "var(--border)" }}
      >
        <h1 className="text-xl font-bold tracking-tight">Запланировано</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-[55%] truncate rounded-xl border px-3 py-1.5 text-sm outline-none"
          style={{ background: "var(--card)", borderColor: "var(--field-border)", color: "var(--text)" }}
        >
          <option value="all">Все категории</option>
          {kinds.map((k) => {
            const cats = categories.filter((c) => c.kind === k.kind);
            if (cats.length === 0) return null;
            return (
              <optgroup key={k.kind} label={k.label}>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
            );
          })}
        </select>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pt-5 pb-6">
        {visibleItems.length === 0 && (
          <p className="py-10 text-center text-sm" style={{ color: "var(--hint)" }}>
            {items.length === 0
              ? "Пока нет запланированных статей. Нажмите +, чтобы добавить регулярные расходы или доходы."
              : "Нет статей в этой категории."}
          </p>
        )}

        {kinds.map((sec) => {
          const secItems = visibleItems.filter((it) => (it.category?.kind ?? "expense") === sec.kind);
          if (secItems.length === 0) return null;
          const secTotal = secItems.reduce((s, it) => s + it.amount, 0);
          // Categories of this kind that have visible items, in category order.
          const cats = categories.filter(
            (c) => c.kind === sec.kind && secItems.some((it) => it.categoryId === c.id),
          );
          return (
            <div key={sec.kind} className="flex flex-col gap-3">
              <div className="flex items-baseline justify-between px-1">
                <p className="text-xs font-semibold uppercase" style={{ color: "var(--hint)" }}>{sec.label}</p>
                <p className="text-xs font-semibold" style={{ color: sec.kind === "income" ? "#10b981" : "var(--text)" }}>
                  {formatCents(secTotal)} / мес
                </p>
              </div>

              {cats.map((cat) => {
                const catItems = secItems
                  .filter((it) => it.categoryId === cat.id)
                  .sort((a, b) => a.dayOfMonth - b.dayOfMonth || a.name.localeCompare(b.name));
                const catTotal = catItems.reduce((s, it) => s + it.amount, 0);
                return (
                  <div key={cat.id} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between px-1">
                      <p className="truncate text-sm font-semibold">
                        <span className="mr-1.5">{avatarGlyph(cat.name)}</span>
                        {displayName(cat.name)}
                      </p>
                      <p className="shrink-0 text-xs" style={{ color: "var(--hint)" }}>{formatCents(catTotal)}</p>
                    </div>
                    {catItems.map((it) => (
                      <button
                        key={it.id}
                        onClick={() => setEdit(it)}
                        className="flex items-center justify-between gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]"
                        style={{ background: "var(--card)", borderColor: "var(--border)" }}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{it.name}</p>
                          <p className="text-xs" style={{ color: "var(--hint)" }}>число {it.dayOfMonth}</p>
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
          );
        })}
      </div>

      <button
        onClick={() => setCreating(true)}
        className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition active:scale-90"
        style={{ background: "var(--button)" }}
        aria-label="Новая статья"
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
