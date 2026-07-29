import Link from "next/link";
import { Suspense } from "react";
import {
  Bell,
  ClipboardList,
  MessageCircle,
  ShoppingCart,
  Smartphone,
} from "lucide-react";

import LakuLogo from "@/components/brand/LakuLogo";
import SearchBar from "@/components/search/SearchBar";
import { getTranslations } from "@/i18n/server";
import type { SessionUser } from "@/lib/api/types";
import { dashboardLandingUrl } from "@/lib/config";

import AccountMenu from "./AccountMenu";

type Props = {
  user: SessionUser | null;
  cartCount?: number;
};

export default async function SiteHeader({ user, cartCount = 0 }: Props) {
  const t = await getTranslations();
  const badge =
    cartCount > 99 ? "99+" : cartCount > 0 ? String(cartCount) : null;
  const sellHref = dashboardLandingUrl(t.locale);

  const utilityLinkClass =
    "inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-white/85 transition-colors hover:text-white";

  return (
    <header className="sticky top-0 z-40 bg-linear-to-b from-laku-blue-dark to-laku-blue">
      {/* Top utility row — Shopee / BarangKulakan style */}
      <div className="border-b border-white/15">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 md:px-6">
          <Link
            href="/app"
            className={utilityLinkClass}
            aria-label={t("header.downloadAppAria")}
          >
            <Smartphone className="size-3.5 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{t("header.downloadApp")}</span>
            <span className="sm:hidden">{t("header.downloadAppShort")}</span>
          </Link>

          <nav
            className="hidden items-center gap-4 md:flex lg:gap-5"
            aria-label={t("header.utilityNavAria")}
          >
            <Link href="/categories" className={utilityLinkClass}>
              {t("nav.categories")}
            </Link>
            <Link href="/notifications" className={utilityLinkClass}>
              <Bell className="size-3.5 shrink-0" aria-hidden />
              {t("nav.notifications")}
            </Link>
            <Link href="/orders" className={utilityLinkClass}>
              <ClipboardList className="size-3.5 shrink-0" aria-hidden />
              {t("nav.orders")}
            </Link>
            <a
              href={sellHref}
              target="_blank"
              rel="noopener noreferrer"
              className={utilityLinkClass}
            >
              {t("home.distributorCta.action")}
            </a>
          </nav>
        </div>
      </div>

      {/* Main search row */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 md:px-6">
        <Link
          href="/"
          className="flex items-center"
          aria-label={t("header.homeAria")}
        >
          <LakuLogo variant="onDark" className="h-8 w-auto md:h-9" priority />
        </Link>

        <div className="order-3 w-full md:order-none md:w-auto md:flex-1">
          <Suspense fallback={<div className="h-10 rounded-pill bg-white/90" />}>
            <SearchBar />
          </Suspense>
        </div>

        <nav
          className="ml-auto flex items-center gap-1 md:gap-2"
          aria-label={t("header.mainNavAria")}
        >
          <Link
            href="/messages"
            aria-label={t("header.messagesAria")}
            className="relative flex size-9 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/10 hover:text-white"
          >
            <MessageCircle className="size-5" aria-hidden />
          </Link>
          <Link
            href="/cart"
            aria-label={
              badge
                ? t("header.cartCountAria", { count: cartCount })
                : t("header.cartAria")
            }
            className="relative flex size-9 items-center justify-center rounded-lg text-white/90 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ShoppingCart className="size-5" aria-hidden />
            {badge ? (
              <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-laku-alert px-1 text-[10px] font-bold text-white">
                {badge}
              </span>
            ) : null}
          </Link>
          <AccountMenu user={user} sellHref={sellHref} />
        </nav>
      </div>
    </header>
  );
}
