"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Sheet } from "@/components/Sheet";
import { apiFetch, haptic } from "@/lib/client";
import { parseAmount, CURRENCY_SYMBOL } from "@/lib/money";
import { iconFor } from "@/lib/icons";
import type { Category, CategoryPlan } from "@/lib/types";

// Set / edit / clear the monthly plan for one category.
export function CategoryPlanSheet({
  category,
  plan,
  onClose,
  onSaved,
}: {
  category: Category;
  plan?: CategoryPlan;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isIncome = category.kind === "income";
  const [amount, setAmount] = useState(plan ? (plan.amount / 100).toString() : "");
  const [day, setDay] = useState(plan?.dayOfMonth?.toString() ?? "1");
  const [saving, setSaving] = useState(false);

  const cents = parseAmount(amount);
  const dayNum = parseInt(day, 10);
  const valid = cents !== null && (!isIncome || (dayNum >= 1 && dayNum <= 31));
  const Icon = iconFor(category.icon);

  async function submit(clear: boolean) {
    if (saving) return;
    if (!clear && !valid) return;
    setSaving(true);
    haptic();
    const res = await apiFetch("/api/category-plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId: category.id,
        amount: clear ? 0 : cents,
        dayOfMonth: isIncome ? dayNum : 1,
      }),
    });
    setSaving(false);
    if (res.ok) onSaved();
  }

  return (
    <Sheet title="Monthly plan" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: category.color + "22", color: category.color }}
          >
            <Icon size={18} />
          </span>
          <div>
            <p className="font-medium">{category.name}</p>
            <p className="text-xs" style={{ color: "var(--hint)" }}>
              {category.kind === "income" ? "Income" : "Expense"} · monthly
            </p>
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs" style={{ color: "var(--hint)" }}>Planned amount / month</span>
          <div
            className="flex items-center gap-1 rounded-xl border px-3 py-2.5"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            <span style={{ color: "var(--hint)" }}>{CURRENCY_SYMBOL}</span>
            <input
              autoFocus
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </label>

        {/* income arrival day — drives whether the current month still counts */}
        {isIncome && (
          <label className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: "var(--hint)" }}>
              Arrival day of month
            </span>
            <input
              inputMode="numeric"
              value={day}
              onChange={(e) => setDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
              className="w-28 rounded-xl border px-3 py-2.5 text-sm outline-none"
              style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}
            />
            <span className="text-[11px]" style={{ color: "var(--hint)" }}>
              Before this day the planned income still counts this month; on/after
              it the real income is used.
            </span>
          </label>
        )}

        <button
          onClick={() => submit(false)}
          disabled={!valid || saving}
          className="flex items-center justify-center gap-2 rounded-xl py-3 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
          style={{ background: "var(--button)" }}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : "Save plan"}
        </button>

        {plan && (
          <button
            onClick={() => submit(true)}
            disabled={saving}
            className="text-sm font-medium text-red-500 transition active:scale-95 disabled:opacity-40"
          >
            Clear plan
          </button>
        )}
      </div>
    </Sheet>
  );
}
