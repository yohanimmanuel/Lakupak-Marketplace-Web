import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, ClipboardList, Package, Truck } from "lucide-react";

import { getTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("checkoutSuccess.metaTitle"),
    robots: { index: false, follow: false },
  };
}

type SearchParams = Promise<{
  orders?: string;
  total?: string;
  payment?: string;
  partial?: string;
  expected?: string;
}>;

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations();
  const { orders, partial, expected } = await searchParams;
  const orderIds = (orders ?? "").split(",").filter(Boolean);

  if (orderIds.length === 0) redirect("/orders");

  const isPartial = partial === "1";
  const expectedCount = Number(expected) || 0;

  const nextSteps = [
    {
      icon: Package,
      title: t("checkoutSuccess.stepConfirmTitle"),
      body: t("checkoutSuccess.stepConfirmBody"),
    },
    {
      icon: Truck,
      title: t("checkoutSuccess.stepShipTitle"),
      body: t("checkoutSuccess.stepShipBody"),
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 md:px-6">
      <section className="rounded-2xl bg-white p-8 text-center">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-laku-ship/10 text-laku-ship">
          <CheckCircle2 className="size-9" aria-hidden />
        </span>

        <h1 className="mt-5 text-2xl font-bold text-laku-ink">
          {isPartial
            ? t("checkoutSuccess.partialTitle")
            : t("checkoutSuccess.title")}
        </h1>
        <p className="mt-2 text-sm/6 text-laku-muted">
          {isPartial
            ? t("checkoutSuccess.partialBody", {
                created: orderIds.length,
                expected: expectedCount || orderIds.length,
              })
            : orderIds.length > 1
              ? t("checkoutSuccess.subtitleMulti", { count: orderIds.length })
              : t("checkoutSuccess.subtitleSingle")}
        </p>
        {isPartial ? (
          <p
            role="status"
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm/6 text-amber-950"
          >
            {t("checkoutSuccess.partialWarning")}
          </p>
        ) : null}

        <p className="mt-5 text-sm font-semibold text-laku-ink">
          {t("checkoutSuccess.pendingConfirmation")}
        </p>
        <p className="mt-1 text-xs text-laku-muted">
          {t("checkoutSuccess.pricingPending")}
        </p>

        <ul className="mt-6 space-y-2">
          {orderIds.map((orderId) => (
            <li
              key={orderId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-laku-surface px-4 py-3"
            >
              <span className="font-mono text-sm text-laku-ink">#{orderId}</span>
              <Link
                href={`/orders/${encodeURIComponent(orderId)}`}
                className="text-sm font-semibold text-laku-blue hover:text-laku-blue-dark"
              >
                {t("checkoutSuccess.viewDetail")}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/orders"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-laku-line px-6 py-3.5 text-sm font-bold text-laku-ink transition-colors hover:bg-laku-surface"
          >
            <ClipboardList className="size-4" aria-hidden />
            {t("checkoutSuccess.myOrders")}
          </Link>
          <Link
            href="/search"
            className="rounded-lg border border-laku-line px-6 py-3.5 text-sm font-bold text-laku-ink transition-colors hover:bg-laku-surface"
          >
            {t("checkoutSuccess.keepShopping")}
          </Link>
        </div>
      </section>

      <section className="mt-4 rounded-2xl bg-white p-6">
        <h2 className="text-sm font-bold text-laku-ink">
          {t("checkoutSuccess.nextSteps")}
        </h2>
        <ol className="mt-4 space-y-4">
          {nextSteps.map((step) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-laku-blue/10 text-laku-blue">
                <step.icon className="size-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-laku-ink">{step.title}</p>
                <p className="mt-0.5 text-sm/6 text-laku-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
