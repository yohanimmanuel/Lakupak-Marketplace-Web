"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Package } from "lucide-react";

import ProductGrid from "@/components/product/ProductGrid";
import { useTranslations } from "@/i18n/client";
import type { MarketplaceProduct } from "@/lib/api/types";
import { formatNumber } from "@/lib/format";

type SortKey = "popular" | "latest" | "top_sales";

const SORT_TABS: SortKey[] = ["popular", "latest", "top_sales"];

function safeNum(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function parseSoldCount(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    const mult = s.endsWith("k") ? 1000 : s.endsWith("m") ? 1_000_000 : 1;
    const raw = mult === 1 ? s : s.slice(0, -1);
    const n = Number(raw);
    if (Number.isFinite(n)) return n * mult;
  }
  return 0;
}

function latestTimestamp(product: MarketplaceProduct): number {
  if (!product.publishedAt) return 0;
  const t = Date.parse(product.publishedAt);
  return Number.isFinite(t) ? t : 0;
}

function categoryOf(product: MarketplaceProduct): string {
  return (product.productCategory || product.category || "").trim();
}

export default function DistributorProductShelf({
  products,
}: {
  products: MarketplaceProduct[];
}) {
  const t = useTranslations();
  const [sortKey, setSortKey] = useState<SortKey>("popular");
  const [category, setCategory] = useState("all");

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const product of products) {
      const value = categoryOf(product);
      if (value) set.add(value);
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [products]);

  const visible = useMemo(() => {
    const base =
      category === "all"
        ? products
        : products.filter((product) => categoryOf(product) === category);

    const sorted = [...base];

    if (sortKey === "popular") {
      sorted.sort((a, b) => {
        const scoreA =
          safeNum(a.rating) * 10 +
          safeNum(a.reviewCount) +
          parseSoldCount(a.soldCount) * 0.01;
        const scoreB =
          safeNum(b.rating) * 10 +
          safeNum(b.reviewCount) +
          parseSoldCount(b.soldCount) * 0.01;
        return scoreB - scoreA;
      });
    } else if (sortKey === "latest") {
      sorted.sort((a, b) => latestTimestamp(b) - latestTimestamp(a));
    } else if (sortKey === "top_sales") {
      sorted.sort(
        (a, b) => parseSoldCount(b.soldCount) - parseSoldCount(a.soldCount),
      );
    }

    return sorted;
  }, [category, products, sortKey]);

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-laku-ink">
          {t("distributor.productsTitle")}
        </h2>
        <span className="text-sm text-laku-muted">
          {t("distributor.productCount", {
            count: formatNumber(visible.length, t.locale),
          })}
        </span>
      </div>

      <div className="mb-5 overflow-hidden rounded-2xl bg-white">
        <nav
          aria-label={t("distributor.sortAria")}
          className="laku-rail flex gap-1 overflow-x-auto border-b border-laku-line px-2 sm:px-3"
        >
          {SORT_TABS.map((key) => {
            const active = sortKey === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSortKey(key)}
                className={`relative shrink-0 border-b-2 px-3 py-3 text-sm transition-colors ${
                  active
                    ? "border-laku-blue font-bold text-laku-blue"
                    : "border-transparent font-medium text-laku-muted hover:text-laku-ink"
                }`}
              >
                {t(`distributor.sort.${key}`)}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 border-b border-laku-line px-4 py-3">
          <label className="text-xs font-semibold text-laku-muted">
            {t("distributor.sort.category")}
          </label>
          <div className="relative">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="appearance-none rounded-lg border border-laku-line bg-white py-1.5 pl-3 pr-8 text-sm font-semibold text-laku-ink outline-none focus:border-laku-blue"
            >
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value === "all" ? t("distributor.sort.categoryAll") : value}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-laku-muted"
              aria-hidden
            />
          </div>
        </div>
      </div>

      {visible.length > 0 ? (
        <ProductGrid products={visible} />
      ) : (
        <div className="rounded-2xl bg-white px-5 py-12 text-center">
          <Package className="mx-auto size-10 text-laku-faint" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-laku-ink">
            {t("distributor.emptyProducts")}
          </p>
        </div>
      )}
    </section>
  );
}
