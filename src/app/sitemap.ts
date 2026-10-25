import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/config";

export const revalidate = 3600;

/**
 * Product and search/category pages require a retailer session (closed catalog),
 * so only truly public routes are listed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
  ];
}
