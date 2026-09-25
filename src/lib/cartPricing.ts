import type { CartItem, MarketplaceProduct } from "@/lib/api/types";
import { resolveVariantPricing } from "@/lib/variants";

export function getCartQuantity(item: CartItem): number {
  const quantity = Number(item.metadata?.quantity);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

export function getCartVariant(item: CartItem): string {
  const variant = item.metadata?.variant?.trim();
  return variant || "Default";
}

export function isCartItemSelected(item: CartItem): boolean {
  return item.metadata?.selected !== false;
}

/**
 * Catalog base price × pieces × package quantity. Client rates are not
 * applied here; the distributor confirms the PO price after submission.
 */
export function getBaseLineTotal(
  product: MarketplaceProduct,
  variant: string | null | undefined,
  quantity: number,
): number {
  const pieces = Number(product?.piecesPerPackage) || 1;
  const { unitPrice } = resolveVariantPricing(product, variant);
  return unitPrice * pieces * quantity;
}

/** Package price × qty using the cart line's stored variant (mobile math). */
export function getCartLineTotal(item: CartItem): number {
  return getBaseLineTotal(item.productData, getCartVariant(item), getCartQuantity(item));
}
