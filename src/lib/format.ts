import { intlLocale, type Locale } from "@/i18n/config";
import type { Translator } from "@/i18n/translate";
import type { MarketplaceProduct } from "@/lib/api/types";

/** Prices are always Rupiah; only the grouping follows the reader's locale. */
export function formatCurrency(amount: number, locale: Locale = "id"): string {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export type PriceRange = { min: number; max: number; hasRange: boolean };

function emptyRange(): PriceRange {
  return { min: 0, max: 0, hasRange: false };
}

function rangeFromPrices(prices: number[]): PriceRange {
  if (prices.length === 0) return emptyRange();
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { min, max, hasRange: min !== max };
}

function formatRangeOrSingle(range: PriceRange, locale: Locale): string {
  if (range.min <= 0) return "";
  if (range.hasRange) {
    return `${formatCurrency(range.min, locale)} – ${formatCurrency(range.max, locale)}`;
  }
  return formatCurrency(range.min, locale);
}

/**
 * Selling price span across variant options (mobile ProductMarketplace getPriceRange).
 * When the offer is inactive, prefers each option's originalSellingPrice.
 */
export function getProductPriceRange(product: MarketplaceProduct): PriceRange {
  const options = product.variantOptions;
  if (!options?.length) return emptyRange();

  const hasActiveOffer = product.hasActiveOffer === true;
  const prices = options
    .map((option) => {
      if (!hasActiveOffer) {
        const original = Number(option.originalSellingPrice);
        if (Number.isFinite(original) && original > 0) return original;
      }
      const price = Number(option.sellingPrice);
      return Number.isFinite(price) ? price : 0;
    })
    .filter((price) => price > 0);

  return rangeFromPrices(prices);
}

/** Original (pre-discount) span across variant options. */
export function getProductOriginalPriceRange(
  product: MarketplaceProduct,
): PriceRange {
  const options = product.variantOptions;
  if (!options?.length) return emptyRange();

  const prices = options
    .map((option) => {
      const price = Number(option.originalSellingPrice);
      return Number.isFinite(price) ? price : 0;
    })
    .filter((price) => price > 0);

  return rangeFromPrices(prices);
}

/** Card / PDP selling price: "Rp X – Rp Y" when variants differ, else a single price. */
export function formatProductPrice(
  product: MarketplaceProduct,
  locale: Locale = "id",
): string {
  const priceRange = getProductPriceRange(product);
  if (priceRange.hasRange) return formatRangeOrSingle(priceRange, locale);
  if (priceRange.min > 0) return formatCurrency(priceRange.min, locale);

  if (!product.hasActiveOffer) {
    const originalRange = getProductOriginalPriceRange(product);
    const fromVariants = formatRangeOrSingle(originalRange, locale);
    if (fromVariants) return fromVariants;
    const original = Number(product.originalSellingPrice) || 0;
    if (original > 0) return formatCurrency(original, locale);
  }

  return formatCurrency(product.sellingPrice, locale);
}

/** Strikethrough price: range when originals differ across variants. */
export function formatProductOriginalPrice(
  product: MarketplaceProduct,
  locale: Locale = "id",
): string {
  const fromVariants = formatRangeOrSingle(
    getProductOriginalPriceRange(product),
    locale,
  );
  if (fromVariants) return fromVariants;

  const original = Number(product.originalSellingPrice) || 0;
  return original > 0 ? formatCurrency(original, locale) : "";
}

export function formatNumber(value: number, locale: Locale = "id"): string {
  return new Intl.NumberFormat(intlLocale(locale)).format(value);
}

export function formatDate(value?: string | null, locale: Locale = "id"): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "medium" }).format(date);
}

/** Relative dates for product-panel review rows (mobile ProductMarketplace). */
export function formatRelativeReviewDate(
  value: string,
  t: Translator,
): string {
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t("product.relativeTime.recently");

    const diffDays = Math.floor(
      (Date.now() - date.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (diffDays <= 0) return t("product.relativeTime.today");
    if (diffDays === 1) return t("product.relativeTime.yesterday");
    if (diffDays < 7) {
      return t("product.relativeTime.daysAgo", { count: diffDays });
    }
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return weeks === 1
        ? t("product.relativeTime.weekAgo")
        : t("product.relativeTime.weeksAgo", { count: weeks });
    }
    return formatDate(value, t.locale);
  } catch {
    return t("product.relativeTime.recently");
  }
}

/** Card badge text, matching renderCardDiscountTag in the mobile app. */
export function getDiscountLabel(
  product: MarketplaceProduct,
  locale: Locale = "id",
): string | null {
  if (product.discountType === "fixed" && product.discountValue) {
    return `${formatCurrency(product.discountValue, locale)} OFF`;
  }

  const original = product.originalSellingPrice ?? 0;
  const current = product.sellingPrice;
  if (original > 0 && current > 0 && current < original) {
    const percentage = Math.round(((original - current) / original) * 100);
    if (percentage > 0) return `${percentage}% OFF`;
  }

  if (product.discount > 0) return `-${Math.round(product.discount)}%`;
  return null;
}

export function showsStrikethrough(product: MarketplaceProduct): boolean {
  if (!product.hasActiveOffer || product.offerBadge === "Promotion") return false;

  const originalMin =
    getProductOriginalPriceRange(product).min ||
    Number(product.originalSellingPrice) ||
    0;
  if (originalMin <= 0) return false;

  const currentMin =
    getProductPriceRange(product).min || Number(product.sellingPrice) || 0;
  return originalMin > currentMin || (product.originalSellingPrice ?? 0) > product.sellingPrice;
}

export function getPromotion(product: MarketplaceProduct) {
  const isPromo =
    product.hasActiveOffer &&
    (product.offerBadge === "Promotion" || product.offerBadge === "All Offers");
  return isPromo && product.promotionDetails ? product.promotionDetails : null;
}

/** "3-5 hari" style label from the shipping lead time, or null when unset. */
export function getDeliveryLabel(
  product: MarketplaceProduct,
  t: Translator,
): string | null {
  const min = Number(product.shipping?.leadTimeMinDays ?? 0);
  const max = Number(product.shipping?.leadTimeMaxDays ?? 0);

  if (min > 0 && max > 0) {
    return min === max
      ? t("product.leadDaysSingle", { days: min })
      : t("product.leadDaysRange", { min, max });
  }
  if (min > 0) return t("product.leadDaysMin", { days: min });
  return null;
}

export function getShippingLocation(product: MarketplaceProduct): string | null {
  const location = product.shippingInfo?.location?.trim();
  return location ? location : null;
}
