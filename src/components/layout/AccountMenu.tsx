"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  ChevronDown,
  ClipboardList,
  LogOut,
  MessageCircle,
  Settings,
  Smartphone,
  UserRound,
} from "lucide-react";

import { useTranslations } from "@/i18n/client";
import type { SessionUser } from "@/lib/api/types";

export default function AccountMenu({
  user,
  sellHref,
}: {
  user: SessionUser | null;
  sellHref: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setOpen(false);
    startTransition(() => {
      router.refresh();
    });
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={sellHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg px-3 py-2 text-sm font-semibold text-white/90 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
        >
          {t("nav.iAmDistributor")}
        </a>
        <Link
          href="/login"
          className="rounded-lg px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
        >
          {t("nav.login")}
        </Link>
        <Link
          href="/register"
          className="rounded-lg bg-white px-3 py-2 text-sm font-bold text-laku-blue transition-colors hover:bg-white/90"
        >
          {t("nav.register")}
        </Link>
      </div>
    );
  }

  const firstName = user.name?.split(" ")[0] || t("nav.accountFallback");

  const items = [
    { href: "/account/profile", icon: UserRound, label: t("nav.profile") },
    { href: "/orders", icon: ClipboardList, label: t("nav.myOrders") },
    { href: "/messages", icon: MessageCircle, label: t("messages.title") },
    { href: "/settings", icon: Settings, label: t("nav.settings") },
    { href: "/app", icon: Smartphone, label: t("nav.openInApp") },
  ];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
      >
        <UserRound className="size-4" aria-hidden />
        <span className="max-w-24 truncate">{firstName}</span>
        <ChevronDown className="size-4" aria-hidden />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-laku-line bg-white shadow-lg"
        >
          <Link
            href="/account"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block border-b border-laku-line px-4 py-3 transition-colors hover:bg-laku-blue/5"
          >
            <p className="truncate text-sm font-semibold text-laku-ink">{user.name}</p>
            <p className="truncate text-xs text-laku-muted">{user.email}</p>
          </Link>

          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-3 text-sm text-laku-ink transition-colors hover:bg-laku-blue/5"
            >
              <item.icon className="size-4 text-laku-muted" aria-hidden />
              {item.label}
            </Link>
          ))}

          <a
            href={sellHref}
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-sm text-laku-ink transition-colors hover:bg-laku-blue/5 lg:hidden"
          >
            {t("home.distributorCta.action")}
          </a>

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            disabled={isPending}
            className="flex w-full items-center gap-2 border-t border-laku-line px-4 py-3 text-sm text-laku-ink transition-colors hover:bg-laku-blue/5 disabled:opacity-60"
          >
            <LogOut className="size-4 text-laku-muted" aria-hidden />
            {t("nav.logout")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
