import { translateOr, type Translator } from "@/i18n/translate";
import type { Facet, MarketplaceProduct } from "@/lib/api/types";

/** lucide-react equivalents of the Ionicons used by CategoryBadge on mobile. */
export const CATEGORY_ICONS: Record<string, string> = {
  "Food & Beverage": "UtensilsCrossed",
  Technology: "Smartphone",
  Fashion: "Shirt",
  "Home & Garden": "Home",
  Sports: "Dumbbell",
  Beauty: "Flower2",
  Books: "BookOpen",
  Automotive: "Car",
  Health: "Stethoscope",
  Toys: "Gamepad2",
  Office: "Briefcase",
  Garden: "Leaf",
  Jewelry: "Gem",
  Music: "Music",
  Pets: "PawPrint",
  Travel: "Plane",
  Art: "Palette",
  Photography: "Camera",
  Gaming: "Gamepad2",
  Furniture: "Bed",
  Tools: "Wrench",
  Baby: "Baby",
  Outdoor: "Bike",
  Kitchen: "CookingPot",
  Bathroom: "Droplets",
  Bedroom: "Bed",
  "Living Room": "Tv",
  Dining: "UtensilsCrossed",
  Storage: "Archive",
  Lighting: "Lightbulb",
  Decor: "Flower2",
  Appliances: "Cpu",
  Cleaning: "SprayCan",
  Organization: "FolderOpen",
  Safety: "ShieldCheck",
};

/** Category names come from the database in English; unknown ones pass through. */
export function translateCategory(value: string | null | undefined, t: Translator): string {
  const key = (value ?? "").trim();
  if (!key) return "";
  return translateOr(t, `category.${key}`, key);
}

export function getCategoryIcon(name: string): string {
  return CATEGORY_ICONS[name] ?? "LayoutGrid";
}

export type BrowseCategory = {
  name: string;
  label: string;
  icon: string;
  count: number;
};

function toBrowseCategory(name: string, count: number, t: Translator): BrowseCategory {
  return { name, label: translateCategory(name, t), icon: getCategoryIcon(name), count };
}

/**
 * There is no category API. Mobile derives categories from loaded products;
 * on the web the API facets are richer, so prefer them and fall back to counting.
 */
export function buildCategories(
  facets: Facet[],
  products: MarketplaceProduct[],
  t: Translator,
  limit = 8,
): BrowseCategory[] {
  const usable = facets.filter(
    (facet) => facet.value && facet.value !== "Uncategorized" && facet.value !== "General",
  );

  if (usable.length > 0) {
    return usable
      .slice()
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((facet) => toBrowseCategory(facet.value, facet.count, t));
  }

  const counts = new Map<string, number>();
  for (const product of products) {
    const category = product.category;
    if (!category || category === "Uncategorized" || category === "General") continue;
    counts.set(category, (counts.get(category) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, count]) => toBrowseCategory(name, count, t));
}
