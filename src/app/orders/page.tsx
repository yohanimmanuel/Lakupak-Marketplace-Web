import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import OrderCard from "@/components/orders/OrderCard";
import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { getOrders } from "@/lib/api/orders";
import { getSession } from "@/lib/auth/session";
import { formatNumber } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("orders.title"),
    description: t("orders.metaDescription"),
    robots: { index: false, follow: false },
  };
}

type SearchParams = Promise<{ tab?: string }>;

const ORDER_TABS = [
  { key: "all", filter: () => true },
  {
    key: "to_pay",
    filter: (order: { paymentStatus: string; orderStatus: string }) =>
      order.paymentStatus === "Unpaid" &&
      !["Cancelled", "Returned", "Failed"].includes(order.orderStatus),
  },
  { key: "to_ship", filter: (order: { orderStatus: string }) => ["Confirmed", "Packed"].includes(order.orderStatus) },
  { key: "to_receive", filter: (order: { orderStatus: string }) => order.orderStatus === "Shipped" },
  { key: "completed", filter: (order: { orderStatus: string }) => ["Delivered", "Received"].includes(order.orderStatus) },
  { key: "cancelled", filter: (order: { orderStatus: string }) => order.orderStatus === "Cancelled" },
  { key: "returned", filter: (order: { orderStatus: string }) => order.orderStatus === "Returned" },
] as const;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations();
  const session = await getSession();

  if (!session) {
    return (
      <SignedOutPrompt
        title={t("orders.signedOutTitle")}
        body={t("orders.signedOutBody")}
      />
    );
  }

  const { tab } = await searchParams;
  const { orders, pagination, expired } = await getOrders({
    userId: session.user.id,
    token: session.token,
    limit: 30,
  });

  if (expired) {
    return (
      <SignedOutPrompt
        title={t("orders.expiredTitle")}
        body={t("orders.expiredBody")}
      />
    );
  }

  const activeTab = ORDER_TABS.find((item) => item.key === tab)?.key ?? "all";
  const filteredOrders = ORDER_TABS.find((item) => item.key === activeTab)
    ? orders.filter(ORDER_TABS.find((item) => item.key === activeTab)!.filter)
    : orders;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-laku-ink">{t("orders.title")}</h1>
        <p className="mt-1 text-sm text-laku-muted">
          {pagination.totalCount > 0
            ? t("orders.count", {
                count: formatNumber(pagination.totalCount, t.locale),
              })
            : t("orders.none")}
        </p>
      </header>

      <nav
        aria-label={t("orders.tabAria")}
        className="laku-rail mb-5 flex gap-3 overflow-x-auto border-b border-laku-line"
      >
        {ORDER_TABS.map((item) => {
          const current = item.key === activeTab;
          const href = item.key === "all" ? "/orders" : `/orders?tab=${item.key}`;
          return (
            <Link
              key={item.key}
              href={href}
              className={`shrink-0 border-b-2 px-1 pb-3 text-sm transition-colors ${
                current
                  ? "border-laku-blue font-bold text-laku-blue"
                  : "border-transparent font-medium text-laku-muted hover:border-laku-blue/35 hover:text-laku-ink"
              }`}
            >
              {t(`orders.tabs.${item.key}`)}
            </Link>
          );
        })}
      </nav>

      {filteredOrders.length > 0 ? (
        <div className="overflow-hidden rounded-2xl bg-white">
          {filteredOrders.map((order) => (
            <OrderCard key={order.orderId} order={order} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-12 text-center">
          <ShoppingBag className="mx-auto size-10 text-[#d1d5db]" aria-hidden />
          <h2 className="mt-4 text-lg font-bold text-laku-ink">
            {t(activeTab === "all" ? "orders.emptyTitle" : "orders.emptyFilteredTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-sm/6 text-laku-muted">
            {t(activeTab === "all" ? "orders.emptyBody" : "orders.emptyFilteredBody")}
          </p>
          <Link
            href="/search"
            className="mt-6 inline-flex rounded-lg bg-laku-blue px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
          >
            {t("orders.startShopping")}
          </Link>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-laku-muted">
        {t("orders.syncNote")}
      </p>
    </div>
  );
}
