"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Sheet } from "@/components/Sheet";
import { apiFetch, haptic } from "@/lib/client";
import { parseAmount, CURRENCY_SYMBOL } from "@/lib/money";
import { iconFor } from "@/lib/icons";
import type { Category, Kind, PlannedItem } from "@/lib/types";

// Add or edit a recurring planned item.
export function PlannedSheet({
  categories,
  edit,
  onClose,
  onSaved,
}: {
  categories: Category[];
  edit?: PlannedItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(edit?.name ?? "");
  const [kind, setKind] = useState<Kind>(edit?.kind ?? "expense");
  const [amount, setAmount] = useState(edit ? (edit.amount / 100).toString() : "");
  const [day, setDay] = useState(edit?.dayOfMonth?.toString() ?? "1");
  const [categoryId, setCategoryId] = useState<string | null>(edit?.categoryId ?? null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const cents = parseAmount(amount);
  const dayNum = parseInt(day, 10);
  const valid = !!name.trim() && cents !== null && dayNum >= 1 && dayNum <= 31;
  const visible = categories.filter((c) => c.kind === kind);

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    haptic();
    const res = await apiFetch(edit ? `/api/planned/${edit.id}` : "/api/planned", {
      method: edit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, kind, amount: cents, dayOfMonth: dayNum, categoryId }),
    });
    setSaving(false);
    if (res.ok) onSaved();
  }

  async function remove() {
    if (!edit || deleting) return;
    if (!confirm(`Delete planned "${edit.name}"?`)) return;
    setDeleting(true);
    haptic();
    const res = await apiFetch(`/api/planned/${edit.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) onSaved();
  }

  return (
    <Sheet title={edit ? "Edit planned" : "New planned"} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <input
          autoFocus={!edit}
          placeholder="Name (e.g. Rent, Salary)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl border px-3 py-2.5 text-sm outline-none"
          style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}
        />

        <div className="grid grid-cols-2 gap-2 rounded-xl p-1" style={{ background: "var(--bg)" }}>
          {(["expense", "income"] as Kind[]).map((k) => (
            <button
              key={k}
              onClick={() => {
                setKind(k);
                setCategoryId(null);
              }}
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

        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className="text-xs" style={{ color: "var(--hint)" }}>Estimated amount</span>
            <div
              className="flex items-center gap-1 rounded-xl border px-3 py-2.5"
              style={{ background: "var(--card)", borderColor: "var(--border)" }}
            >
              <span style={{ color: "var(--hint)" }}>{CURRENCY_SYMBOL}</span>
              <input
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </label>
          <label className="flex w-28 flex-col gap-1">
            <span className="text-xs" style={{ color: "var(--hint)" }}>Day of month</span>
            <input
              inputMode="numeric"
              value={day}
              onChange={(e) => setDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
              className="rounded-xl border px-3 py-2.5 text-sm outline-none"
              style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </label>
        </div>

        {/* category (optional) */}
        <div className="grid grid-cols-4 gap-2">
          {visible.map((c) => {
            const Icon = iconFor(c.icon);
            const active = categoryId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategoryId(active ? null : c.id)}
                className="flex flex-col items-center gap-1 rounded-xl border p-2 transition active:scale-95"
                style={{
                  borderColor: active ? c.color : "var(--border)",
                  background: active ? c.color + "22" : "var(--card)",
                }}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: c.color + "22", color: c.color }}
                >
                  <Icon size={16} />
                </span>
                <span className="w-full truncate text-[11px]" style={{ color: "var(--text)" }}>
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={save}
          disabled={!valid || saving}
          className="flex items-center justify-center gap-2 rounded-xl py-3 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
          style={{ background: "var(--button)" }}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : "Save"}
        </button>

        {edit && (
          <button
            onClick={remove}
            disabled={deleting}
            className="text-sm font-medium text-red-500 transition active:scale-95 disabled:opacity-40"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>
    </Sheet>
  );
}
