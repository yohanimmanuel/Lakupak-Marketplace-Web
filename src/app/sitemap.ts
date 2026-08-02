import type { MetadataRoute } from "next";

import { getProductsSafe } from "@/lib/api/marketplace";
import { canonicalizeCategory, PREDEFINED_CATEGORY_NAMES } from "@/lib/categories";
import { SITE_URL } from "@/lib/config";
import { productUrl } from "@/lib/share";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/categories`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/search`, changeFrequency: "daily", priority: 0.6 },
  ];

  const { products, facets } = await getProductsSafe({ limit: 100 });

  const facetNames = new Set(
    facets.productTypes
      .map((facet) => canonicalizeCategory(facet.value))
      .filter(Boolean),
  );
  const categoryNames =
    facetNames.size > 0
      ? PREDEFINED_CATEGORY_NAMES.filter((name) => facetNames.has(name))
      : PREDEFINED_CATEGORY_NAMES;

  const categoryRoutes: MetadataRoute.Sitemap = categoryNames.map((name) => ({
    url: `${SITE_URL}/search?category=${encodeURIComponent(name)}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}${productUrl(product.id)}`,
    lastModified: product.publishedAt ? new Date(product.publishedAt) : undefined,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
