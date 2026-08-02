import type { MarketplaceProduct } from "@/lib/api/types";
import { canonicalizeCategory } from "@/lib/categories";

export type ShippingOptionKey = "selfPickup" | "sellerDelivery" | "buyerCourier";

export type TopBrand = { name: string };
export type TopDistributor = { name: string; logo: string; id?: number };
export type PopularCategory = { name: string; count: number };

/** Prefer city-like segment from address; GraphQL shippingInfo.location is often "Indonesia". */
export function productShippedFrom(product: MarketplaceProduct): string {
  const addr =
    product.seller?.company?.pickupAddress?.trim() ||
    product.seller?.company?.businessAddress?.trim() ||
    "";
  if (addr) {
    const parts = addr
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      // Usually …, City, Province/Country — pick the city-ish segment.
      return parts[parts.length - 2] || parts[0];
    }
    if (parts[0]) return parts[0];
  }
  return product.shippingInfo?.location?.trim() || "";
}

export function productSupportsShipping(
  product: MarketplaceProduct,
  key: ShippingOptionKey,
): boolean {
  const shipping = product.shipping;
  if (!shipping) return false;
  if (key === "selfPickup") return shipping.selfPickup?.available !== false;
  if (key === "sellerDelivery") return shipping.sellerDelivery?.available !== false;
  return shipping.buyerCourier?.available !== false;
}

export function uniqueShippedFromOptions(products: MarketplaceProduct[]): string[] {
  const set = new Set<string>();
  for (const product of products) {
    const loc = productShippedFrom(product);
    if (loc) set.add(loc);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function availableShippingOptionKeys(
  products: MarketplaceProduct[],
): ShippingOptionKey[] {
  const keys: ShippingOptionKey[] = ["selfPickup", "sellerDelivery", "buyerCourier"];
  return keys.filter((key) =>
    products.some((product) => productSupportsShipping(product, key)),
  );
}

export function generateTopBrands(
  products: MarketplaceProduct[],
  limit = 8,
): TopBrand[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    const brand = product.brand?.trim();
    if (!brand || brand === "N/A" || brand === "Unknown") continue;
    counts.set(brand, (counts.get(brand) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name]) => ({ name }));
}

export function generateTopDistributors(
  products: MarketplaceProduct[],
  limit = 8,
): TopDistributor[] {
  const map = new Map<string, { count: number; logo: string; id?: number }>();
  for (const product of products) {
    const name =
      product.seller?.company?.name?.trim() || product.seller?.name?.trim();
    if (!name || name === "N/A") continue;
    const current = map.get(name) ?? {
      count: 0,
      logo: product.seller?.company?.logo?.trim() || product.seller?.avatar?.trim() || "",
      id: product.userId ?? undefined,
    };
    current.count += 1;
    if (!current.logo) {
      current.logo =
        product.seller?.company?.logo?.trim() ||
        product.seller?.avatar?.trim() ||
        "";
    }
    if (current.id == null && product.userId != null) current.id = product.userId;
    map.set(name, current);
  }
  return [...map.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([name, data]) => ({ name, logo: data.logo, id: data.id }));
}

export function generatePopularCategories(
  products: MarketplaceProduct[],
  limit = 8,
): PopularCategory[] {
  const counts = new Map<string, number>();
  for (const product of products) {
    const category = canonicalizeCategory(product.category);
    if (!category || category === "Uncategorized" || category === "General") continue;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => ({ name, count }));
}

const RECENT_KEY = "laku_search_recent";
const RECENT_MAX = 10;

export function readRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed)
      ? parsed.map(String).filter(Boolean).slice(0, RECENT_MAX)
      : [];
  } catch {
    return [];
  }
}

export function pushRecentSearch(query: string): void {
  if (typeof window === "undefined") return;
  const q = query.trim().toLowerCase();
  if (!q) return;
  const next = [q, ...readRecentSearches().filter((item) => item !== q)].slice(
    0,
    RECENT_MAX,
  );
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // ignore quota errors
  }
}

export function clearRecentSearches(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(RECENT_KEY);
  } catch {
    // ignore
  }
}
