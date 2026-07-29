import type { Metadata } from "next";
import { Heart } from "lucide-react";

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
    title: t("moreService.favourites.title"),
    robots: { index: false, follow: false },
  };
}

export default async function FavouritesPage() {
  const [session, t] = await Promise.all([getSession(), getTranslations()]);

  if (!session) {
    return (
      <SignedOutPrompt
        title={t("moreService.favourites.signedOutTitle")}
        body={t("moreService.favourites.signedOutBody")}
      />
    );
  }

  const [activities, catalog] = await Promise.all([
    getUserActivity({
      userId: session.user.id,
      token: session.token,
      type: "favorite",
    }),
    getProductsSafe({ limit: 12 }),
  ]);

  const products = activities.map((activity) => activity.productData);
  const favoriteIds = new Set(products.map((product) => product.id));
  const suggestions = catalog.products
    .filter((product) => !favoriteIds.has(product.id))
    .slice(0, 4);

  return (
    <ActivityPageShell
      title={t("moreService.favourites.title")}
      subtitle={
        products.length > 0
          ? t("moreService.favourites.subtitle", { count: products.length })
          : t("moreService.favourites.subtitleEmpty")
      }
      emptyIcon={Heart}
      emptyTitle={t("moreService.favourites.emptyTitle")}
      emptyBody={t("moreService.favourites.emptyBody")}
      isEmpty={products.length === 0}
      suggestions={suggestions}
    >
      <ActivityGrid products={products} allowUnfavorite />
    </ActivityPageShell>
  );
}
