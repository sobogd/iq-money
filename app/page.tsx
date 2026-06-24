"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, Wallet } from "lucide-react";
import { apiFetch, initTelegram, telegramUserId } from "@/lib/client";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    initTelegram();
    (async () => {
      try {
        const res = await apiFetch("/api/me");
        if (res.status === 403) setForbidden(true);
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <main
        className="flex min-h-[100dvh] items-center justify-center"
        style={{ background: "var(--bg)", color: "var(--hint)" }}
      >
        <Loader2 size={22} className="animate-spin" />
      </main>
    );
  }

  if (forbidden) {
    const id = telegramUserId();
    return (
      <main
        className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center"
        style={{ background: "var(--bg)", color: "var(--text)" }}
      >
        <Lock size={30} className="text-emerald-500" />
        <p className="text-base font-medium">Доступ ограничен</p>
        <p className="max-w-xs text-sm" style={{ color: "var(--hint)" }}>
          Приложение пока доступно только избранным. Отправьте свой Telegram-ID
          администратору, чтобы получить доступ.
        </p>
        {id && (
          <div
            className="rounded-xl border px-4 py-2 font-mono text-sm"
            style={{ background: "var(--card)", borderColor: "var(--border)" }}
          >
            ID: {id}
          </div>
        )}
      </main>
    );
  }

  return (
    <main
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center"
      style={{ background: "var(--bg)", color: "var(--text)" }}
    >
      <Wallet size={30} className="text-emerald-500" />
      <h1 className="text-2xl font-bold tracking-tight">
        IQ <span className="text-emerald-500">Money</span>
      </h1>
      <p className="max-w-xs text-sm" style={{ color: "var(--hint)" }}>
        Пустой каркас. Функционал появится позже.
      </p>
    </main>
  );
}
