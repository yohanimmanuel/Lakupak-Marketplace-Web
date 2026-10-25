"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ClipboardList,
  Home,
  ShoppingCart,
  UserRound,
} from "lucide-react";

import { useTranslations } from "@/i18n/client";

const TABS = [
  { href: "/", labelKey: "nav.home", icon: Home },
  { href: "/cart", labelKey: "nav.cart", icon: ShoppingCart, badgeKey: "cart" as const },
  { href: "/orders", labelKey: "nav.orders", icon: ClipboardList },
  { href: "/notifications", labelKey: "nav.notifications", icon: Bell },
  { href: "/account", labelKey: "nav.account", icon: UserRound },
];

/** Mirrors the app's bottom tab bar; desktop uses the header nav instead. */
export default function MobileTabBar({ cartCount = 0 }: { cartCount?: number }) {
  const t = useTranslations();
  const pathname = usePathname();
  const badge = cartCount > 99 ? "99+" : cartCount > 0 ? String(cartCount) : null;

  return (
    <nav
      aria-label={t("header.mainNavAria")}
      className="fixed inset-x-0 bottom-0 z-40 border-t border-laku-line bg-white sm:hidden"
    >
      <ul className="flex">
        {TABS.map((tab) => {
          const isActive =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const showBadge = tab.badgeKey === "cart" ? badge : null;

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex flex-col items-center gap-1 px-0.5 py-2.5 text-[10px] transition-colors ${
                  isActive ? "font-semibold text-laku-blue" : "text-laku-faint"
                }`}
              >
                <span className="relative">
                  <tab.icon className="size-5" aria-hidden />
                  {showBadge ? (
                    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-laku-alert px-1 text-[9px] font-bold text-white">
                      {showBadge}
                    </span>
                  ) : null}
                </span>
                {t(tab.labelKey)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
