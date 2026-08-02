import { translateOr, type Translator } from "@/i18n/translate";
import type { Facet, MarketplaceProduct } from "@/lib/api/types";

/**
 * Shopee-inspired wholesale taxonomy. Values are the English DB keys;
 * labels come from i18n `category.*`.
 */
export const CATEGORY_ICONS: Record<string, string> = {
  "Food & Beverages": "UtensilsCrossed",
  "Fresh Produce": "Apple",
  "Mobile & Gadgets": "Smartphone",
  "Computers & Peripherals": "Monitor",
  "Home Appliances": "Cpu",
  "Fashion & Apparel": "Shirt",
  "Muslim Fashion": "Moon",
  "Bags & Wallets": "ShoppingBag",
  "Sports & Outdoors": "Dumbbell",
  "Beauty & Personal Care": "Sparkles",
  "Health & Wellness": "Heart",
  "Pharmacy & Medical": "Pill",
  "Home & Living": "Home",
  "Household Supplies": "SprayCan",
  "Toys, Kids & Babies": "Baby",
  "Mom & Baby Care": "HeartHandshake",
  "Pet Supplies": "PawPrint",
  "Automotive & Motorbike": "Car",
  "Tools & Hardware": "Wrench",
  "Building Materials": "Hammer",
  "Industrial Supplies": "Factory",
  "Office & Stationery": "Briefcase",
  "Cameras & Drones": "Camera",
  "Video Games": "Gamepad2",
  "Hobbies & Books": "BookOpen",
  "Jewelry & Accessories": "Gem",
  Watches: "Watch",
  "Music & Audio": "Music",
  "Travel & Luggage": "Plane",
  Miscellaneous: "Boxes",
};

/** Legacy single-word / room-level productType values → new taxonomy. */
export const LEGACY_CATEGORY_MAP: Record<string, string> = {
  "Food & Beverage": "Food & Beverages",
  Technology: "Mobile & Gadgets",
  Fashion: "Fashion & Apparel",
  "Home & Garden": "Home & Living",
  Sports: "Sports & Outdoors",
  Beauty: "Beauty & Personal Care",
  Books: "Hobbies & Books",
  Automotive: "Automotive & Motorbike",
  Health: "Health & Wellness",
  Toys: "Toys, Kids & Babies",
  Office: "Office & Stationery",
  Garden: "Home & Living",
  Jewelry: "Jewelry & Accessories",
  Music: "Music & Audio",
  Pets: "Pet Supplies",
  Travel: "Travel & Luggage",
  Art: "Hobbies & Books",
  Photography: "Cameras & Drones",
  Gaming: "Video Games",
  Furniture: "Home & Living",
  Tools: "Tools & Hardware",
  Baby: "Toys, Kids & Babies",
  Outdoor: "Sports & Outdoors",
  Kitchen: "Home Appliances",
  Bathroom: "Home & Living",
  Bedroom: "Home & Living",
  "Living Room": "Home & Living",
  Dining: "Home & Living",
  Storage: "Home & Living",
  Lighting: "Home & Living",
  Decor: "Home & Living",
  Appliances: "Home Appliances",
  Cleaning: "Household Supplies",
  Organization: "Office & Stationery",
  Safety: "Industrial Supplies",
};

export function canonicalizeCategory(value: string | null | undefined): string {
  const key = (value ?? "").trim();
  if (!key) return "";
  return LEGACY_CATEGORY_MAP[key] ?? key;
}

/** Category names come from the database in English; unknown ones pass through. */
export function translateCategory(value: string | null | undefined, t: Translator): string {
  const key = canonicalizeCategory(value);
  if (!key) return "";
  return translateOr(t, `category.${key}`, key);
}

export function getCategoryIcon(name: string): string {
  return CATEGORY_ICONS[canonicalizeCategory(name)] ?? "LayoutGrid";
}

/** Stable list of predefined category English keys (search filters / directory). */
export const PREDEFINED_CATEGORY_NAMES: string[] = Object.keys(CATEGORY_ICONS);

export type BrowseCategory = {
  name: string;
  label: string;
  icon: string;
  count: number;
};

function toBrowseCategory(name: string, count: number, t: Translator): BrowseCategory {
  const canonical = canonicalizeCategory(name);
  return {
    name: canonical,
    label: translateCategory(canonical, t),
    icon: getCategoryIcon(canonical),
    count,
  };
}

/**
 * There is no category API. Mobile derives categories from loaded products;
 * on the web the API facets are richer, so prefer them and fall back to counting.
 * Legacy facet values are merged into their canonical names.
 */
export function buildCategories(
  facets: Facet[],
  products: MarketplaceProduct[],
  t: Translator,
  limit = 8,
): BrowseCategory[] {
  const merged = new Map<string, number>();

  const add = (raw: string, count: number) => {
    const name = canonicalizeCategory(raw);
    if (!name || name === "Uncategorized" || name === "General") return;
    merged.set(name, (merged.get(name) ?? 0) + count);
  };

  const usable = facets.filter(
    (facet) => facet.value && facet.value !== "Uncategorized" && facet.value !== "General",
  );

  if (usable.length > 0) {
    for (const facet of usable) add(facet.value, facet.count);
  } else {
    for (const product of products) {
      if (product.category) add(product.category, 1);
    }
  }

  return Array.from(merged.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => toBrowseCategory(name, count, t));
}

/**
 * Full Shopee-style directory: every predefined category, with live counts
 * when products exist. Keeps a stable, structured grid even for empty shelves.
 */
export function buildCategoryDirectory(
  facets: Facet[],
  products: MarketplaceProduct[],
  t: Translator,
): BrowseCategory[] {
  const counts = new Map<string, number>();

  const add = (raw: string, count: number) => {
    const name = canonicalizeCategory(raw);
    if (!name || name === "Uncategorized" || name === "General") return;
    counts.set(name, (counts.get(name) ?? 0) + count);
  };

  const usable = facets.filter(
    (facet) => facet.value && facet.value !== "Uncategorized" && facet.value !== "General",
  );

  if (usable.length > 0) {
    for (const facet of usable) add(facet.value, facet.count);
  } else {
    for (const product of products) {
      if (product.category) add(product.category, 1);
    }
  }

  return Object.keys(CATEGORY_ICONS).map((name) =>
    toBrowseCategory(name, counts.get(name) ?? 0, t),
  );
}
