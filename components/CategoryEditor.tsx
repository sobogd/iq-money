"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { Sheet } from "@/components/Sheet";
import { apiFetch, haptic } from "@/lib/client";
import { parseAmount, CURRENCY_SYMBOL } from "@/lib/money";
import { COLORS } from "@/lib/icons";
import type { Category, CategoryPlan, Kind } from "@/lib/types";

// Unified category editor: name (emoji prefix becomes the glyph), kind, color
// AND the monthly plan (amount + income arrival day) — all in one place.
export function CategoryEditor({
  category,
  plan,
  onClose,
  onSaved,
}: {
  category?: Category;
  plan?: CategoryPlan;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [kind, setKind] = useState<Kind>(category?.kind ?? "expense");
  const [color, setColor] = useState(category?.color ?? COLORS[0]);
  const [amount, setAmount] = useState(plan ? (plan.amount / 100).toString() : "");
  const [day, setDay] = useState(plan?.dayOfMonth?.toString() ?? "1");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const planCents = parseAmount(amount); // null when empty/invalid → plan cleared
  const dayNum = parseInt(day, 10) || 1;
  const isIncome = kind === "income";
  const valid = !!name.trim() && (!isIncome || (dayNum >= 1 && dayNum <= 31));

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    haptic();

    // 1) upsert the category itself
    let categoryId = category?.id;
    const catBody = { name: name.trim(), kind, color };
    if (categoryId) {
      await apiFetch(`/api/categories/${categoryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catBody),
      });
    } else {
      const res = await apiFetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catBody),
      });
      if (res.ok) categoryId = (await res.json()).id;
    }

    // 2) upsert / clear its monthly plan (amount<=0 clears)
    if (categoryId) {
      await apiFetch("/api/category-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId,
          amount: planCents ?? 0,
          dayOfMonth: isIncome ? dayNum : 1,
        }),
      });
    }

    setSaving(false);
    onSaved();
  }

  async function remove() {
    if (!category || deleting) return;
    if (!confirm(`Delete category "${category.name}"?`)) return;
    setDeleting(true);
    haptic();
    const res = await apiFetch(`/api/categories/${category.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) onSaved();
  }

  return (
    <Sheet title={category ? "Edit category" : "New category"} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <input
          autoFocus={!category}
          placeholder="Name (start with an emoji, e.g. 🍔 Food)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl border px-3 py-2.5 text-sm outline-none"
          style={{ background: "var(--card)", borderColor: "var(--field-border)", color: "var(--text)" }}
        />

        <div className="grid grid-cols-2 gap-2 rounded-xl p-1" style={{ background: "var(--bg)" }}>
          {(["expense", "income"] as Kind[]).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className="rounded-lg py-2 text-sm font-medium transition"
              style={
                kind === k
                  ? { background: k === "income" ? "#10b981" : "#ef4444", color: "#fff" }
                  : { color: "var(--hint)" }
              }
            >
              {k === "expense" ? "Expense" : "Income"}
            </button>
          ))}
        </div>

        {/* color picker */}
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="flex h-8 w-8 items-center justify-center rounded-full transition active:scale-90"
              style={{ background: c }}
              aria-label={c}
            >
              {color === c && <Check size={15} className="text-white" />}
            </button>
          ))}
        </div>

        {/* monthly plan */}
        <div className="mt-1 flex flex-col gap-3 rounded-xl border p-3" style={{ borderColor: "var(--field-border)" }}>
          <p className="text-xs font-semibold uppercase" style={{ color: "var(--hint)" }}>
            Monthly plan
          </p>
          <div className="flex gap-3">
            <label className="flex flex-1 flex-col gap-1">
              <span className="text-xs" style={{ color: "var(--hint)" }}>Amount / month</span>
              <div
                className="flex items-center gap-1 rounded-xl border px-3 py-2.5"
                style={{ background: "var(--card)", borderColor: "var(--field-border)" }}
              >
                <span style={{ color: "var(--hint)" }}>{CURRENCY_SYMBOL}</span>
                <input
                  inputMode="decimal"
                  placeholder="0 = no plan"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </label>
            {isIncome && (
              <label className="flex w-28 flex-col gap-1">
                <span className="text-xs" style={{ color: "var(--hint)" }}>Arrival day</span>
                <input
                  inputMode="numeric"
                  value={day}
                  onChange={(e) => setDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
                  className="rounded-xl border px-3 py-2.5 text-sm outline-none"
                  style={{ background: "var(--card)", borderColor: "var(--field-border)", color: "var(--text)" }}
                />
              </label>
            )}
          </div>
          {isIncome && (
            <span className="text-[11px]" style={{ color: "var(--hint)" }}>
              Before this day the planned income still counts this month; on/after
              it the real income is used.
            </span>
          )}
        </div>

        <button
          onClick={save}
          disabled={!valid || saving}
          className="flex items-center justify-center gap-2 rounded-xl py-3 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
          style={{ background: "var(--button)" }}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : "Save"}
        </button>

        {category && (
          <button
            onClick={remove}
            disabled={deleting}
            className="text-sm font-medium text-red-500 transition active:scale-95 disabled:opacity-40"
          >
            {deleting ? "Deleting…" : "Delete category"}
          </button>
        )}
      </div>
    </Sheet>
  );
}
