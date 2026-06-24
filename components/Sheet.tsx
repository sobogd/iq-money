"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

// Bottom-sheet modal: backdrop + slide-up panel. Closes on backdrop tap / Esc.
export function Sheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="relative max-h-[90dvh] overflow-y-auto rounded-t-3xl p-5 pb-8 shadow-2xl"
        style={{ background: "var(--accent)", color: "var(--text)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 transition active:scale-90"
            style={{ color: "var(--hint)" }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
