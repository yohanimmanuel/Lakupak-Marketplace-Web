"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";

import ProductGrid from "@/components/product/ProductGrid";
import { useTranslations } from "@/i18n/client";
import type { MarketplaceProduct } from "@/lib/api/types";
import { getProductPriceRange } from "@/lib/format";

type SortKey = "relevance" | "newest" | "price_low" | "price_high" | "top_sales";

function parseSold(soldCount: string): number {
  const n = Number.parseInt(String(soldCount).replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
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

  const filtered = useMemo(() => {
    let list = [...products];

    const min = Number.parseFloat(minPrice);
    const max = Number.parseFloat(maxPrice);
    list = list.filter((product) => {
      const rating = product.reviews?.overallRating ?? product.rating ?? 0;
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
  }, [products, sort, ratingMin, minPrice, maxPrice, salesChannels]);

  const toggleChannel = (channel: string) => {
    setSalesChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((item) => item !== channel)
        : [...prev, channel],
    );
  };

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
          <div>
            <p className="mb-2 text-xs font-semibold text-laku-muted">
              {t("search.filterSheet.ratingMin")}
            </p>
            <div className="flex flex-wrap gap-2">
              {[0, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRatingMin(value)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                    ratingMin === value
                      ? "border-laku-blue bg-laku-blue/10 text-laku-blue"
                      : "border-laku-line text-laku-ink"
                  }`}
                >
                  {value === 0
                    ? t("common.all")
                    : t("search.filterSheet.ratingPlus", { rating: value })}
                </button>
              ))}
            </div>
          </div>

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

          <div>
            <p className="mb-2 text-xs font-semibold text-laku-muted">
              {t("search.filterSheet.salesChannel")}
            </p>
            <div className="flex flex-wrap gap-2">
              {["Wholesale", "Retail"].map((channel) => (
                <button
                  key={channel}
                  type="button"
                  onClick={() => toggleChannel(channel)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                    salesChannels.includes(channel)
                      ? "border-laku-blue bg-laku-blue/10 text-laku-blue"
                      : "border-laku-line text-laku-ink"
                  }`}
                >
                  {t(`search.salesChannel.${channel.toLowerCase()}`)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setRatingMin(0);
              setMinPrice("");
              setMaxPrice("");
              setSalesChannels([]);
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
