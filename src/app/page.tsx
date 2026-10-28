import Link from "next/link";
import { Suspense } from "react";

import CategoryRail from "@/components/category/CategoryRail";
import OffersCarousel from "@/components/home/OffersCarousel";
import WhatIsLaku from "@/components/home/WhatIsLaku";
import ProductGrid from "@/components/product/ProductGrid";
import SearchBar from "@/components/search/SearchBar";
import SectionHeader from "@/components/ui/SectionHeader";
import { getTranslations } from "@/i18n/server";
import { EMPTY_RESULT, getDistributor, getProductsSafe } from "@/lib/api/marketplace";
import { getHomeOffersList } from "@/lib/api/offers";
import { getSession } from "@/lib/auth/session";
import { getStorefrontDistributorId } from "@/lib/auth/storefront";
import { buildCategoryDirectory } from "@/lib/categories";
import { dashboardLandingUrl } from "@/lib/config";

export const revalidate = 60;

export default async function HomePage() {
  const t = await getTranslations();
  const session = await getSession();
  const storefrontId = session ? getStorefrontDistributorId(session.token) : null;

  const [{ products, facets }, offers, storefront] = await Promise.all([
    session ? getProductsSafe({ limit: 20 }) : Promise.resolve(EMPTY_RESULT),
    // Sale banners only (Admin Offers). Announcements stay on /notifications.
    session ? getHomeOffersList(session.token) : Promise.resolve([]),
    storefrontId ? getDistributor(storefrontId) : Promise.resolve(null),
  ]);

  const categories = buildCategoryDirectory(facets.productTypes, products, t);
  const storefrontName =
    storefront?.companyName?.trim() || storefront?.name?.trim() || "";

  return (
    <div className="bg-laku-blue">
      <section className="mx-auto max-w-7xl px-4 pt-8 pb-14 md:px-6 md:pt-12">
        <p className="text-sm font-semibold text-white/80">
          {session
            ? t("home.greeting", { name: session.user.name.split(" ")[0] })
            : t("home.guestLabel")}
        </p>
        <h1 className="mt-2 max-w-2xl text-3xl font-extrabold text-balance text-white md:text-4xl">
          {storefrontName
            ? t("home.heroTitleWithDistributor", { distributor: storefrontName })
            : t("home.heroTitle")}
        </h1>
        <div className="mt-6 max-w-xl md:hidden">
          <Suspense fallback={<div className="h-10 rounded-pill bg-white" />}>
            <SearchBar />
          </Suspense>
        </div>
      </section>

      <div className="rounded-t-sheet bg-laku-surface pt-8 pb-16">
        <div className="mx-auto max-w-7xl space-y-12 md:px-6">
          {offers.length > 0 ? (
            <section className="laku-rise">
              <SectionHeader title={t("home.specialOffers")} href="/offers" />
              <OffersCarousel offers={offers} />
            </section>
          ) : null}

          {categories.length > 0 ? (
            <section className="laku-rise">
              <SectionHeader title={t("nav.categories")} href="/search" />
              <CategoryRail categories={categories} layout="directory" />
            </section>
          ) : null}

          <section className="laku-rise">
            <SectionHeader title={t("home.featured")} href="/search" />
            <div className="px-4 md:px-0">
              {products.length > 0 ? (
                <ProductGrid products={products} priorityCount={5} />
              ) : !session ? (
                <div className="rounded-card bg-white p-8 text-center">
                  <p className="text-sm text-laku-muted">{t("home.closedCatalog")}</p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Link
                      href="/login"
                      className="rounded-lg bg-laku-blue px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
                    >
                      {t("nav.login")}
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-lg border border-laku-line bg-white px-5 py-3 text-sm font-bold text-laku-ink transition-colors hover:border-laku-blue hover:text-laku-blue"
                    >
                      {t("nav.registerFree")}
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="rounded-card bg-white p-8 text-center text-sm text-laku-muted">
                  {t("home.emptyCatalog")}
                </p>
              )}
            </div>
          </section>

          {session ? null : <WhatIsLaku />}

          <section className="px-4 md:px-0">
            <div className="rounded-2xl bg-white p-8 text-center md:p-12">
              <h2 className="text-xl font-bold text-laku-ink md:text-2xl">
                {t("home.distributorCta.title")}
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm/6 text-laku-muted">
                {t("home.distributorCta.body")}
              </p>
              <a
                href={dashboardLandingUrl(t.locale)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex rounded-lg bg-laku-blue px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
              >
                {t("home.distributorCta.action")}
              </a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
