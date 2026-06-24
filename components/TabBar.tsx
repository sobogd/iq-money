"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, CalendarClock } from "lucide-react";

const TABS = [
  { href: "/", label: "Ledger", Icon: Wallet },
  { href: "/plan", label: "Plan", Icon: CalendarClock },
];

// Bottom navigation between the real ledger and the forecast/plan screen.
export function TabBar() {
  const path = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex border-t"
      style={{ background: "var(--accent)", borderColor: "var(--border)" }}
    >
      {TABS.map(({ href, label, Icon }) => {
        const active = path === href;
        return (
          <Link
            key={href}
            href={href}
            className="flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition"
            style={{ color: active ? "var(--button)" : "var(--hint)" }}
          >
            <Icon size={20} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
