"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Sheet } from "@/components/Sheet";
import { apiFetch, haptic } from "@/lib/client";
import { parseAmount, CURRENCY_SYMBOL } from "@/lib/money";
import { avatarGlyph } from "@/lib/avatar";
import type { Category, Kind, Transaction } from "@/lib/types";

function todayLocal(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}

// Add or edit a transaction. `edit` pre-fills the form and switches to PATCH.
export function AddSheet({
  categories,
  edit,
  onClose,
  onSaved,
}: {
  categories: Category[];
  edit?: Transaction;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [kind, setKind] = useState<Kind>(edit?.kind ?? "expense");
  const [amount, setAmount] = useState(edit ? (edit.amount / 100).toString() : "");
  const [categoryId, setCategoryId] = useState<string | null>(edit?.categoryId ?? null);
  const [note, setNote] = useState(edit?.note ?? "");
  const [date, setDate] = useState(edit ? edit.occurredAt.slice(0, 10) : todayLocal());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    if (!edit || deleting) return;
    if (!confirm("Удалить операцию?")) return;
    setDeleting(true);
    haptic();
    const res = await apiFetch(`/api/transactions/${edit.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) onSaved();
  }

  const cents = parseAmount(amount);
  const valid = cents !== null;
  const visible = categories.filter((c) => c.kind === kind);

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    haptic();
    const payload = {
      kind,
      amount: cents,
      categoryId,
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
    <Sheet title={edit ? "Изменить" : "Добавить"} onClose={onClose}>
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
              {k === "expense" ? "Расход" : "Доход"}
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

        {/* categories — single horizontal-scroll row of emoji glyphs so the
            sheet height stays constant regardless of how many categories exist */}
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

        {/* note + date */}
        <input
          placeholder="Комментарий (необязательно)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="rounded-xl border px-3 py-2.5 text-sm outline-none"
          style={{ background: "var(--card)", borderColor: "var(--field-border)", color: "var(--text)" }}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-xl border px-3 py-2.5 text-sm outline-none"
          style={{ background: "var(--card)", borderColor: "var(--field-border)", color: "var(--text)" }}
        />

        <button
          onClick={save}
          disabled={!valid || saving}
          className="flex items-center justify-center gap-2 rounded-xl py-3 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
          style={{ background: "var(--button)" }}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : edit ? "Сохранить" : "Добавить"}
        </button>

        {edit && (
          <button
            onClick={remove}
            disabled={deleting}
            className="text-sm font-medium text-red-500 transition active:scale-95 disabled:opacity-40"
          >
            {deleting ? "Удаление…" : "Удалить"}
          </button>
        )}
      </div>
    </Sheet>
  );
}
