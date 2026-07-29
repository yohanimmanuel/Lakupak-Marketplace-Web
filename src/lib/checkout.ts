import type { MarketplaceProduct } from "@/lib/api/types";
import { resolveVariantPricing } from "@/lib/variants";

/**
 * Delivery ids and their API strings are copied verbatim from the mobile
 * checkout: the Dashboard and the distributor console match on these exact
 * values, so they must not be localised. The copy shown to the buyer lives in
 * the dictionary under `delivery.<id>`, referenced here so call sites only need
 * `t(option.labelKey)`.
 */
export const DELIVERY_OPTIONS = [
  {
    id: "self_pickup",
    method: "Self Pickup",
    labelKey: "delivery.self_pickup.label",
    descriptionKey: "delivery.self_pickup.description",
  },
  {
    id: "seller_delivery",
    method: "Seller/Distributor Delivery",
    labelKey: "delivery.seller_delivery.label",
    descriptionKey: "delivery.seller_delivery.description",
  },
  {
    id: "buyer_courier",
    method: "Buyer-arranged Courier",
    labelKey: "delivery.buyer_courier.label",
    descriptionKey: "delivery.buyer_courier.description",
  },
] as const;

export type DeliveryOptionId = (typeof DELIVERY_OPTIONS)[number]["id"];

export type DeliveryOption = (typeof DELIVERY_OPTIONS)[number];

/** Payment terms are stored as free text; the pay screen matches on these words. */
export const PAYMENT_METHODS = [
  {
    id: "bank_transfer",
    terms: "Transfer bank",
    labelKey: "payment.bank_transfer.label",
    descriptionKey: "payment.bank_transfer.description",
  },
  {
    id: "cod",
    terms: "Cash on Delivery",
    labelKey: "payment.cod.label",
    descriptionKey: "payment.cod.description",
  },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

export function getPaymentTerms(id: PaymentMethodId): string {
  return PAYMENT_METHODS.find((method) => method.id === id)?.terms ?? "Cash on Delivery";
}

export function getDeliveryOption(id: string): DeliveryOption | undefined {
  return DELIVERY_OPTIONS.find((option) => option.id === id);
}

function supportsOption(product: MarketplaceProduct, id: DeliveryOptionId): boolean {
  const shipping = product.shipping;
  // Products without shipping preferences offer everything, as in the app.
  if (!shipping) return true;

  if (id === "self_pickup") return shipping.selfPickup?.available !== false;
  if (id === "seller_delivery") return shipping.sellerDelivery?.available !== false;
  return shipping.buyerCourier?.available !== false;
}

/**
 * One delivery choice covers the whole checkout, so only the options every
 * product supports are offered. Falls back to all options when the intersection
 * is empty rather than blocking the order.
 */
export function getAvailableDeliveryOptions(
  products: MarketplaceProduct[],
): DeliveryOption[] {
  if (products.length === 0) return [...DELIVERY_OPTIONS];

  const available = DELIVERY_OPTIONS.filter((option) =>
    products.every((product) => supportsOption(product, option.id)),
  );

  return available.length > 0 ? available : [...DELIVERY_OPTIONS];
}

export function getLeadTime(products: MarketplaceProduct[]): {
  minDays: number | null;
  maxDays: number | null;
} {
  const mins = products
    .map((product) => Number(product.shipping?.leadTimeMinDays))
    .filter((value) => Number.isFinite(value) && value > 0);
  const maxes = products
    .map((product) => Number(product.shipping?.leadTimeMaxDays))
    .filter((value) => Number.isFinite(value) && value > 0);

  return {
    minDays: mins.length > 0 ? Math.min(...mins) : null,
    maxDays: maxes.length > 0 ? Math.max(...maxes) : null,
  };
}

/** LKO-<timestamp><8 digits>; the API appends -<n> when it splits by seller. */
export function generateOrderId(): string {
  const random = Math.floor(10_000_000 + Math.random() * 90_000_000);
  return `LKO-${Date.now()}${random}`;
}

export function getSellerKey(product: MarketplaceProduct): string {
  return (
    product.seller?.company?.name?.trim() ||
    product.seller?.name?.trim() ||
    (product.userId != null ? `seller-${product.userId}` : "Distributor Laku")
  );
}

/** Package price for one unit of the ordered package type (variant-aware). */
export function getPackagePrice(
  product: MarketplaceProduct,
  variantName?: string | null,
): number {
  const pieces = Number(product.piecesPerPackage) || 1;
  const { unitPrice } = resolveVariantPricing(product, variantName);
  return unitPrice * pieces;
}

/** MOQ is stored in pieces; convert to the package floor the qty stepper uses. */
export function getMinPackageQuantity(
  product: MarketplaceProduct,
  variantName?: string | null,
): number {
  const pieces = Math.max(1, Number(product.piecesPerPackage) || 1);
  const { option } = resolveVariantPricing(product, variantName);
  const moq = Number(option?.moq ?? product.moq);
  if (!Number.isFinite(moq) || moq <= 0) return 1;
  return Math.max(1, Math.ceil(moq / pieces));
}

/** Max packages that still fit in stock pieces, matching the mobile selector. */
export function getMaxPackageQuantity(product: MarketplaceProduct): number {
  const pieces = Math.max(1, Number(product.piecesPerPackage) || 1);
  const stock = Math.max(0, Number(product.stock) || 0);
  if (stock <= 0) return 9999;
  return Math.max(1, Math.floor(stock / pieces));
}

export function meetsMoq(product: MarketplaceProduct, packageQuantity: number): boolean {
  const moq = Number(product.moq);
  if (!Number.isFinite(moq) || moq <= 0) return true;
  const pieces = Math.max(1, Number(product.piecesPerPackage) || 1);
  return packageQuantity * pieces >= moq;
}
