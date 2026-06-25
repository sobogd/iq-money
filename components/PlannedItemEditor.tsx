"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Sheet } from "@/components/Sheet";
import { apiFetch, haptic } from "@/lib/client";
import { parseAmount, CURRENCY_SYMBOL } from "@/lib/money";
import { avatarGlyph } from "@/lib/avatar";
import type { Category, Kind, PlannedItem } from "@/lib/types";

// Add or edit a planned monthly item (name + amount + day) attached to a
// category. `edit` pre-fills the form and switches to PATCH.
export function PlannedItemEditor({
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
  const editCat = edit ? categories.find((c) => c.id === edit.categoryId) : undefined;
  const [kind, setKind] = useState<Kind>(editCat?.kind ?? "expense");
  const [categoryId, setCategoryId] = useState<string | null>(edit?.categoryId ?? null);
  const [name, setName] = useState(edit?.name ?? "");
  const [amount, setAmount] = useState(edit ? (edit.amount / 100).toString() : "");
  const [day, setDay] = useState(edit?.dayOfMonth?.toString() ?? "1");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const cents = parseAmount(amount);
  const dayNum = parseInt(day, 10) || 1;
  const valid = !!name.trim() && cents !== null && !!categoryId && dayNum >= 1 && dayNum <= 31;
  const visible = categories.filter((c) => c.kind === kind);

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    haptic();
    const payload = { categoryId, name: name.trim(), amount: cents, dayOfMonth: dayNum };
    const res = await apiFetch(
      edit ? `/api/planned-items/${edit.id}` : "/api/planned-items",
      {
        method: edit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    setSaving(false);
    if (res.ok) onSaved();
  }

  async function remove() {
    if (!edit || deleting) return;
    if (!confirm(`Delete "${edit.name}"?`)) return;
    setDeleting(true);
    haptic();
    const res = await apiFetch(`/api/planned-items/${edit.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) onSaved();
  }

  return (
    <Sheet title={edit ? "Edit planned item" : "New planned item"} onClose={onClose}>
      <div className="flex flex-col gap-5">
        {/* expense / income toggle */}
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

        {/* category picker — emoji glyphs */}
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {visible.map((c) => {
            const active = categoryId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategoryId(active ? null : c.id)}
                title={c.name}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-2xl transition active:scale-90"
                style={{
                  borderColor: active ? c.color : "var(--border)",
                  background: active ? c.color + "22" : "var(--card)",
                  color: active ? c.color : "var(--text)",
                }}
              >
                {avatarGlyph(c.name)}
              </button>
            );
          })}
        </div>

        {/* name */}
        <input
          autoFocus={!edit}
          placeholder="Name (e.g. Rent, Utilities)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl border px-3 py-2.5 text-sm outline-none"
          style={{ background: "var(--card)", borderColor: "var(--field-border)", color: "var(--text)" }}
        />

        {/* amount + day */}
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
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </label>
          <label className="flex w-28 flex-col gap-1">
            <span className="text-xs" style={{ color: "var(--hint)" }}>
              {kind === "income" ? "Arrival day" : "Charge day"}
            </span>
            <input
              inputMode="numeric"
              value={day}
              onChange={(e) => setDay(e.target.value.replace(/\D/g, "").slice(0, 2))}
              className="rounded-xl border px-3 py-2.5 text-sm outline-none"
              style={{ background: "var(--card)", borderColor: "var(--field-border)", color: "var(--text)" }}
            />
          </label>
        </div>

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
