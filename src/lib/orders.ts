import { intlLocale, type Locale } from "@/i18n/config";
import type { Translator } from "@/i18n/translate";
import type { Order } from "@/lib/api/types";
import { getOrderItemFreeQuantity } from "@/lib/promotion";

/** Status pill palette ported from getOrderStatusBadgeStyle in the mobile app. */
const STATUS_STYLES: Record<string, { background: string; color: string }> = {
  pending: { background: "#fefce8", color: "#a16207" },
  confirmed: { background: "#eff6ff", color: "#1d4ed8" },
  packed: { background: "#eef2ff", color: "#4338ca" },
  shipped: { background: "#f0f9ff", color: "#0369a1" },
  delivered: { background: "#ecfdf5", color: "#047857" },
  received: { background: "#ecfdf5", color: "#047857" },
  failed: { background: "#fff1f2", color: "#be123c" },
  cancelled: { background: "#fff1f2", color: "#be123c" },
  returned: { background: "#ffedd5", color: "#c2410c" },
};

const KNOWN_STATUSES = new Set(Object.keys(STATUS_STYLES));

export function getStatusStyle(status: string) {
  return (
    STATUS_STYLES[status?.toLowerCase()] ?? { background: "#f3f4f6", color: "#6b7280" }
  );
}

export function getStatusLabel(status: string, t: Translator): string {
  const key = status?.toLowerCase();
  return KNOWN_STATUSES.has(key) ? t(`orderStatus.${key}`) : t("orderStatus.unknown");
}

/** Longer copy used on notification rows, matching ordersFlow.orderDetails.statusText. */
export function getStatusMessage(status: string, t: Translator): string {
  const key = status?.toLowerCase();
  return KNOWN_STATUSES.has(key)
    ? t(`orderStatusMessage.${key}`)
    : t("orderStatusMessage.unknown");
}

export function getPaymentColor(paymentStatus?: string | null): string {
  const value = paymentStatus?.toLowerCase();
  if (value === "unpaid") return "#dc2626";
  if (value === "paid") return "#16a34a";
  return "#111827";
}

export function getSellerName(order: Order, t: Translator): string {
  return (
    order.user?.company?.name?.trim() ||
    order.user?.name?.trim() ||
    t("product.distributorFallback")
  );
}

export function getSellerLogo(order: Order): string | null {
  return order.user?.company?.logo?.trim() || null;
}

/** Order.userId is the distributor's Dashboard user; the pay flow needs it for bank details. */
export function getDistributorUserId(order: Order): number | null {
  const id = order.userId ?? order.user?.id;
  return typeof id === "number" && Number.isFinite(id) ? id : null;
}

export function getItemCount(order: Order): number {
  return order.orderItems.reduce(
    (total, item) =>
      total + (item.packageQuantity ?? 1) + getOrderItemFreeQuantity(item),
    0,
  );
}

export function formatOrderDateTime(
  value?: string | null,
  locale: Locale = "id",
): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const tag = intlLocale(locale);
  const day = new Intl.DateTimeFormat(tag, {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat(tag, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  return `${day} • ${time}`;
}

/** Reason codes accepted by the Dashboard; labels come from `cancelReasons.*`. */
export const CANCEL_REASON_CODES = [
  "changed_mind",
  "found_cheaper",
  "wrong_item",
  "delivery_issues",
  "payment_issues",
  "seller_issues",
  "other",
] as const;

export type CancelReasonCode = (typeof CANCEL_REASON_CODES)[number];

export const RETURN_REASON_CODES = [
  "wrong_item",
  "defective",
  "not_as_described",
  "changed_mind",
  "late_delivery",
  "other",
] as const;

export type ReturnReasonCode = (typeof RETURN_REASON_CODES)[number];

const COD_PATTERN = /cod|cash/i;
const BANK_PATTERN = /bank|transfer/i;

/** Payment terms are free text upstream; the app matches on these words too. */
export function isCodOrder(order: Order): boolean {
  return COD_PATTERN.test(order.paymentTerms ?? "");
}

export function isBankTransferOrder(order: Order): boolean {
  const terms = order.paymentTerms ?? "";
  return !COD_PATTERN.test(terms) && BANK_PATTERN.test(terms);
}

export function hasSubmittedPaymentProof(order: Order): boolean {
  return Boolean(
    order.paymentProofSubmittedAt || (order.paymentProofUrls?.length ?? 0) > 0,
  );
}

export function isPayable(order: Order): boolean {
  const status = order.orderStatus?.toLowerCase();
  return (
    order.paymentStatus === "Unpaid" &&
    status !== "cancelled" &&
    status !== "returned" &&
    status !== "failed"
  );
}

/** Mirrors the mobile rule: only Pending and Confirmed orders can be cancelled. */
export function isCancellable(order: Order): boolean {
  return order.orderStatus === "Pending" || order.orderStatus === "Confirmed";
}

export function isReturnable(order: Order): boolean {
  return ["Delivered", "Received", "Returned"].includes(order.orderStatus);
}

/** Buyers can write a review only after confirming the order was received. */
export function isReviewable(order: Order): boolean {
  return order.orderStatus === "Received";
}

const TIMELINE_STATUSES = [
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Received",
] as const;

export type TimelineStep = {
  key: string;
  label: string;
  state: "done" | "current" | "upcoming";
};

/** Cancelled, returned, and failed orders stop the tracker instead of advancing it. */
export function getOrderTimeline(order: Order, t: Translator): TimelineStep[] | null {
  const status = order.orderStatus;
  if (["Cancelled", "Returned", "Failed"].includes(status)) return null;

  const currentIndex = TIMELINE_STATUSES.indexOf(
    status as (typeof TIMELINE_STATUSES)[number],
  );
  if (currentIndex === -1) return null;

  return TIMELINE_STATUSES.map((key, index) => ({
    key,
    label: t(`orderTimeline.${key}`),
    state: index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming",
  }));
}

/** Pickup and delivery use different columns; only one pair is ever populated. */
export function getScheduleLabel(order: Order, locale: Locale = "id"): string | null {
  const date = order.preferredPickupDate ?? order.preferredDeliveryDate;
  const time = order.preferredPickupTime ?? order.preferredDeliveryTime;
  if (!date && !time) return null;

  const formattedDate = date
    ? new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: "full" }).format(
        new Date(date),
      )
    : null;

  return [formattedDate, time].filter(Boolean).join(" • ");
}

export function getEstimatedDeliveryLabel(
  order: Order,
  t: Translator,
): string | null {
  if (
    ["Delivered", "Received", "Returned", "Cancelled", "Failed"].includes(
      order.orderStatus,
    )
  ) {
    return null;
  }

  if (order.estimatedDeliveryDate) {
    return new Intl.DateTimeFormat(intlLocale(t.locale), { dateStyle: "full" }).format(
      new Date(order.estimatedDeliveryDate),
    );
  }

  const min = order.estimatedDeliveryMinDays;
  const max = order.estimatedDeliveryMaxDays;
  if (min && max) {
    return min === max
      ? t("product.estimatedDaysSingle", { days: min })
      : t("product.estimatedDays", { min, max });
  }
  if (min) return t("product.estimatedDaysMin", { days: min });
  return null;
}
