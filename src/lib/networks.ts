import type { Order } from "@/lib/api/types";
import { getDistributorUserId, getSellerLogo, getSellerName } from "@/lib/orders";
import type { Translator } from "@/i18n/translate";

export type NetworkDistributor = {
  id: number;
  name: string;
  logo: string | null;
  address: string | null;
  phone: string | null;
  totalOrders: number;
  lastOrderDate: string | null;
};

/** Distributors the buyer has ordered from (app My Networks). */
export function buildNetworksFromOrders(
  orders: Order[],
  t: Translator,
): NetworkDistributor[] {
  const byId = new Map<number, NetworkDistributor>();

  for (const order of orders) {
    if (
      order.orderStatus === "Deleted" ||
      order.orderStatus === "Cancelled"
    ) {
      continue;
    }
    const id = getDistributorUserId(order);
    if (id == null) continue;

    const existing = byId.get(id);
    const orderDate = order.orderDate || order.createdAt || null;
    if (existing) {
      existing.totalOrders += 1;
      if (
        orderDate &&
        (!existing.lastOrderDate || orderDate > existing.lastOrderDate)
      ) {
        existing.lastOrderDate = orderDate;
      }
      if (!existing.logo) existing.logo = getSellerLogo(order);
      if (!existing.phone) {
        existing.phone = order.user?.company?.businessPhone?.trim() || null;
      }
      if (!existing.address) {
        existing.address =
          order.user?.company?.businessAddress?.trim() || null;
      }
      continue;
    }

    byId.set(id, {
      id,
      name: getSellerName(order, t),
      logo: getSellerLogo(order),
      address: order.user?.company?.businessAddress?.trim() || null,
      phone: order.user?.company?.businessPhone?.trim() || null,
      totalOrders: 1,
      lastOrderDate: orderDate,
    });
  }

  return Array.from(byId.values()).sort((a, b) => {
    const aDate = a.lastOrderDate ?? "";
    const bDate = b.lastOrderDate ?? "";
    return bDate.localeCompare(aDate);
  });
}
