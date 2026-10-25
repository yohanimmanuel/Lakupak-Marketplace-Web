import type { Metadata } from "next";
import Link from "next/link";

import SearchPagination from "@/components/search/SearchPagination";
import SearchDiscovery from "@/components/search/SearchDiscovery";
import SearchResultsClient from "@/components/search/SearchResultsClient";
import { getTranslations } from "@/i18n/server";
import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getProductsSafe } from "@/lib/api/marketplace";
import { getSession } from "@/lib/auth/session";
import { buildCategoryDirectory, translateCategory } from "@/lib/categories";
import { formatNumber } from "@/lib/format";
import {
  resolveProductTypeKey,
  resolveProductTypeKeyExact,
  resolveSearchQuery,
} from "@/lib/resolveSearchQuery";
import {
  generatePopularCategories,
  generateTopBrands,
  generateTopDistributors,
} from "@/lib/searchDiscovery";

export const revalidate = 30;

const PAGE_SIZE = 48;

type SearchParams = {
  q?: string;
  category?: string;
  page?: string;
};

function parsePage(value?: string): number {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const [t, session] = await Promise.all([getTranslations(), getSession()]);
  const { q, category } = await searchParams;
  const categoryKey = category
    ? (resolveProductTypeKey(category) ?? category)
    : null;
  const categoryLabel = categoryKey ? translateCategory(categoryKey, t) : null;
  const displayQuery = q?.trim() || "";

  const title = displayQuery
    ? t("search.metaResultsFor", { query: displayQuery })
    : categoryLabel
      ? t("search.categoryWholesale", { category: categoryLabel })
      : t("search.allProducts");

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  const query = params.toString();

  // Closed catalog: signed-out search is a login wall; never index it (or query URLs).
  const noIndex = !session || Boolean(q);

  return {
    title,
    description: displayQuery
      ? t("search.metaDescriptionQuery", { query: displayQuery })
      : categoryLabel
        ? t("search.metaDescriptionCategory", { category: categoryLabel })
        : t("search.metaDescriptionAll"),
    alternates: { canonical: query ? `/search?${query}` : "/search" },
    robots: noIndex ? { index: false, follow: true } : undefined,
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const t = await getTranslations();
  if (!(await getSession())) {
    return <SignedOutPrompt title={t("search.signedOutTitle")} body={t("home.closedCatalog")} />;
  }
  const { q, category, page: pageParam } = await searchParams;
  const page = parsePage(pageParam);

  const { displayQuery, apiQuery, category: resolvedCategory } =
    resolveSearchQuery(q?.trim() ?? "");
  const effectiveCategory = category?.trim()
    ? (resolveProductTypeKey(category.trim()) ?? category.trim())
    : resolvedCategory;

  const { products, pagination, facets, didYouMean } = await getProductsSafe({
    page,
    limit: PAGE_SIZE,
    search: apiQuery || undefined,
    category: effectiveCategory || undefined,
  });

  const isEmptyQuery = !displayQuery && !effectiveCategory;

  const categories = buildCategoryDirectory(facets.productTypes, products, t);
  const categoryLabel = effectiveCategory
    ? translateCategory(effectiveCategory, t)
    : null;
  const heading = displayQuery
    ? t("search.resultsFor", { query: displayQuery })
    : categoryLabel
      ? categoryLabel
      : t("search.allProducts");

  const didYouMeanKey = didYouMean
    ? (resolveProductTypeKey(didYouMean) ?? didYouMean)
    : null;
  const didYouMeanLabel = didYouMeanKey
    ? translateCategory(didYouMeanKey, t) || didYouMeanKey
    : null;

  const topBrands = isEmptyQuery ? generateTopBrands(products) : [];
  const topDistributors = isEmptyQuery ? generateTopDistributors(products) : [];
  const popularCategories = isEmptyQuery
    ? generatePopularCategories(products)
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-laku-ink">{heading}</h1>
        <p className="mt-1 text-sm text-laku-muted">
          {pagination.totalCount > 0
            ? t("search.found", {
                count: formatNumber(pagination.totalCount, t.locale),
              })
            : t("search.noMatch")}
        </p>

        {didYouMeanLabel && didYouMeanKey ? (
          <p className="mt-3 rounded-card border border-laku-line bg-white px-4 py-3 text-sm text-laku-ink">
            {t("search.didYouMean")}{" "}
            <Link
              href={`/search?q=${encodeURIComponent(didYouMeanLabel)}`}
              className="font-semibold text-laku-blue hover:underline"
            >
              {didYouMeanLabel}
            </Link>
          </p>
        ) : null}
      </header>

      {categories.length > 0 ? (
        <nav
          aria-label={t("search.filterAria")}
          className="laku-rail mb-8 flex gap-2 overflow-x-auto pb-1"
        >
          <Link
            href={
              displayQuery && !resolveProductTypeKeyExact(displayQuery)
                ? `/search?q=${encodeURIComponent(displayQuery)}`
                : "/search"
            }
            className={`shrink-0 rounded-card border px-3 py-2 text-[13px] font-semibold transition-colors ${
              effectiveCategory
                ? "border-laku-line bg-white text-laku-ink hover:border-laku-blue"
                : "border-laku-blue bg-laku-blue text-white"
            }`}
          >
            {t("common.all")}
          </Link>
          {categories.map((item) => {
            const params = new URLSearchParams();
            // Keep free-text queries when refining by category; replace category-name queries.
            if (displayQuery && !resolveProductTypeKeyExact(displayQuery)) {
              params.set("q", displayQuery);
            } else {
              params.set("q", item.label);
            }
            params.set("category", item.name);
            const isActive = effectiveCategory === item.name;

            return (
              <Link
                key={item.name}
                href={`/search?${params.toString()}`}
                className={`shrink-0 rounded-card border px-3 py-2 text-[13px] font-semibold transition-colors ${
                  isActive
                    ? "border-laku-blue bg-laku-blue text-white"
                    : "border-laku-line bg-white text-laku-ink hover:border-laku-blue"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      ) : null}

      {isEmptyQuery ? (
        <div className="mb-10">
          <SearchDiscovery
            brands={topBrands}
            distributors={topDistributors}
            categories={popularCategories}
          />
        </div>
      ) : null}

      {products.length > 0 ? (
        <>
          <SearchResultsClient
            products={products}
            emptyTitle={t("search.emptyTitle")}
            emptyBody={t("search.emptyBody")}
          />
          <SearchPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            q={displayQuery || undefined}
            category={effectiveCategory || undefined}
          />
        </>
      ) : !isEmptyQuery ? (
        <div className="rounded-2xl bg-white p-12 text-center">
          <h2 className="text-lg font-bold text-laku-ink">
            {t("search.emptyTitle")}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm/6 text-laku-muted">
            {t("search.emptyBody")}
          </p>
          <Link
            href="/categories"
            className="mt-6 inline-flex rounded-lg bg-laku-blue px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
          >
            {t("search.viewCategories")}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
