import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  ClipboardList,
  CreditCard,
  Eye,
  Heart,
  MapPin,
  Package,
  PackageCheck,
  RotateCcw,
  Settings,
  Store,
  Truck,
  UserRound,
} from "lucide-react";

import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import LogoutButton from "@/components/auth/LogoutButton";
import { getTranslations } from "@/i18n/server";
import { getDistributor } from "@/lib/api/marketplace";
import { getOrders } from "@/lib/api/orders";
import { getProfile } from "@/lib/api/profile";
import { getSession } from "@/lib/auth/session";
import { getStorefrontDistributorId } from "@/lib/auth/storefront";
import { buildNetworksFromOrders } from "@/lib/networks";
import { getDistributorUserId } from "@/lib/orders";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("account.title"),
    description: t("account.metaDescription"),
    robots: { index: false, follow: false },
  };
}

const PURCHASE_SHORTCUTS = [
  { icon: CreditCard, key: "account.toPay", href: "/orders?tab=to_pay", statuses: ["Pending"] },
  { icon: Package, key: "account.toShip", href: "/orders?tab=to_ship", statuses: ["Confirmed", "Packed"] },
  { icon: Truck, key: "account.toReceive", href: "/orders?tab=to_receive", statuses: ["Shipped"] },
  { icon: PackageCheck, key: "account.completed", href: "/orders?tab=completed", statuses: ["Delivered", "Received"] },
];

const SERVICES = [
  {
    href: "/account/favourites",
    icon: Heart,
    labelKey: "account.favouritesLabel",
    descriptionKey: "account.favouritesDescription",
  },
  {
    href: "/account/recently-viewed",
    icon: Eye,
    labelKey: "account.recentlyViewedLabel",
    descriptionKey: "account.recentlyViewedDescription",
  },
  {
    href: "/account/buy-again",
    icon: RotateCcw,
    labelKey: "account.buyAgainLabel",
    descriptionKey: "account.buyAgainDescription",
  },
];

export default async function AccountPage() {
  const [session, t] = await Promise.all([getSession(), getTranslations()]);

  if (!session) {
    return (
      <SignedOutPrompt
        title={t("account.signedOutTitle")}
        body={t("account.signedOutBody")}
      />
    );
  }

  const storefrontId = getStorefrontDistributorId(session.token);

  const [profile, { orders }, storefrontProfile] = await Promise.all([
    getProfile({ userId: session.user.id, token: session.token }),
    getOrders({ userId: session.user.id, token: session.token, limit: 100 }),
    storefrontId ? getDistributor(storefrontId) : Promise.resolve(null),
  ]);

  const displayName =
    profile?.name?.trim() || profile?.username?.trim() || session.user.name;
  const avatar = profile?.image ?? null;
  const banner = profile?.bannerImage?.trim() || null;

  const countFor = (statuses: string[]) =>
    orders.filter((order) => statuses.includes(order.orderStatus)).length;

  // Closed marketplace: always show the session storefront, even with 0 orders.
  const orderNetworks = buildNetworksFromOrders(orders, t);
  const storefrontOrderCount = storefrontId
    ? orders.filter((order) => {
        if (order.orderStatus === "Deleted" || order.orderStatus === "Cancelled") {
          return false;
        }
        return getDistributorUserId(order) === storefrontId;
      }).length
    : 0;
  // Only the JWT storefront belongs under this heading — never fall back to
  // order-derived distributors (those are purchase history, not membership).
  const networks =
    storefrontId != null
      ? [
          {
            id: storefrontId,
            name:
              storefrontProfile?.companyName?.trim() ||
              storefrontProfile?.name?.trim() ||
              orderNetworks.find((item) => item.id === storefrontId)?.name ||
              t("product.distributorFallback"),
            logo:
              storefrontProfile?.logo?.trim() ||
              orderNetworks.find((item) => item.id === storefrontId)?.logo ||
              null,
            totalOrders: storefrontOrderCount,
          },
        ]
      : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      {/* Mirrors the app's Account tab, where the header keeps a gear to /settings. */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-laku-ink">{t("account.title")}</h1>
        <Link
          href="/settings"
          aria-label={t("settings.title")}
          className="flex size-10 items-center justify-center rounded-lg text-laku-ink transition-colors hover:bg-laku-blue/5"
        >
          <Settings className="size-5" aria-hidden />
        </Link>
      </div>

      <section className="overflow-hidden rounded-2xl bg-white">
        <div className="relative h-28 bg-laku-blue">
          {banner ? (
            <Image
              src={banner}
              alt=""
              fill
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
              priority
            />
          ) : null}
        </div>
        <div className="px-6 pb-6">
          <div className="-mt-9">
            <span className="relative flex size-18 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-laku-blue/10 text-laku-blue">
              {avatar ? (
                <Image src={avatar} alt="" fill sizes="72px" className="object-cover" />
              ) : (
                <UserRound className="size-7" aria-hidden />
              )}
            </span>
          </div>

          <div className="mt-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-bold text-laku-ink">{displayName}</p>
              {profile?.storeName ? (
                <p className="text-sm text-laku-muted">{profile.storeName}</p>
              ) : null}
              <p className="mt-1 flex items-start gap-1.5 text-sm text-laku-muted">
                <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span className="min-w-0">
                  {profile?.chosenAddress?.trim() || t("account.addressNotSet")}
                </span>
              </p>
            </div>
            <Link
              href="/account/profile"
              className="shrink-0 rounded-lg border border-laku-line px-4 py-2 text-sm font-semibold text-laku-ink transition-colors hover:border-laku-blue/20 hover:bg-laku-blue/5"
            >
              {t("account.editProfile")}
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-4 rounded-2xl bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold text-laku-ink">{t("account.purchases")}</h2>
          <Link
            href="/orders"
            className="inline-flex items-center gap-0.5 text-sm font-semibold text-laku-blue hover:text-laku-blue-dark"
          >
            {t("account.orderHistory")}
            <ChevronRight className="size-3.5" aria-hidden />
          </Link>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {PURCHASE_SHORTCUTS.map((shortcut) => {
            const count = countFor(shortcut.statuses);
            return (
              <Link
                key={shortcut.key}
                href={shortcut.href}
                className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center transition-colors hover:bg-laku-blue/5"
              >
                <span className="relative text-laku-blue">
                  <shortcut.icon className="size-6" aria-hidden />
                  {count > 0 ? (
                    <span className="absolute -top-1.5 -right-2 min-w-4 rounded-full bg-laku-alert px-1 text-[10px] font-bold text-white">
                      {count}
                    </span>
                  ) : null}
                </span>
                <span className="text-xs font-medium text-laku-ink">
                  {t(shortcut.key)}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-4 rounded-2xl bg-white p-5">
        <h2 className="mb-4 text-sm font-bold text-laku-ink">
          {t("account.distributorStorefront")}
        </h2>

        {networks.length > 0 ? (
          <div className="flex flex-col gap-3">
            {networks.map((item) => (
              <div key={item.id} className="flex flex-col gap-2">
                <Link
                  href={`/distributor/${item.id}/details`}
                  className="flex w-full items-center gap-3 rounded-xl border border-laku-line px-3 py-3 transition-colors hover:bg-laku-blue/5"
                >
                  <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-laku-chip">
                    {item.logo ? (
                      <Image
                        src={item.logo}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <Store className="size-4 text-laku-faint" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-laku-ink">
                      {item.name}
                    </span>
                    <span className="block text-xs text-laku-muted">
                      {t("account.networksOrdersCount", {
                        count: item.totalOrders,
                      })}
                    </span>
                  </span>
                </Link>
                <Link
                  href={`/seller/${item.id}`}
                  className="inline-flex w-full items-center justify-center rounded-lg border border-laku-line bg-white px-4 py-2.5 text-sm font-semibold text-laku-ink transition-colors hover:bg-laku-surface"
                >
                  {t("account.viewDistributorInformation")}
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-laku-muted">{t("account.noNetworksYet")}</p>
        )}

      </section>

      <section className="mt-4 overflow-hidden rounded-2xl bg-white">
        <h2 className="border-b border-laku-line px-5 py-3.5 text-sm font-bold text-laku-ink">
          {t("account.moreServices")}
        </h2>
        {SERVICES.map((service) => (
          <Link
            key={service.href}
            href={service.href}
            className="flex items-center gap-3 border-b border-[#f3f4f6] px-5 py-4 transition-colors last:border-b-0 hover:bg-laku-blue/5"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-laku-blue/10 text-laku-blue">
              <service.icon className="size-4" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-laku-ink">
                {t(service.labelKey)}
              </span>
              <span className="block text-xs text-laku-muted">
                {t(service.descriptionKey)}
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-laku-faint" aria-hidden />
          </Link>
        ))}
      </section>

      <section className="mt-4 overflow-hidden rounded-2xl bg-white">
        <Link
          href="/account/addresses"
          className="flex items-center gap-3 border-b border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-laku-ink transition-colors hover:bg-laku-blue/5"
        >
          <MapPin className="size-4 text-laku-muted" aria-hidden />
          {t("addresses.title")}
        </Link>
        <Link
          href="/cart"
          className="flex items-center gap-3 border-b border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-laku-ink transition-colors hover:bg-laku-blue/5"
        >
          <ClipboardList className="size-4 text-laku-muted" aria-hidden />
          {t("nav.myCart")}
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-3 border-b border-[#f3f4f6] px-5 py-4 text-sm font-semibold text-laku-ink transition-colors hover:bg-laku-blue/5"
        >
          <Settings className="size-4 text-laku-muted" aria-hidden />
          {t("nav.settings")}
        </Link>
        <Link
          href="/app"
          className="flex items-center gap-3 px-5 py-4 text-sm font-semibold text-laku-ink transition-colors hover:bg-laku-blue/5"
        >
          <Package className="size-4 text-laku-muted" aria-hidden />
          {t("nav.openInApp")}
        </Link>
      </section>

      <div className="mt-6">
        <LogoutButton />
      </div>
    </div>
  );
}
