"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Loader2, Lock, Filter, Check } from "lucide-react";
import { PlannedItemEditor } from "@/components/PlannedItemEditor";
import { apiFetch, initTelegram, telegramUserId } from "@/lib/client";
import { formatCents } from "@/lib/money";
import { avatarGlyph, displayName } from "@/lib/avatar";
import type { Category, PlannedItem } from "@/lib/types";

export default function Planned() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<PlannedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [edit, setEdit] = useState<PlannedItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<string>("all"); // categoryId | "all"
  const [filterOpen, setFilterOpen] = useState(false);

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

  const activeCat = filter === "all" ? null : categories.find((c) => c.id === filter);

  return (
    <main className="flex flex-1 flex-col overflow-y-auto" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* sticky header (styled like the tab bar) */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b px-4 py-3"
        style={{ background: "var(--accent)", borderColor: "var(--border)" }}
      >
        <h1 className="truncate text-xl font-bold tracking-tight">Запланировано</h1>

        {/* filter — icon button + dropdown */}
        <div className="relative shrink-0">
          <button
            onClick={() => setFilterOpen((o) => !o)}
            className="flex h-9 w-9 items-center justify-center transition active:scale-90"
            style={{ color: activeCat ? "var(--button)" : "var(--hint)" }}
            aria-label="Фильтр по категории"
          >
            <Filter size={20} />
          </button>

          {filterOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} aria-hidden />
              <div
                className="absolute right-0 top-full z-50 mt-2 max-h-[60vh] w-60 overflow-y-auto rounded-xl border p-1 shadow-xl"
                style={{ background: "var(--card)", borderColor: "var(--field-border)" }}
              >
                <FilterRow
                  label="Все категории"
                  active={filter === "all"}
                  onClick={() => {
                    setFilter("all");
                    setFilterOpen(false);
                  }}
                />
                {categories.map((c) => (
                  <FilterRow
                    key={c.id}
                    label={`${avatarGlyph(c.name)} ${displayName(c.name)}`}
                    active={filter === c.id}
                    onClick={() => {
                      setFilter(c.id);
                      setFilterOpen(false);
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 pt-5 pb-6">
        {visibleItems.length === 0 && (
          <p className="py-10 text-center text-sm" style={{ color: "var(--hint)" }}>
            {items.length === 0
              ? "Пока нет запланированных статей. Нажмите +, чтобы добавить регулярные расходы или доходы."
              : "Нет статей в этой категории."}
          </p>
        )}

        {categories
          .filter((cat) => visibleItems.some((it) => it.categoryId === cat.id))
          .map((cat) => {
            const catItems = visibleItems
              .filter((it) => it.categoryId === cat.id)
              .sort((a, b) => a.dayOfMonth - b.dayOfMonth || a.name.localeCompare(b.name));
            const catTotal = catItems.reduce((s, it) => s + it.amount, 0);
            const isIncome = cat.kind === "income";
            return (
              <div key={cat.id} className="flex flex-col gap-2">
                {/* category header — same style as a section label */}
                <div className="flex items-baseline justify-between px-1">
                  <p className="truncate text-xs font-semibold uppercase" style={{ color: "var(--hint)" }}>
                    {displayName(cat.name)}
                  </p>
                  <p className="shrink-0 text-xs font-semibold" style={{ color: isIncome ? "#10b981" : "var(--text)" }}>
                    {formatCents(catTotal)} / мес
                  </p>
                </div>

                {catItems.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => setEdit(it)}
                    className="flex items-center gap-3 rounded-2xl border p-3 text-left transition active:scale-[0.99]"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                  >
                    <span className="w-6 shrink-0 text-center text-xl">{avatarGlyph(cat.name)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{it.name}</p>
                      <p className="truncate text-xs" style={{ color: "var(--hint)" }}>
                        {displayName(cat.name)} · число {it.dayOfMonth}
                      </p>
                    </div>
                    <span className="shrink-0 font-semibold" style={{ color: isIncome ? "#10b981" : "var(--text)" }}>
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

function FilterRow({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition active:scale-[0.98]"
      style={active ? { background: "var(--button)", color: "#fff" } : { color: "var(--text)" }}
    >
      <span className="truncate">{label}</span>
      {active && <Check size={15} className="shrink-0" />}
    </button>
  );
}
