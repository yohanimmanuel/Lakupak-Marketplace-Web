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
    parsePromotionDetails(item.promotionDetailsSnapshot),
    packageQuantity * piecesPerPackage,
    resolveOrderItemMoq(item),
  );

  return gift?.freeQty ?? 0;
}
