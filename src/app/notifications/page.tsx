import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Bell, Megaphone, Package } from "lucide-react";

import { getTranslations } from "@/i18n/server";
import { getOrders } from "@/lib/api/orders";
import { getLatestUpdates } from "@/lib/api/marketplace";
import { getSession } from "@/lib/auth/session";
import { getStorefrontDistributorId } from "@/lib/auth/storefront";
import { formatDate } from "@/lib/format";
import { getSellerName, getStatusMessage } from "@/lib/orders";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("notifications.title"),
    description: t("notifications.metaDescription"),
    robots: { index: false, follow: true },
  };
}

/** Empty value means "all"; the rest are the API's category codes. */
const CATEGORIES = ["all", "update", "promotion", "maintenance", "policy"] as const;

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const t = await getTranslations();
  const session = await getSession();
  const storefrontId = session ? getStorefrontDistributorId(session.token) : null;

  const [updates, orderResult] = await Promise.all([
    getLatestUpdates({ limit: 40, category: category || undefined, distributorId: storefrontId }),
    session
      ? getOrders({ userId: session.user.id, token: session.token, limit: 5 })
      : Promise.resolve(null),
  ]);

  const orders = orderResult?.orders ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <h1 className="mb-6 text-2xl font-bold text-laku-ink">
        {t("notifications.title")}
      </h1>

      {session ? (
        <section className="mb-8 overflow-hidden rounded-2xl bg-white">
          <div className="flex items-center justify-between gap-3 px-5 py-4">
            <h2 className="text-base font-bold text-laku-ink">
              {t("notifications.orderUpdates")}
            </h2>
            <Link
              href="/orders"
              className="text-sm font-semibold text-laku-blue hover:underline"
            >
              {t("common.viewAllLower")}
            </Link>
          </div>

          {orders.length > 0 ? (
            <ul>
              {orders.map((order) => {
                const thumbnail = order.orderItems.find((item) => item.images?.length)
                  ?.images?.[0];

                return (
                  <li key={order.orderId}>
                    <Link
                      href="/orders"
                      className="flex items-start gap-3 border-t border-[#f3f4f6] px-5 py-4 transition-colors hover:bg-laku-blue/5"
                    >
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-laku-chip">
                        {thumbnail ? (
                          <Image
                            src={thumbnail}
                            alt=""
                            fill
                            sizes="44px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="flex h-full items-center justify-center">
                            <Package className="size-5 text-laku-faint" aria-hidden />
                          </span>
                        )}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold text-laku-ink">
                          {getStatusMessage(order.orderStatus, t)}
                        </span>
                        <span className="block truncate text-sm text-laku-muted">
                          {getSellerName(order, t)} · #{order.orderId}
                        </span>
                        <span className="mt-1 block text-xs text-laku-faint">
                          {formatDate(order.orderDate, t.locale)}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="border-t border-[#f3f4f6] px-5 py-6 text-sm text-laku-muted">
              {t("notifications.noOrders")}
            </p>
          )}
        </section>
      ) : (
        <section className="mb-8 rounded-2xl bg-white p-6">
          <Bell className="size-6 text-laku-blue" aria-hidden />
          <h2 className="mt-3 text-base font-bold text-laku-ink">
            {t("notifications.signedOutTitle")}
          </h2>
          <p className="mt-1 text-sm/6 text-laku-muted">
            {t("notifications.signedOutBody")}
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex rounded-lg bg-laku-blue px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
          >
            {t("nav.login")}
          </Link>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl bg-white">
        <div className="px-5 pt-5">
          <h2 className="text-base font-bold text-laku-ink">
            {t("notifications.latestUpdates")}
          </h2>
          <nav
            aria-label={t("notifications.filterAria")}
            className="laku-rail mt-4 flex gap-5 overflow-x-auto border-b border-laku-line"
          >
            {CATEGORIES.map((code) => {
              const value = code === "all" ? "" : code;
              const isActive = (category ?? "") === value;
              return (
                <Link
                  key={code}
                  href={value ? `/notifications?category=${value}` : "/notifications"}
                  className={`shrink-0 border-b-[3px] pb-2 text-xs transition-colors ${
                    isActive
                      ? "border-laku-blue font-bold text-laku-blue"
                      : "border-transparent font-medium text-laku-faint hover:text-laku-ink"
                  }`}
                >
                  {t(`notifications.categories.${code}`)}
                </Link>
              );
            })}
          </nav>
        </div>

        {updates.length > 0 ? (
          <ul>
            {updates.map((update) => (
              <li key={update.id}>
                <Link
                  href={`/promo/${update.id}`}
                  className="flex min-h-[5.75rem] items-center gap-3 border-t border-[#f3f4f6] px-5 py-4 transition-colors hover:bg-laku-blue/5"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#bfdbfe] bg-[#eff6ff]">
                    <Megaphone className="size-4 text-laku-blue" aria-hidden />
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-[15px] font-semibold text-laku-ink">
                      {update.title}
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-sm/5 text-laku-muted">
                      {update.body}
                    </span>
                    <span className="mt-1 block text-xs text-laku-faint">
                      {formatDate(update.publishedAt, t.locale)}
                    </span>
                  </span>

                  <span className="relative size-12 shrink-0 overflow-hidden rounded-card bg-laku-chip">
                    {update.imageUrl ? (
                      <Image
                        src={update.imageUrl}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="border-t border-[#f3f4f6] px-5 py-6 text-sm text-laku-muted">
            {t("notifications.emptyCategory")}
          </p>
        )}
      </section>
    </div>
  );
}
