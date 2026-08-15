import type {
  MarketplaceProduct,
  ProductVariantDefinition,
  ProductVariantOption,
} from "@/lib/api/types";

function normKey(key: string): string {
  return String(key ?? "").trim().toLowerCase();
}

function normVal(value: string): string {
  return String(value ?? "").trim();
}

function parseOptions(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function normalizeVariantDefinitions(
  raw?: unknown[] | null,
): ProductVariantDefinition[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((item, index) => {
      const row = item as {
        id?: number;
        variantType?: string;
        options?: unknown;
      };
      const variantType = String(row.variantType ?? "").trim();
      if (!variantType) return null;
      return {
        id: Number(row.id) || index + 1,
        variantType,
        options: parseOptions(row.options),
      };
    })
    .filter((item): item is ProductVariantDefinition => item != null)
    .filter((item) => item.options.length > 0);
}

export function normalizeVariantOptions(
  raw?: unknown[] | null,
): ProductVariantOption[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((item) => {
    const row = item as ProductVariantOption;
    return {
      id: Number(row.id) || 0,
      sku: row.sku ?? null,
      sellingPrice: Number(row.sellingPrice) || 0,
      originalSellingPrice: Number(row.originalSellingPrice) || null,
      moq: row.moq ?? null,
      stockQuantity: Number(row.stockQuantity) || 0,
      lowStockThreshold: Number(row.lowStockThreshold) || 0,
      stockStatus: row.stockStatus ?? "In Stock",
      attributes:
        row.attributes && typeof row.attributes === "object"
          ? (row.attributes as Record<string, string>)
          : {},
      isDefault: Boolean(row.isDefault),
      isActive: row.isActive !== false,
    };
  });
}

export function matchesVariantAttributes(
  optionAttrs: Record<string, string> | null | undefined,
  selected: Record<string, string>,
): boolean {
  if (!optionAttrs) return false;

  const optionKeys = Object.keys(optionAttrs).map(normKey);
  const selectedKeys = Object.keys(selected).map(normKey);
  if (selectedKeys.length > 0 && optionKeys.length !== selectedKeys.length) {
    return false;
  }

  return Object.entries(selected).every(([selKey, selVal]) => {
    const kNorm = normKey(selKey);
    const vNorm = normVal(selVal);
    const direct = optionAttrs[selKey];
    if (direct != null && normVal(direct) === vNorm) return true;

    const matchingKey = Object.keys(optionAttrs).find((key) => normKey(key) === kNorm);
    if (!matchingKey) return false;
    return normVal(optionAttrs[matchingKey]) === vNorm;
  });
}

export function initialVariantSelection(
  definitions: ProductVariantDefinition[],
  options: ProductVariantOption[],
): Record<string, string> {
  const defaults = options.find((option) => option.isDefault) ?? options[0];
  if (defaults?.attributes && Object.keys(defaults.attributes).length > 0) {
    const selection: Record<string, string> = {};
    for (const definition of definitions) {
      const matchKey = Object.keys(defaults.attributes).find(
        (key) => normKey(key) === normKey(definition.variantType),
      );
      if (matchKey) selection[definition.variantType] = String(defaults.attributes[matchKey]);
      else if (definition.options[0]) selection[definition.variantType] = definition.options[0];
    }
    return selection;
  }

  const selection: Record<string, string> = {};
  for (const definition of definitions) {
    if (definition.options[0]) selection[definition.variantType] = definition.options[0];
  }
  return selection;
}

export function findSelectedVariantOption(
  product: MarketplaceProduct,
  selected: Record<string, string>,
): ProductVariantOption | null {
  const options = product.variantOptions ?? [];
  if (options.length === 0) return null;

  const matched = options.find((option) =>
    matchesVariantAttributes(option.attributes, selected),
  );
  return matched ?? options.find((option) => option.isDefault) ?? options[0] ?? null;
}

export function formatVariantName(
  selected: Record<string, string>,
  option?: ProductVariantOption | null,
): string {
  if (option?.attributes && Object.keys(option.attributes).length > 0) {
    return Object.entries(option.attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(", ");
  }
  const entries = Object.entries(selected);
  if (entries.length === 0) return "Default";
  return entries.map(([key, value]) => `${key}: ${value}`).join(", ");
}

/** Parses "Units: Boxes, Flavour: Soto" into attribute map (mobile checkout). */
export function parseVariantNameToAttributes(
  variantName: string | null | undefined,
): Record<string, string> {
  const raw = String(variantName ?? "").trim();
  if (!raw || raw.toLowerCase() === "default") return {};

  const attrs: Record<string, string> = {};
  for (const part of raw.split(",")) {
    const piece = part.trim();
    if (!piece) continue;
    const [key, ...valueParts] = piece.split(":");
    const k = key?.trim();
    const v = valueParts.join(":").trim();
    if (!k || !v) continue;
    attrs[k] = v;
  }
  return attrs;
}

export function selectVariantOptionByVariantName(
  product: MarketplaceProduct,
  variantName: string | null | undefined,
): ProductVariantOption | null {
  const options = product.variantOptions ?? [];
  if (options.length === 0) return null;

  const selected = parseVariantNameToAttributes(variantName);
  const matched =
    Object.keys(selected).length > 0
      ? (options.find((option) =>
          matchesVariantAttributes(option.attributes, selected),
        ) ?? null)
      : null;

  return matched ?? options.find((option) => option.isDefault) ?? options[0] ?? null;
}

/** Live selling price for the currently selected variant, falling back to the product. */
export function getSelectedUnitPrice(
  product: MarketplaceProduct,
  option: ProductVariantOption | null,
): number {
  const fromOption = Number(option?.sellingPrice);
  if (Number.isFinite(fromOption) && fromOption > 0) return fromOption;
  return Number(product.sellingPrice) || 0;
}

/**
 * Resolve unit price for a cart/checkout line from the stored variant name
 * (same as mobile resolveVariantPricing).
 */
export function resolveVariantPricing(
  product: MarketplaceProduct,
  variantName?: string | null,
): {
  option: ProductVariantOption | null;
  unitPrice: number;
  originalPrice: number;
  variantOptionId?: number;
} {
  if (product.variantOptions && product.variantOptions.length > 0) {
    const option = selectVariantOptionByVariantName(product, variantName);
    const unitPrice = getSelectedUnitPrice(product, option);
    const original = Number(option?.originalSellingPrice);
    return {
      option,
      unitPrice,
      originalPrice: Number.isFinite(original) && original > 0 ? original : unitPrice,
      variantOptionId: option?.id,
    };
  }

  const unitPrice = Number(product.sellingPrice) || 0;
  const original = Number(product.originalSellingPrice);
  return {
    option: null,
    unitPrice,
    originalPrice: Number.isFinite(original) && original > 0 ? original : unitPrice,
  };
}

export function getSelectedMoq(
  product: MarketplaceProduct,
  option: ProductVariantOption | null,
): number | null {
  // Prefer the matched variant’s own MOQ — never fall back to product.moq
  // (that is the default variant and can look like the “highest” MOQ).
  if (option) {
    const fromOption = Number(option.moq);
    return Number.isFinite(fromOption) && fromOption > 0 ? fromOption : null;
  }
  const fromProduct = Number(product.moq);
  return Number.isFinite(fromProduct) && fromProduct > 0 ? fromProduct : null;
}

export function getSelectedStock(
  product: MarketplaceProduct,
  option: ProductVariantOption | null,
): number {
  if (option) return Math.max(0, Number(option.stockQuantity) || 0);
  return Math.max(0, Number(product.stock) || 0);
}

/** Prefer stored status; fall back to qty + threshold (same rules as mobile Buy Now). */
export function getSelectedStockStatus(
  product: MarketplaceProduct,
  option: ProductVariantOption | null,
): "In Stock" | "Low Stock" | "Out of Stock" {
  const stock = getSelectedStock(product, option);
  if (stock <= 0) return "Out of Stock";

  const stored = String(
    option?.stockStatus ?? product.stockStatus ?? "",
  ).trim();
  if (
    stored === "Out of Stock" ||
    stored === "Low Stock" ||
    stored === "In Stock"
  ) {
    return stored;
  }

  const threshold = Math.max(
    0,
    Number(option?.lowStockThreshold) || 0,
  );
  if (threshold > 0 && stock <= threshold) return "Low Stock";
  return "In Stock";
}
