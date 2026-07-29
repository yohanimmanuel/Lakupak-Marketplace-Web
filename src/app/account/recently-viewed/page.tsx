import type { Metadata } from "next";
import { Eye } from "lucide-react";

import ActivityGrid from "@/components/account/ActivityGrid";
import ActivityPageShell from "@/components/account/ActivityPageShell";
import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { getUserActivity } from "@/lib/api/activity";
import { getProductsSafe } from "@/lib/api/marketplace";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("moreService.recentlyViewed.title"),
    robots: { index: false, follow: false },
  };
}

export default async function RecentlyViewedPage() {
  const [session, t] = await Promise.all([getSession(), getTranslations()]);

  if (!session) {
    return (
      <SignedOutPrompt
        title={t("moreService.recentlyViewed.signedOutTitle")}
        body={t("moreService.recentlyViewed.signedOutBody")}
      />
    );
  }

  const [activities, catalog] = await Promise.all([
    getUserActivity({ userId: session.user.id, token: session.token, type: "viewed" }),
    getProductsSafe({ limit: 12 }),
  ]);

  // The API already returns the newest row per product, capped at 20.
  const products = activities.map((activity) => activity.productData);
  const viewedIds = new Set(products.map((product) => product.id));
  const suggestions = catalog.products
    .filter((product) => !viewedIds.has(product.id))
    .slice(0, 4);

  return (
    <ActivityPageShell
      title={t("moreService.recentlyViewed.title")}
      subtitle={
        products.length > 0
          ? t("moreService.recentlyViewed.subtitle", { count: products.length })
          : t("moreService.recentlyViewed.subtitleEmpty")
      }
      emptyIcon={Eye}
      emptyTitle={t("moreService.recentlyViewed.emptyTitle")}
      emptyBody={t("moreService.recentlyViewed.emptyBody")}
      isEmpty={products.length === 0}
      suggestions={suggestions}
    >
      <ActivityGrid products={products} />
    </ActivityPageShell>
  );
}
