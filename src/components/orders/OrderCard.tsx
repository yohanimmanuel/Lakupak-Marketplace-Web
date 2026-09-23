import Image from "next/image";
import Link from "next/link";
import { ChevronRight, CreditCard, Package } from "lucide-react";

import FreeItemsBadge from "@/components/ui/FreeItemsBadge";
import { getTranslations } from "@/i18n/server";
import type { Order } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";
import {
  formatOrderDateTime,
  getItemCount,
  getPaymentColor,
  getSellerLogo,
  getSellerName,
  getStatusLabel,
  getStatusStyle,
  isPayable,
} from "@/lib/orders";
import { getOrderItemFreeQuantity } from "@/lib/promotion";

export default async function OrderCard({ order }: { order: Order }) {
  const t = await getTranslations();
  const thumbnail =
    getSellerLogo(order) ?? order.orderItems.find((item) => item.images?.length)?.images?.[0];
  const statusStyle = getStatusStyle(order.orderStatus);
  const detailsHref = `/orders/${encodeURIComponent(order.orderId)}`;

  return (
    <article className="border-b border-[#f3f4f6] bg-white px-4 py-3.5 last:border-b-0">
      <div className="flex gap-3.5">
        <div className="relative size-13 shrink-0 overflow-hidden rounded-full border-2 border-laku-line bg-laku-chip">
          {thumbnail ? (
            <Image src={thumbnail} alt="" fill sizes="52px" className="object-cover" />
          ) : (
            <span className="flex h-full items-center justify-center">
              <Package className="size-5 text-laku-faint" aria-hidden />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <h2 className="min-w-0 truncate text-[15px] font-bold text-laku-ink">
                {getSellerName(order, t)}
              </h2>
              <span
                className="inline-block shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ backgroundColor: statusStyle.background, color: statusStyle.color }}
              >
                {getStatusLabel(order.orderStatus, t)}
              </span>
            </div>
            <Link
              href={detailsHref}
              className="inline-flex shrink-0 items-center gap-0.5 rounded-lg px-2 py-1 text-[13px] font-semibold text-laku-blue transition-colors hover:bg-laku-blue/5"
            >
              {t("orders.viewDetails")}
              <ChevronRight className="size-3.5" aria-hidden />
            </Link>
          </div>

          <p className="mt-0.5 text-xs text-laku-muted">
            {formatOrderDateTime(order.orderDate ?? order.createdAt, t.locale)}
          </p>

          <ul className="mt-2 space-y-1">
            {order.orderItems.slice(0, 3).map((item, index) => {
              const freeQty = getOrderItemFreeQuantity(item);
              return (
                <li
                  key={`${order.orderId}-${item.productId ?? index}`}
                  className="flex min-w-0 items-center gap-1.5 text-[13px] text-[#374151]"
                >
                  <span className="shrink-0 font-medium">
                    {item.packageQuantity ?? 1}x
                  </span>
                  <FreeItemsBadge
                    count={freeQty}
                    label={t("orders.freeItems", { count: freeQty })}
                  />
                  <span className="min-w-0 truncate">
                    {item.productName ?? t("product.fallbackName")}
                    {item.variantNameSnapshot ? ` (${item.variantNameSnapshot})` : ""}
                  </span>
                </li>
              );
            })}
            {order.orderItems.length > 3 ? (
              <li className="text-[13px] text-laku-muted">
                {t("orders.moreProducts", { count: order.orderItems.length - 3 })}
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#f3f4f6] pt-3">
        <p
          className="text-[13px] font-semibold"
          style={{ color: getPaymentColor(order.paymentStatus) }}
        >
          {t("orders.itemsTotal", {
            count: getItemCount(order),
            amount:
              Number(order.totalAmount) > 0
                ? formatCurrency(order.totalAmount, t.locale)
                : t("orderDetails.pendingPrice"),
          })}
        </p>

        {isPayable(order) ? (
          <Link
            href={`${detailsHref}/pay`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-laku-blue px-3 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-laku-blue-dark"
          >
            <CreditCard className="size-3.5" aria-hidden />
            {t("orders.payOrder")}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
