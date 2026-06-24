"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, CalendarClock, Tags } from "lucide-react";

const TABS = [
  { href: "/", label: "Ledger", Icon: Wallet },
  { href: "/plan", label: "Plan", Icon: CalendarClock },
  { href: "/categories", label: "Categories", Icon: Tags },
];

// Bottom navigation: real ledger, forecast, and category management.
export function TabBar() {
  const path = usePathname();
  return (
    <nav
      className="z-30 flex shrink-0 border-t pb-[env(safe-area-inset-bottom)]"
      style={{
        background: "var(--accent)",
        borderColor: "color-mix(in srgb, var(--border) 35%, transparent)",
      }}
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
