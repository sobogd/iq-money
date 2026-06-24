"use client";

import { useState } from "react";
import { Plus, Trash2, Check } from "lucide-react";
import { Sheet } from "@/components/Sheet";
import { apiFetch, haptic } from "@/lib/client";
import { iconFor, ICON_NAMES, COLORS } from "@/lib/icons";
import type { Category, Kind } from "@/lib/types";

// Manage categories: list, add, edit (inline), delete (archive).
export function CategoriesSheet({
  categories,
  onClose,
  onChanged,
}: {
  categories: Category[];
  onClose: () => void;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<Category | "new" | null>(null);

  if (editing) {
    return (
      <CategoryForm
        initial={editing === "new" ? null : editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          onChanged();
        }}
      />
    );
  }

  async function remove(c: Category) {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    haptic();
    const res = await apiFetch(`/api/categories/${c.id}`, { method: "DELETE" });
    if (res.ok) onChanged();
  }

  const groups: { label: string; kind: Kind }[] = [
    { label: "Expense", kind: "expense" },
    { label: "Income", kind: "income" },
  ];

  return (
    <Sheet title="Categories" onClose={onClose}>
      <div className="flex flex-col gap-5">
        {groups.map((g) => (
          <div key={g.kind} className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase" style={{ color: "var(--hint)" }}>
              {g.label}
            </p>
            {categories
              .filter((c) => c.kind === g.kind)
              .map((c) => {
                const Icon = iconFor(c.icon);
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 rounded-xl border p-2.5"
                    style={{ background: "var(--card)", borderColor: "var(--border)" }}
                  >
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full"
                      style={{ background: c.color + "22", color: c.color }}
                    >
                      <Icon size={16} />
                    </span>
                    <button
                      onClick={() => setEditing(c)}
                      className="flex-1 text-left text-sm font-medium"
                    >
                      {c.name}
                    </button>
                    <button
                      onClick={() => remove(c)}
                      className="rounded-full p-1.5 text-red-500 transition active:scale-90"
                      aria-label="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
          </div>
        ))}

        <button
          onClick={() => setEditing("new")}
          className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition active:scale-[0.98]"
          style={{ background: "var(--button)" }}
        >
          <Plus size={16} /> New category
        </button>
      </div>
    </Sheet>
  );
}

function CategoryForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: Category | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [kind, setKind] = useState<Kind>(initial?.kind ?? "expense");
  const [icon, setIcon] = useState(initial?.icon ?? "circle");
  const [color, setColor] = useState(initial?.color ?? COLORS[0]);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!name.trim() || saving) return;
    setSaving(true);
    haptic();
    const res = await apiFetch(
      initial ? `/api/categories/${initial.id}` : "/api/categories",
      {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, kind, icon, color }),
      },
    );
    setSaving(false);
    if (res.ok) onSaved();
  }

  return (
    <Sheet title={initial ? "Edit category" : "New category"} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <input
          autoFocus
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl border px-3 py-2.5 text-sm outline-none"
          style={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--text)" }}
        />

        <div className="grid grid-cols-2 gap-2 rounded-xl p-1" style={{ background: "var(--bg)" }}>
          {(["expense", "income"] as Kind[]).map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className="rounded-lg py-2 text-sm font-medium transition"
              style={kind === k ? { background: "var(--button)", color: "#fff" } : { color: "var(--hint)" }}
            >
              {k === "expense" ? "Expense" : "Income"}
            </button>
          ))}
        </div>

        {/* icon picker */}
        <div className="grid grid-cols-6 gap-2">
          {ICON_NAMES.map((n) => {
            const Icon = iconFor(n);
            const active = icon === n;
            return (
              <button
                key={n}
                onClick={() => setIcon(n)}
                className="flex aspect-square items-center justify-center rounded-xl border transition active:scale-90"
                style={{
                  borderColor: active ? color : "var(--border)",
                  background: active ? color + "22" : "var(--card)",
                  color: active ? color : "var(--hint)",
                }}
              >
                <Icon size={18} />
              </button>
            );
          })}
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

        <button
          onClick={save}
          disabled={!name.trim() || saving}
          className="rounded-xl py-3 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
          style={{ background: "var(--button)" }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </Sheet>
  );
}
