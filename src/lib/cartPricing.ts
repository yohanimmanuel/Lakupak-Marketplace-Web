import type { CartItem } from "@/lib/api/types";
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

/** Package price × qty using the cart line's stored variant (mobile math). */
export function getCartLineTotal(item: CartItem): number {
  const pieces = Number(item.productData?.piecesPerPackage) || 1;
  const { unitPrice } = resolveVariantPricing(
    item.productData,
    getCartVariant(item),
  );
  return unitPrice * pieces * getCartQuantity(item);
}
