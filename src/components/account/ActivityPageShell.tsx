import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";

import ProductGrid from "@/components/product/ProductGrid";
import SectionHeader from "@/components/ui/SectionHeader";
import { getTranslations } from "@/i18n/server";
import type { MarketplaceProduct } from "@/lib/api/types";

type Props = {
  title: string;
  subtitle: string;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyBody: string;
  suggestions: MarketplaceProduct[];
  children: React.ReactNode;
  isEmpty: boolean;
};

/** Shared chrome for favourites, recently viewed, and buy again. */
export default async function ActivityPageShell({
  title,
  subtitle,
  emptyIcon: EmptyIcon,
  emptyTitle,
  emptyBody,
  suggestions,
  children,
  isEmpty,
}: Props) {
  const t = await getTranslations();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <Link
        href="/account"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("profile.backToAccount")}
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-laku-ink">{title}</h1>
        <p className="mt-1 text-sm text-laku-muted">{subtitle}</p>
      </header>

      {isEmpty ? (
        <div className="rounded-2xl bg-white p-12 text-center">
          <EmptyIcon className="mx-auto size-10 text-[#d1d5db]" aria-hidden />
          <h2 className="mt-4 text-lg font-bold text-laku-ink">{emptyTitle}</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm/6 text-laku-muted">{emptyBody}</p>
          <Link
            href="/search"
            className="mt-6 inline-flex rounded-lg bg-laku-blue px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
          >
            {t("moreService.browse")}
          </Link>
        </div>
      ) : (
        children
      )}

      {suggestions.length > 0 ? (
        <section className="mt-12">
          <SectionHeader title={t("moreService.youMayAlsoLike")} href="/search" />
          <ProductGrid products={suggestions} />
        </section>
      ) : null}
    </div>
  );
}
