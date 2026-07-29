"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Clock, Store, Tag, X } from "lucide-react";

import { useTranslations } from "@/i18n/client";
import { translateCategory } from "@/lib/categories";
import {
  clearRecentSearches,
  readRecentSearches,
  type PopularCategory,
  type TopBrand,
  type TopDistributor,
} from "@/lib/searchDiscovery";

type Props = {
  brands: TopBrand[];
  distributors: TopDistributor[];
  categories: PopularCategory[];
};

export default function SearchDiscovery({
  brands,
  distributors,
  categories,
}: Props) {
  const t = useTranslations();
  const [recent, setRecent] = useState(() => readRecentSearches());

  return (
    <div className="space-y-6">
      {recent.length > 0 ? (
        <section className="rounded-2xl bg-white p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-laku-ink">
              <Clock className="size-4 text-laku-blue" aria-hidden />
              {t("search.recentSearches")}
            </h2>
            <button
              type="button"
              onClick={() => {
                clearRecentSearches();
                setRecent([]);
              }}
              className="text-xs font-semibold text-laku-blue hover:underline"
            >
              {t("search.clearRecent")}
            </button>
          </div>
          <ul className="flex flex-wrap gap-2">
            {recent.map((query) => (
              <li key={query} className="inline-flex items-center gap-1">
                <Link
                  href={`/search?q=${encodeURIComponent(query)}`}
                  className="rounded-lg border border-laku-line px-3 py-1.5 text-sm font-semibold text-laku-ink transition-colors hover:border-laku-blue hover:text-laku-blue"
                >
                  {query}
                </Link>
                <button
                  type="button"
                  aria-label={t("search.removeRecent")}
                  onClick={() => {
                    const next = recent.filter((item) => item !== query);
                    setRecent(next);
                    try {
                      window.localStorage.setItem(
                        "laku_search_recent",
                        JSON.stringify(next),
                      );
                    } catch {
                      // ignore
                    }
                  }}
                  className="rounded p-1 text-laku-faint hover:bg-laku-surface hover:text-laku-ink"
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {categories.length > 0 ? (
        <section className="rounded-2xl bg-white p-5">
          <h2 className="mb-3 text-sm font-bold text-laku-ink">
            {t("search.popularCategories")}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <li key={item.name}>
                <Link
                  href={`/search?q=${encodeURIComponent(translateCategory(item.name, t))}&category=${encodeURIComponent(item.name)}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-laku-line px-3 py-1.5 text-sm font-semibold text-laku-ink transition-colors hover:border-laku-blue hover:text-laku-blue"
                >
                  <Tag className="size-3.5 text-laku-muted" aria-hidden />
                  {translateCategory(item.name, t)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {brands.length > 0 ? (
        <section className="rounded-2xl bg-white p-5">
          <h2 className="mb-3 text-sm font-bold text-laku-ink">
            {t("search.topBrands")}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {brands.map((brand) => (
              <li key={brand.name}>
                <Link
                  href={`/search?q=${encodeURIComponent(brand.name)}`}
                  className="rounded-lg border border-laku-line px-3 py-1.5 text-sm font-semibold text-laku-ink transition-colors hover:border-laku-blue hover:text-laku-blue"
                >
                  {brand.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {distributors.length > 0 ? (
        <section className="rounded-2xl bg-white p-5">
          <h2 className="mb-3 text-sm font-bold text-laku-ink">
            {t("search.topDistributors")}
          </h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {distributors.map((item) => (
              <li key={item.name}>
                <Link
                  href={
                    item.id
                      ? `/distributor/${item.id}`
                      : `/search?q=${encodeURIComponent(item.name)}`
                  }
                  className="flex items-center gap-3 rounded-xl border border-laku-line px-3 py-2.5 transition-colors hover:border-laku-blue"
                >
                  <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-laku-blue/10 text-laku-blue">
                    {item.logo ? (
                      <Image
                        src={item.logo}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <Store className="size-4" aria-hidden />
                    )}
                  </span>
                  <span className="truncate text-sm font-semibold text-laku-ink">
                    {item.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
