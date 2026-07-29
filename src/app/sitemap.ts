import type { MetadataRoute } from "next";

import { getProductsSafe } from "@/lib/api/marketplace";
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

  const categoryRoutes: MetadataRoute.Sitemap = facets.productTypes.map((facet) => ({
    url: `${SITE_URL}/search?category=${encodeURIComponent(facet.value)}`,
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
