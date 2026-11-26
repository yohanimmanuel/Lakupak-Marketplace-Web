/**
 * Buy-X-get-Y free-item math, aligned with Laku-Marketplace/utils/promotionUtils.ts
 * and Lakupak-Dashboard/src/utils/promotionUtils.ts.
 *
 * Offer form stores X/Y in packages of the ordered stock level; convert to pieces
 * before applying from_zero / after_moq set math. MOQ is already in pieces.
 */

import type { MarketplaceProduct, PromotionDetails } from "@/lib/api/types";

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

/** Resolve product MOQ into pieces for the ordered stock level. */
export function resolveMoqInPieces(opts: {
  packageType?: string | null;
  piecesPerPackage: number;
  moqPieces?: number | null;
  moqByStockLevel?: Record<string, number> | null;
}): number | null {
  const piecesPerPackage = Math.max(1, Math.trunc(Number(opts.piecesPerPackage) || 1));
  const level = String(opts.packageType || "").trim();
  const byLevel = opts.moqByStockLevel;
  if (level && level.toLowerCase() !== "pieces" && byLevel && typeof byLevel === "object") {
    const levelMoq = Number(byLevel[level]);
    if (Number.isFinite(levelMoq) && levelMoq > 0) {
      return Math.trunc(levelMoq) * piecesPerPackage;
    }
  }
  const piecesMoq = opts.moqPieces;
  if (piecesMoq != null && Number.isFinite(Number(piecesMoq)) && Number(piecesMoq) > 0) {
    return Math.trunc(Number(piecesMoq));
  }
  return null;
}

/**
 * Calculate promotion free items (PIECE-BASED SYSTEM).
 * Callers must pass minQuantity / freeQuantity / moq already in pieces.
 */
export function calculatePromotionGift(
  promotionDetails: PromotionDetails | null | undefined,
  quantityInPieces: number,
  moq: number | null | undefined,
): PromotionGift | null {
  if (!promotionDetails) return null;

  const minQty = Math.max(1, Math.trunc(promotionDetails.minQuantity || 1));
  const freeQty = Math.max(0, Math.trunc(promotionDetails.freeQuantity || 0));
  const applyMode = normalizeApplyMode(promotionDetails.applyMode);
  const qty = Math.max(0, Math.trunc(quantityInPieces || 0));
  if (freeQty <= 0 || qty <= 0) return null;

  if (applyMode === "from_zero" || moq === null || moq === undefined) {
    const completeSets = Math.floor(qty / minQty);
    const totalFreeItems = completeSets * freeQty;
    if (totalFreeItems > 0) {
      return {
        freeQty: totalFreeItems,
        totalReceived: qty + totalFreeItems,
      };
    }
    return null;
  }

  const moqPieces = Math.max(0, Math.trunc(moq));
  if (qty < moqPieces) return null;

  const quantityAboveMOQ = qty - moqPieces;
  const completeSets = Math.floor(quantityAboveMOQ / minQty);
  const totalFreeItems = completeSets * freeQty;

  if (totalFreeItems > 0) {
    return {
      freeQty: totalFreeItems,
      totalReceived: qty + totalFreeItems,
    };
  }

  return null;
}

/**
 * Order / product helpers: offer X/Y are packages → convert to pieces with piecesPerPackage.
 */
export function calculateOrderItemPromotion(
  promotionDetails: PromotionDetails | string | null | undefined,
  quantityInPackages: number,
  piecesPerPackage: number,
  moq: number | null | undefined,
): PromotionGift | null {
  const parsedPromotionDetails = normalizePromotionSnapshot(promotionDetails);
  if (!parsedPromotionDetails) return null;

  const ppp = Math.max(1, Math.trunc(Number(piecesPerPackage) || 1));
  const packages = Math.max(0, Number(quantityInPackages) || 0);
  const totalPieces = Math.trunc(packages * ppp);

  const moqPieces =
    parsedPromotionDetails.moq != null && Number(parsedPromotionDetails.moq) > 0
      ? Math.trunc(Number(parsedPromotionDetails.moq))
      : moq != null && Number(moq) > 0
        ? Math.trunc(Number(moq))
        : null;

  const piecePromotion: PromotionDetails = {
    ...parsedPromotionDetails,
    minQuantity: Math.max(1, Math.trunc(parsedPromotionDetails.minQuantity || 1)) * ppp,
    freeQuantity: Math.max(0, Math.trunc(parsedPromotionDetails.freeQuantity || 0)) * ppp,
  };

  return calculatePromotionGift(piecePromotion, totalPieces, moqPieces);
}

/**
 * Approved order-line promotion context. This is never populated from a
 * public product catalog response: private buyer rates remain distributor-only.
 */
export type ApprovedPromotionContext = {
  promotionDetails: PromotionDetails | null;
  variantOptionId: number | null;
  selectedVariantOptionId: number | null;
  eligibleStockLevels: string[] | null;
  stockLevelName: string;
  piecesPerPackage: number;
  moq?: number | null;
};

/** Existing live preview entry point, gated by approved order-line data. */
export function calculateProductPromotionGift(
  product: MarketplaceProduct | null | undefined,
  quantityInPackages: number,
  moq: number | null | undefined,
  approved?: ApprovedPromotionContext | null,
): PromotionGift | null {
  if (!product || !approved?.promotionDetails || quantityInPackages <= 0) return null;
  if (
    approved.variantOptionId != null &&
    approved.variantOptionId !== approved.selectedVariantOptionId
  ) {
    return null;
  }
  if (
    approved.eligibleStockLevels !== null &&
    !approved.eligibleStockLevels.includes(approved.stockLevelName)
  ) {
    return null;
  }
  const piecesPerPackage = Number(approved.piecesPerPackage);
  if (!Number.isFinite(piecesPerPackage) || piecesPerPackage <= 0) return null;
  return calculateOrderItemPromotion(
    approved.promotionDetails,
    quantityInPackages,
    piecesPerPackage,
    approved.moq ?? moq,
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

  const gift = calculateOrderItemPromotion(
    normalizePromotionSnapshot(item.promotionDetailsSnapshot),
    packageQuantity,
    piecesPerPackage,
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
      showPriceDiscount &&
      !(Number.isFinite(percent) && percent > 0) &&
      Number.isFinite(amount) &&
      amount > 0
        ? amount
        : null,
    originalLineTotal: showPriceDiscount ? originalLineTotal : null,
  };
}
