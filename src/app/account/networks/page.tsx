import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Store, Users } from "lucide-react";

import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { getOrders } from "@/lib/api/orders";
import { getSession } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";
import { buildNetworksFromOrders } from "@/lib/networks";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("myNetworks.title"),
    robots: { index: false, follow: false },
  };
}

export default async function MyNetworksPage() {
  const t = await getTranslations();
  const session = await getSession();

  if (!session) {
    return (
      <SignedOutPrompt
        title={t("account.signedOutTitle")}
        body={t("account.signedOutBody")}
      />
    );
  }

  const { orders } = await getOrders({
    userId: session.user.id,
    token: session.token,
    limit: 100,
  });
  const networks = buildNetworksFromOrders(orders, t);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <Link
        href="/account"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("common.back")}
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-laku-ink">
        {t("myNetworks.title")}
      </h1>

      {networks.length === 0 ? (
        <div className="rounded-2xl bg-white px-5 py-12 text-center">
          <Users className="mx-auto size-8 text-laku-faint" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-laku-ink">
            {t("myNetworks.states.emptyTitle")}
          </p>
          <p className="mt-1 text-sm text-laku-muted">
            {t("myNetworks.states.emptyBody")}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {networks.map((item) => (
            <li key={item.id}>
              <Link
                href={`/distributor/${item.id}`}
                className="flex items-center gap-3 rounded-2xl bg-white p-4 transition-colors hover:bg-laku-blue/5"
              >
                <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-laku-chip">
                  {item.logo ? (
                    <Image
                      src={item.logo}
                      alt=""
                      fill
                      sizes="56px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <Store className="size-6 text-laku-faint" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-laku-ink">
                    {item.name}
                  </span>
                  {item.address ? (
                    <span className="mt-0.5 block truncate text-xs text-laku-muted">
                      {item.address}
                    </span>
                  ) : null}
                  <span className="mt-1 block text-xs text-laku-faint">
                    {t("myNetworks.orders", { count: item.totalOrders })}
                    {item.lastOrderDate
                      ? ` · ${t("myNetworks.lastLabel", {
                          date: formatDate(item.lastOrderDate, t.locale),
                        })}`
                      : null}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-laku-faint" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
