"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Sheet } from "@/components/Sheet";
import { apiFetch, haptic } from "@/lib/client";
import type { Category, Kind } from "@/lib/types";

// Category editor: name (emoji prefix becomes the glyph) and kind. The monthly
// budget is the sum of the category's planned items, managed in the Planned
// tab — not here.
export function CategoryEditor({
  category,
  onClose,
  onSaved,
}: {
  category?: Category;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [kind, setKind] = useState<Kind>(category?.kind ?? "expense");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const valid = !!name.trim();

  async function save() {
    if (!valid || saving) return;
    setSaving(true);
    haptic();

    const catBody = { name: name.trim(), kind };
    if (category?.id) {
      await apiFetch(`/api/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catBody),
      });
    } else {
      await apiFetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(catBody),
      });
    }

    setSaving(false);
    onSaved();
  }

  async function remove() {
    if (!category || deleting) return;
    if (!confirm(`Удалить категорию «${category.name}»?`)) return;
    setDeleting(true);
    haptic();
    const res = await apiFetch(`/api/categories/${category.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) onSaved();
  }

  return (
    <Sheet title={category ? "Изменить категорию" : "Новая категория"} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <input
          autoFocus={!category}
          placeholder="Название (начните с emoji, напр. 🍔 Еда)"
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
              {k === "expense" ? "Расход" : "Доход"}
            </button>
          ))}
        </div>

        <button
          onClick={save}
          disabled={!valid || saving}
          className="flex items-center justify-center gap-2 rounded-xl py-3 text-base font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
          style={{ background: "var(--button)" }}
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : "Сохранить"}
        </button>

        {category && (
          <button
            onClick={remove}
            disabled={deleting}
            className="text-sm font-medium text-red-500 transition active:scale-95 disabled:opacity-40"
          >
            {deleting ? "Удаление…" : "Удалить категорию"}
          </button>
        )}
      </div>
    </Sheet>
  );
}
