import type { Metadata } from "next";

import CategoryRail from "@/components/category/CategoryRail";
import ProductGrid from "@/components/product/ProductGrid";
import SectionHeader from "@/components/ui/SectionHeader";
import { getTranslations } from "@/i18n/server";
import { getProductsSafe } from "@/lib/api/marketplace";
import { buildCategories } from "@/lib/categories";

export const revalidate = 120;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("categories.title"),
    description: t("categories.description"),
    alternates: { canonical: "/categories" },
  };
}

export default async function CategoriesPage() {
  const t = await getTranslations();
  const { products, facets } = await getProductsSafe({ limit: 20 });
  const categories = buildCategories(facets.productTypes, products, t, 24);

  return (
    <div className="mx-auto max-w-7xl space-y-12 py-10 md:px-6">
      <section>
        <SectionHeader title={t("categories.browseByCategory")} />
        <div className="px-4 md:px-0">
          <CategoryRail categories={categories} layout="grid" />
        </div>
      </section>

      <section>
        <SectionHeader
          title={t("categories.newThisWeek")}
          href="/search"
          linkLabel={t("common.viewAllLower")}
        />
        <div className="px-4 md:px-0">
          {products.length > 0 ? (
            <ProductGrid products={products} priorityCount={5} />
          ) : (
            <p className="rounded-card bg-white p-8 text-center text-sm text-laku-muted">
              {t("categories.empty")}
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
