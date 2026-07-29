import type { Metadata } from "next";
import { RotateCcw } from "lucide-react";

import ActivityGrid from "@/components/account/ActivityGrid";
import ActivityPageShell from "@/components/account/ActivityPageShell";
import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { getProductById, getProductsSafe } from "@/lib/api/marketplace";
import { getOrders } from "@/lib/api/orders";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("moreService.buyAgain.title"),
    robots: { index: false, follow: false },
  };
}

const MAX_ITEMS = 12;

export default async function BuyAgainPage() {
  const [session, t] = await Promise.all([getSession(), getTranslations()]);

  if (!session) {
    return (
      <SignedOutPrompt
        title={t("moreService.buyAgain.signedOutTitle")}
        body={t("moreService.buyAgain.signedOutBody")}
      />
    );
  }

  const { orders } = await getOrders({
    userId: session.user.id,
    token: session.token,
    limit: 100,
  });

  // Same source as the app: previously ordered products, newest order first.
  const orderedIds: string[] = [];
  for (const order of orders) {
    for (const item of order.orderItems) {
      if (item.productId && !orderedIds.includes(item.productId)) {
        orderedIds.push(item.productId);
      }
    }
  }

  const [products, catalog] = await Promise.all([
    Promise.all(orderedIds.slice(0, MAX_ITEMS).map((id) => getProductById(id))),
    getProductsSafe({ limit: 12 }),
  ]);

  // Products delisted since the order are dropped rather than shown unbuyable.
  const available = products.filter((product) => product !== null);
  const availableIds = new Set(available.map((product) => product.id));
  const suggestions = catalog.products
    .filter((product) => !availableIds.has(product.id))
    .slice(0, 4);

  return (
    <ActivityPageShell
      title={t("moreService.buyAgain.title")}
      subtitle={
        available.length > 0
          ? t("moreService.buyAgain.subtitle", { count: available.length })
          : t("moreService.buyAgain.subtitleEmpty")
      }
      emptyIcon={RotateCcw}
      emptyTitle={t("moreService.buyAgain.emptyTitle")}
      emptyBody={t("moreService.buyAgain.emptyBody")}
      isEmpty={available.length === 0}
      suggestions={suggestions}
    >
      <ActivityGrid products={available} />
    </ActivityPageShell>
  );
}
