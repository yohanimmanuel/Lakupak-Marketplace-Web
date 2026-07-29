"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import ProductGrid from "@/components/product/ProductGrid";
import { useTranslations } from "@/i18n/client";
import type { MarketplaceProduct } from "@/lib/api/types";
import { getProductPriceRange } from "@/lib/format";
import {
  availableShippingOptionKeys,
  productShippedFrom,
  productSupportsShipping,
  uniqueShippedFromOptions,
  type ShippingOptionKey,
} from "@/lib/searchDiscovery";
import { translateCategory } from "@/lib/categories";

type SortKey = "relevance" | "newest" | "price_low" | "price_high" | "top_sales";

function parseSold(soldCount: string): number {
  const n = Number.parseInt(String(soldCount).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}

function toggleValue<T extends string>(list: T[], value: T): T[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function pillClass(active: boolean) {
  return `rounded-lg border px-3 py-1.5 text-xs font-semibold ${
    active
      ? "border-laku-blue bg-laku-blue/10 text-laku-blue"
      : "border-laku-line text-laku-ink"
  }`;
}

function FilterPills({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-laku-muted">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function SearchResultsClient({
  products,
  emptyTitle,
  emptyBody,
}: {
  products: MarketplaceProduct[];
  emptyTitle: string;
  emptyBody: string;
}) {
  const t = useTranslations();
  const [sort, setSort] = useState<SortKey>("relevance");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [ratingMin, setRatingMin] = useState(0);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [salesChannels, setSalesChannels] = useState<string[]>([]);
  const [shippedFrom, setShippedFrom] = useState<string[]>([]);
  const [shippingOption, setShippingOption] = useState<ShippingOptionKey[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const shippedFromOptions = useMemo(
    () => uniqueShippedFromOptions(products),
    [products],
  );
  const shippingKeys = useMemo(
    () => availableShippingOptionKeys(products),
    [products],
  );
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      if (product.category?.trim()) set.add(product.category.trim());
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];

    const min = Number.parseFloat(minPrice);
    const max = Number.parseFloat(maxPrice);
    list = list.filter((product) => {
      // Prefer seller rating when present (mobile filter), else product rating.
      const rating =
        product.seller?.rating ??
        product.reviews?.overallRating ??
        product.rating ??
        0;
      if (ratingMin > 0 && rating < ratingMin) return false;

      const price = getProductPriceRange(product).min || product.sellingPrice || 0;
      if (Number.isFinite(min) && min > 0 && price < min) return false;
      if (Number.isFinite(max) && max > 0 && price > max) return false;

      if (
        salesChannels.length > 0 &&
        product.salesChannel &&
        !salesChannels.includes(product.salesChannel)
      ) {
        return false;
      }

      if (shippedFrom.length > 0) {
        const loc = productShippedFrom(product);
        if (!shippedFrom.includes(loc)) return false;
      }

      if (shippingOption.length > 0) {
        const anyAvailable = shippingOption.some((key) =>
          productSupportsShipping(product, key),
        );
        if (!anyAvailable) return false;
      }

      if (categories.length > 0) {
        if (!product.category || !categories.includes(product.category)) {
          return false;
        }
      }

      return true;
    });

    if (sort === "price_low") {
      list.sort(
        (a, b) =>
          (getProductPriceRange(a).min || a.sellingPrice) -
          (getProductPriceRange(b).min || b.sellingPrice),
      );
    } else if (sort === "price_high") {
      list.sort(
        (a, b) =>
          (getProductPriceRange(b).min || b.sellingPrice) -
          (getProductPriceRange(a).min || a.sellingPrice),
      );
    } else if (sort === "top_sales") {
      list.sort((a, b) => parseSold(b.soldCount) - parseSold(a.soldCount));
    } else if (sort === "newest") {
      list.sort((a, b) =>
        String(b.publishedAt ?? "").localeCompare(String(a.publishedAt ?? "")),
      );
    }

    return list;
  }, [
    products,
    sort,
    ratingMin,
    minPrice,
    maxPrice,
    salesChannels,
    shippedFrom,
    shippingOption,
    categories,
  ]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-laku-ink">
          <span className="font-semibold text-laku-muted">{t("search.sortLabel")}</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortKey)}
            className="rounded-lg border border-laku-line bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-laku-blue"
          >
            <option value="relevance">{t("search.sort.relevance")}</option>
            <option value="newest">{t("search.sort.latest")}</option>
            <option value="top_sales">{t("search.sort.topSales")}</option>
            <option value="price_low">{t("search.sort.priceLow")}</option>
            <option value="price_high">{t("search.sort.priceHigh")}</option>
          </select>
        </label>

        <button
          type="button"
          onClick={() => setFiltersOpen((value) => !value)}
          className="inline-flex items-center gap-2 rounded-lg border border-laku-line bg-white px-3 py-2 text-sm font-semibold text-laku-ink transition-colors hover:bg-laku-surface"
        >
          <SlidersHorizontal className="size-4" aria-hidden />
          {t("search.filters")}
        </button>

        <p className="text-xs text-laku-muted">
          {t("search.showingCount", { count: filtered.length })}
        </p>
      </div>

      {filtersOpen ? (
        <div className="mb-5 space-y-4 rounded-2xl border border-laku-line bg-white p-4">
          <FilterPills title={t("search.filterSheet.ratingMin")}>
            {[0, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRatingMin(value)}
                className={pillClass(ratingMin === value)}
              >
                {value === 0
                  ? t("common.all")
                  : t("search.filterSheet.ratingPlus", { rating: value })}
              </button>
            ))}
          </FilterPills>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-laku-muted">
              {t("search.filterSheet.minPrice")}
              <input
                type="number"
                inputMode="numeric"
                value={minPrice}
                onChange={(event) => setMinPrice(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-laku-line px-3 text-sm text-laku-ink outline-none focus:border-laku-blue"
              />
            </label>
            <label className="block text-xs font-semibold text-laku-muted">
              {t("search.filterSheet.maxPrice")}
              <input
                type="number"
                inputMode="numeric"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-laku-line px-3 text-sm text-laku-ink outline-none focus:border-laku-blue"
              />
            </label>
          </div>

          <FilterPills title={t("search.filterSheet.salesChannel")}>
            {["Wholesale", "Retail"].map((channel) => (
              <button
                key={channel}
                type="button"
                onClick={() => setSalesChannels((prev) => toggleValue(prev, channel))}
                className={pillClass(salesChannels.includes(channel))}
              >
                {t(`search.salesChannel.${channel.toLowerCase()}`)}
              </button>
            ))}
          </FilterPills>

          {shippingKeys.length > 0 ? (
            <FilterPills title={t("search.filterSheet.shippingOption")}>
              {shippingKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setShippingOption((prev) => toggleValue(prev, key))
                  }
                  className={pillClass(shippingOption.includes(key))}
                >
                  {t(`search.shippingOption.${key}`)}
                </button>
              ))}
            </FilterPills>
          ) : null}

          {shippedFromOptions.length > 0 ? (
            <FilterPills title={t("search.filterSheet.shippedFrom")}>
              {shippedFromOptions.map((loc) => (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setShippedFrom((prev) => toggleValue(prev, loc))}
                  className={pillClass(shippedFrom.includes(loc))}
                >
                  {loc}
                </button>
              ))}
            </FilterPills>
          ) : null}

          {categoryOptions.length > 0 ? (
            <FilterPills title={t("search.filterSheet.category")}>
              {categoryOptions.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => setCategories((prev) => toggleValue(prev, name))}
                  className={pillClass(categories.includes(name))}
                >
                  {translateCategory(name, t)}
                </button>
              ))}
            </FilterPills>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setRatingMin(0);
              setMinPrice("");
              setMaxPrice("");
              setSalesChannels([]);
              setShippedFrom([]);
              setShippingOption([]);
              setCategories([]);
            }}
            className="text-sm font-semibold text-laku-blue hover:underline"
          >
            {t("search.filterSheet.reset")}
          </button>
        </div>
      ) : null}

      {filtered.length > 0 ? (
        <ProductGrid products={filtered} />
      ) : (
        <div className="rounded-card bg-white p-8 text-center">
          <p className="font-semibold text-laku-ink">{emptyTitle}</p>
          <p className="mt-2 text-sm text-laku-muted">{emptyBody}</p>
        </div>
      )}
    </div>
  );
}
