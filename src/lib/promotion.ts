/**
 * Buy-X-get-Y free-item math, aligned with Laku-Marketplace/utils/promotionUtils.ts.
 * Quantities are piece-based for calculation; the UI never labels them as "pcs".
 */

import type { MarketplaceProduct, PromotionDetails } from "@/lib/api/types";
import { getPromotion } from "@/lib/format";

export type PromotionGift = {
  freeQty: number;
  totalReceived: number;
};

function normalizeApplyMode(mode?: string | null): "from_zero" | "after_moq" {
  return mode === "from_zero" ? "from_zero" : "after_moq";
}

export function parsePromotionDetails(
  raw: PromotionDetails | string | null | undefined,
): PromotionDetails | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as PromotionDetails;
    } catch {
      return null;
    }
  }
  return raw;
}

/** Use buyQuantity as the buy threshold when the snapshot omitted minQuantity. */
function normalizePromotionSnapshot(
  raw: PromotionDetails | string | null | undefined,
): PromotionDetails | null {
  const parsed = parsePromotionDetails(raw);
  if (!parsed) return null;

  const record = parsed as PromotionDetails & { buyQuantity?: number };
  const minQuantity = Number(record.minQuantity);
  if (Number.isFinite(minQuantity) && minQuantity > 0) return parsed;

  const buyQuantity = Number(record.buyQuantity);
  if (!(Number.isFinite(buyQuantity) && buyQuantity > 0)) return parsed;

  return { ...parsed, minQuantity: buyQuantity };
}

/**
 * @param quantityInPieces - Ordered quantity in pieces
 * @param moq - MOQ in pieces (null = treat as from_zero / no MOQ gate)
 */
export function calculatePromotionGift(
  promotionDetails: PromotionDetails | null | undefined,
  quantityInPieces: number,
  moq: number | null | undefined,
): PromotionGift | null {
  if (!promotionDetails) return null;

  const minQty = promotionDetails.minQuantity || 1;
  const freeQty = promotionDetails.freeQuantity || 0;
  const applyMode = normalizeApplyMode(promotionDetails.applyMode);

  if (applyMode === "from_zero" || moq == null) {
    const completeSets = Math.floor(quantityInPieces / minQty);
    const totalFreeItems = completeSets * freeQty;
    if (totalFreeItems > 0) {
      return {
        freeQty: totalFreeItems,
        totalReceived: quantityInPieces + totalFreeItems,
      };
    }
    return null;
  }

  if (quantityInPieces < moq) return null;

  const quantityAboveMOQ = quantityInPieces - moq;
  const completeSets = Math.floor(quantityAboveMOQ / minQty);
  const totalFreeItems = completeSets * freeQty;

  if (totalFreeItems > 0) {
    return {
      freeQty: totalFreeItems,
      totalReceived: quantityInPieces + totalFreeItems,
    };
  }

  return null;
}

/** Live cart/PDP/checkout: packages × piecesPerPackage, with variant MOQ. */
export function calculateProductPromotionGift(
  product: MarketplaceProduct | null | undefined,
  quantityInPackages: number,
  moq: number | null | undefined,
): PromotionGift | null {
  const promotion = product ? getPromotion(product) : null;
  if (!promotion || quantityInPackages <= 0) return null;

  const piecesPerPackage = Math.max(1, Number(product?.piecesPerPackage) || 1);
  return calculatePromotionGift(
    promotion,
    quantityInPackages * piecesPerPackage,
    moq,
  );
}

export type OrderItemPromotionSource = {
  packageQuantity?: number | null;
  piecesPerPackage?: number | null;
  promotionDetailsSnapshot?: string | null;
  moqSnapshot?: number | null;
};

export function resolveOrderItemMoq(item: OrderItemPromotionSource): number | null {
  if (item.moqSnapshot != null && item.moqSnapshot > 0) return item.moqSnapshot;

  const parsed = parsePromotionDetails(item.promotionDetailsSnapshot);
  const moq = Number((parsed as { moq?: number } | null)?.moq);
  return Number.isFinite(moq) && moq > 0 ? moq : null;
}

export function getOrderItemFreeQuantity(item: OrderItemPromotionSource): number {
  const packageQuantity =
    item.packageQuantity && item.packageQuantity > 0 ? item.packageQuantity : 1;
  const piecesPerPackage =
    item.piecesPerPackage && item.piecesPerPackage > 0 ? item.piecesPerPackage : 1;

  const gift = calculatePromotionGift(
    normalizePromotionSnapshot(item.promotionDetailsSnapshot),
    packageQuantity * piecesPerPackage,
    resolveOrderItemMoq(item),
  );

  return gift?.freeQty ?? 0;
}

export type OrderOfferLine = OrderItemPromotionSource & {
  pricePerPackage?: number | null;
  subtotal?: number | null;
  originalPriceSnapshot?: number | null;
  discountPercentage?: number | null;
  discountAmount?: number | null;
};

export type OrderOfferDisplay = {
  buy: number | null;
  free: number | null;
  freePieces: number;
  percentOff: number | null;
  amountOff: number | null;
  originalLineTotal: number | null;
};

/** Promo rule and price discount saved on the order line, for buyer order screens. */
export function getOrderOfferDisplay(item: OrderOfferLine): OrderOfferDisplay {
  const parsed = normalizePromotionSnapshot(item.promotionDetailsSnapshot);
  const buyRaw = Number(parsed?.minQuantity || 0);
  const freeRaw = Number(parsed?.freeQuantity || 0);
  const hasPromo = buyRaw > 0 && freeRaw > 0;

  const pieces = Math.max(1, Number(item.piecesPerPackage) || 1);
  const qty = Math.max(1, Number(item.packageQuantity) || 1);
  const originalUnit = Number(item.originalPriceSnapshot) || 0;
  const originalLineTotal = originalUnit > 0 ? originalUnit * pieces * qty : 0;
  const subtotalValue = Number(item.subtotal);
  const unitPrice = Number(item.pricePerPackage);
  // A zero subtotal is still pending. Fall back to the unit price only when
  // the subtotal was never set and a current price is already known.
  const currentLine =
    item.subtotal != null && Number.isFinite(subtotalValue) && subtotalValue > 0
      ? subtotalValue
      : item.subtotal == null && Number.isFinite(unitPrice) && unitPrice > 0
        ? unitPrice * qty
        : null;
  const showPriceDiscount =
    currentLine != null && originalLineTotal > currentLine + 0.01;
  const percent = Number(item.discountPercentage);
  const amount = Number(item.discountAmount);

  return {
    buy: hasPromo ? buyRaw : null,
    free: hasPromo ? freeRaw : null,
    freePieces: getOrderItemFreeQuantity(item),
    percentOff: showPriceDiscount && Number.isFinite(percent) && percent > 0 ? percent : null,
    amountOff:
      showPriceDiscount && !(Number.isFinite(percent) && percent > 0) && Number.isFinite(amount) && amount > 0
        ? amount
        : null,
    originalLineTotal: showPriceDiscount ? originalLineTotal : null,
  };
}
