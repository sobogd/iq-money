"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Sheet } from "@/components/Sheet";
import { apiFetch, haptic } from "@/lib/client";
import { parseAmount, CURRENCY_SYMBOL } from "@/lib/money";
import { iconFor } from "@/lib/icons";
import type { Category, Kind, PlannedItem, Transaction } from "@/lib/types";

function todayLocal(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

// Add or edit a transaction. `edit` pre-fills the form and switches to PATCH.
export function AddSheet({
  categories,
  planned = [],
  edit,
  onClose,
  onSaved,
}: {
  categories: Category[];
  planned?: PlannedItem[];
  edit?: Transaction;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [kind, setKind] = useState<Kind>(edit?.kind ?? "expense");
  const [amount, setAmount] = useState(edit ? (edit.amount / 100).toString() : "");
  const [categoryId, setCategoryId] = useState<string | null>(edit?.categoryId ?? null);
  const [plannedItemId, setPlannedItemId] = useState<string | null>(edit?.plannedItemId ?? null);
  const [note, setNote] = useState(edit?.note ?? "");
  const [date, setDate] = useState(edit ? edit.occurredAt.slice(0, 10) : todayLocal());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!edit || deleting) return;
    if (!confirm("Delete this transaction?")) return;
    setDeleting(true);
    haptic();
    const res = await apiFetch(`/api/transactions/${edit.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) onSaved();
  }

  const cents = parseAmount(amount);
  const valid = cents !== null;
  const visible = categories.filter((c) => c.kind === kind);
  const plannedOfKind = planned.filter((p) => p.kind === kind);

  // Linking a real tx to a planned item: prefill amount (estimate) + category
  // when they're still empty, so confirming a known charge is one tap.
  function linkPlanned(p: PlannedItem) {
    if (plannedItemId === p.id) {
      setPlannedItemId(null);
      return;
    }
    setPlannedItemId(p.id);
    if (!amount) setAmount((p.amount / 100).toString());
    if (!categoryId && p.categoryId) setCategoryId(p.categoryId);
  }

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    haptic();
    const payload = {
      kind,
      amount: cents,
      categoryId,
      plannedItemId,
      note,
      occurredAt: new Date(date + "T12:00:00").toISOString(),
    };
    const res = await apiFetch(
      edit ? `/api/transactions/${edit.id}` : "/api/transactions",
      {
        method: edit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    setSaving(false);
    if (res.ok) onSaved();
  }

  return (
    <Sheet title={edit ? "Edit" : "Add"} onClose={onClose}>
      <div className="flex flex-col gap-5">
        {/* expense / income toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-xl p-1" style={{ background: "var(--bg)" }}>
          {(["expense", "income"] as Kind[]).map((k) => (
            <button
              key={k}
              onClick={() => {
                setKind(k);
                setCategoryId(null);
                setPlannedItemId(null);
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

        {/* amount */}
        <div className="flex items-center justify-center gap-2 py-2">
          <span className="text-3xl font-light" style={{ color: "var(--hint)" }}>
            {CURRENCY_SYMBOL}
          </span>
          <input
            autoFocus={!edit}
            inputMode="decimal"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-40 bg-transparent text-center text-4xl font-bold outline-none"
          />
        </div>

        {/* categories grid */}
        <div className="grid grid-cols-4 gap-2">
          {visible.map((c) => {
            const Icon = iconFor(c.icon);
            const active = categoryId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategoryId(active ? null : c.id)}
                className="flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition active:scale-95"
                style={{
                  borderColor: active ? c.color : "var(--border)",
                  background: active ? c.color + "22" : "var(--card)",
                }}
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-full"
                  style={{ background: c.color + "22", color: c.color }}
                >
                  <Icon size={18} />
                </span>
                <span className="w-full truncate text-[11px]" style={{ color: "var(--text)" }}>
                  {c.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* link to a planned item (optional) */}
        {plannedOfKind.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium" style={{ color: "var(--hint)" }}>
              Planned item (optional)
            </p>
            <div className="flex flex-wrap gap-2">
              {plannedOfKind.map((p) => {
                const active = plannedItemId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => linkPlanned(p)}
                    className="rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-95"
                    style={{
                      borderColor: active ? "var(--button)" : "var(--border)",
                      background: active ? "var(--button)" : "var(--card)",
                      color: active ? "#fff" : "var(--text)",
                    }}
                  >
                    {p.name} · ~{(p.amount / 100).toFixed(0)}€
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* note + date */}
        <input
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-xl border px-3 py-2.5 text-sm outline-none"
          style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border px-3 py-2.5 text-sm outline-none"
          style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}
        />

        <button
          onClick={save}
          disabled={!valid || saving}
          className="flex items-center justify-center gap-2 rounded-xl py-3 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
          style={{ background: "var(--button)" }}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : edit ? "Save" : "Add"}
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
