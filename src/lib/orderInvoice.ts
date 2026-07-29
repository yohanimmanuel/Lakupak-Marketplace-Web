/**
 * Shared invoice snapshot for print-friendly HTML (ported from mobile utils/orderInvoice).
 */

import type { Locale } from "@/i18n/config";
import type { Order } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";
import { displayPackageType } from "@/lib/packageLabel";

export type OrderInvoiceLine = {
  title: string;
  subtitle?: string;
  qtyLine: string;
  amount: string;
};

export type OrderInvoiceSnapshot = {
  orderId: string;
  storeName: string;
  issuedAt: string;
  paymentStatus: string;
  paymentTerms: string;
  orderStatus: string;
  billToName: string;
  billToPhone: string;
  shipTo: string;
  lines: OrderInvoiceLine[];
  subtotal: string;
  discounts: string;
  shipping: string;
  total: string;
};

function formatIssuedAt(orderDate: string, locale: Locale): string {
  const date = new Date(orderDate);
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleString(locale === "id" ? "id-ID" : "en-GB");
  }
  return date.toLocaleString(locale === "id" ? "id-ID" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function buildInvoiceSnapshot(
  order: Order,
  locale: Locale,
): OrderInvoiceSnapshot {
  const lines: OrderInvoiceLine[] = order.orderItems.map((item) => {
    const qty = Math.max(1, item.packageQuantity ?? 1);
    const ppp = item.pricePerPackage ?? 0;
    const packageLabel = displayPackageType(item.packageType);
    const subtitle = [
      item.variantNameSnapshot ? `Var: ${item.variantNameSnapshot}` : null,
      packageLabel ? ` · ${packageLabel}` : null,
    ]
      .filter(Boolean)
      .join("") || undefined;

    return {
      title: item.productName || "Item",
      subtitle,
      qtyLine: `${qty} × ${formatCurrency(ppp, locale)}`,
      amount: formatCurrency(item.subtotal, locale),
    };
  });

  return {
    orderId: order.orderId,
    storeName: order.storeName?.trim() || "Laku Marketplace",
    issuedAt: formatIssuedAt(order.orderDate, locale),
    paymentStatus: order.paymentStatus || "—",
    paymentTerms: order.paymentTerms || "—",
    orderStatus: order.orderStatus || "—",
    billToName: order.contactPerson?.trim() || "—",
    billToPhone: order.contactPhone?.trim() || "—",
    shipTo: order.deliveryAddress?.trim() || "—",
    lines,
    subtotal: formatCurrency(order.subtotal, locale),
    discounts: formatCurrency(order.discounts, locale),
    shipping: formatCurrency(order.shippingFee, locale),
    total: formatCurrency(order.totalAmount, locale),
  };
}

export function getInvoiceLegalFooter(year = new Date().getFullYear()): string {
  return `© ${year} Laku. All rights reserved. This invoice is issued through Laku Marketplace. Use of the Laku platform is subject to Laku's Terms & Conditions and Privacy Policy.`;
}
