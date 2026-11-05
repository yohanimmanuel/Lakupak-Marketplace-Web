import "server-only";

import { restMutate, restRequest, type MutationResult } from "@/lib/api/graphql";
import type { Order, OrdersResult, Pagination, SellerBank } from "@/lib/api/types";
import type { CancelReasonCode, ReturnReasonCode } from "@/lib/orders";

const EMPTY_PAGINATION: Pagination = {
  page: 1,
  limit: 0,
  totalCount: 0,
  totalPages: 0,
};

type OrdersResponse = {
  orders: Order[];
  pagination: { page: number; limit: number; total: number; pages: number };
};

/**
 * Buyer-scoped list. The REST route is preferred over GraphQL `mobileOrders`
 * because it returns the numeric Order.id and the payment proof columns that
 * the pay flow needs.
 */
export async function getOrders(params: {
  userId: number;
  token: string;
  page?: number;
  limit?: number;
}): Promise<OrdersResult> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  try {
    const data = await restRequest<OrdersResponse>(
      `/api/mobile/orders?userId=${params.userId}&page=${page}&limit=${limit}`,
      { token: params.token },
    );

    return {
      orders: data.orders ?? [],
      pagination: {
        page: data.pagination?.page ?? page,
        limit: data.pagination?.limit ?? limit,
        totalCount: data.pagination?.total ?? 0,
        totalPages: data.pagination?.pages ?? 0,
      },
      expired: false,
    };
  } catch (error) {
    // A 30 day token can lapse while the cookie is still present; tell the page
    // to ask for a fresh sign-in instead of pretending there are no orders.
    const message = error instanceof Error ? error.message : "";
    const expired = /\b401\b|\b403\b|authentication|forbidden|suspended/i.test(message);

    return { orders: [], pagination: EMPTY_PAGINATION, expired };
  }
}

/**
 * There is no single-order endpoint upstream, so the order is picked out of the
 * buyer's own list. Limit 100 is the API maximum.
 */
export async function getOrderById(params: {
  orderId: string;
  userId: number;
  token: string;
}): Promise<Order | null> {
  const limit = 100;
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const { orders, pagination } = await getOrders({
      userId: params.userId,
      token: params.token,
      page,
      limit,
    });
    const match = orders.find((order) => order.orderId === params.orderId);
    if (match) return match;
    const reportedPages = pagination.totalPages;
    totalPages = Number.isFinite(reportedPages) && reportedPages > 0 ? reportedPages : page;
    if (orders.length < limit) break;
    page += 1;
  }

  return null;
}

export type CreateOrderItemPayload = {
  productId: string;
  productName: string;
  quantity: number;
  priceAtPurchase: string;
  subtotal: number;
  packageType: string;
  piecesPerPackage: number;
  packageQuantity: number;
  pricePerPackage: number;
  category?: string;
  variantId?: number;
  variantName?: string;
};

export type CreateOrderPayload = {
  orderId: string;
  userId: number;
  /** When set, Dashboard uses the single-distributor path for this payload. */
  distributorUserId?: number;
  orderDate: string;
  orderItems: CreateOrderItemPayload[];
  subtotal: number;
  discounts: number;
  shippingFee: number;
  totalAmount: number;
  totalOrders: number;
  contactPerson: string;
  storeName: string;
  contactPhone: string;
  customerEmail?: string;
  deliveryAddress: string;
  deliveryMethod: string;
  deliveryOption: string;
  shippingMethodLabel: string;
  shippingMethod: string;
  preferredPickupDate?: string | null;
  preferredPickupTime?: string | null;
  deliveryNote?: string | null;
  orderStatus: "Pending";
  paymentStatus: "Unpaid";
  paymentTerms: string;
  /** When set, the products are added to this pending unpaid order. */
  appendToOrderId?: string;
};

/**
 * Pass `distributorUserId` when creating one order per seller (multi-seller
 * carts with different shipping). Omit it to let the Dashboard split a mixed
 * basket itself using one shared shipping choice.
 */
export async function updateOrderDetails(
  payload: {
    orderId: string;
    userId: number;
    contactPerson: string;
    contactPhone: string;
    storeName: string;
    deliveryAddress: string;
    deliveryOption: "self_pickup" | "seller_delivery" | "buyer_courier";
    paymentMethod: "cod" | "bank_transfer";
    preferredPickupDate?: string | null;
    preferredPickupTime?: string | null;
  },
  token: string,
): Promise<MutationResult<{ success: boolean; order: Order }>> {
  return restMutate("/api/mobile/orders", { method: "PATCH", token, body: payload });
}

export async function createOrders(
  payload: CreateOrderPayload,
  token: string,
): Promise<MutationResult<{ success: boolean; orders: Order[]; order: Order }>> {
  return restMutate("/api/mobile/orders", { method: "POST", token, body: payload });
}

export async function submitPaymentIntent(params: {
  orderDbId: number;
  token: string;
  proofUrls?: string[];
  proofFileNames?: string[];
  update?: boolean;
}): Promise<MutationResult<{ ok: boolean; updated: boolean }>> {
  const body: Record<string, unknown> = {};
  if (params.proofUrls?.length) {
    body.proofUrls = params.proofUrls;
    if (params.proofFileNames?.length) body.proofFileNames = params.proofFileNames;
  }
  if (params.update) body.updatePaymentIntent = true;

  return restMutate(`/api/mobile/orders/${params.orderDbId}/pay-intent`, {
    method: "POST",
    token: params.token,
    body,
  });
}

export async function markOrderReceived(params: {
  orderDbId: number;
  token: string;
}): Promise<MutationResult<{ message: string }>> {
  return restMutate(`/api/mobile/orders/${params.orderDbId}/status`, {
    method: "PUT",
    token: params.token,
    body: { status: "Received" },
  });
}

/** Cancellation has no /api/mobile route; buyers use PUT /api/orders with cancel: true. */
export async function cancelOrder(params: {
  orderId: string;
  userId: number;
  token: string;
  reasonCode: CancelReasonCode;
  reason: string;
  reasonDetail?: string;
}): Promise<MutationResult<{ success: boolean }>> {
  return restMutate("/api/orders", {
    method: "PUT",
    token: params.token,
    body: {
      cancel: true,
      orderId: params.orderId,
      userId: params.userId,
      cancelledBy: String(params.userId),
      reason: params.reason,
      reasonCode: params.reasonCode,
      reasonDetail: params.reasonDetail,
    },
  });
}

export async function createReturnRequest(params: {
  orderId: string;
  token: string;
  reason: ReturnReasonCode;
  reasonDetail?: string;
  imageUrls?: string[];
}): Promise<MutationResult<{ returnRequestId: number }>> {
  return restMutate("/api/mobile/orders/return-request", {
    method: "POST",
    token: params.token,
    body: {
      orderId: params.orderId,
      reason: params.reason,
      reasonDetail: params.reasonDetail,
      imageUrls: params.imageUrls?.slice(0, 5),
    },
  });
}

export type OrderReviewProductPayload = {
  productId: string;
  rating: number;
  title?: string;
  comment?: string;
  imageUrls?: string[];
};

export type OrderReviewsPayload = {
  orderId: string;
  productReviews: Array<{
    productId: string;
    rating: number;
    title?: string | null;
    comment?: string | null;
    imageUrls?: string[];
  }>;
  deliveryReview?: {
    deliveryRating?: number | null;
    deliveryComment?: string | null;
  } | null;
};

export async function getOrderReviews(params: {
  orderId: string;
  token: string;
}): Promise<OrderReviewsPayload | null> {
  try {
    return await restRequest<OrderReviewsPayload>(
      `/api/mobile/reviews/order?orderId=${encodeURIComponent(params.orderId)}`,
      { token: params.token },
    );
  } catch {
    return null;
  }
}

export async function submitOrderReviews(params: {
  orderId: string;
  token: string;
  productReviews: OrderReviewProductPayload[];
  deliveryRating?: number;
  deliveryComment?: string;
}): Promise<MutationResult<{ success: boolean }>> {
  return restMutate("/api/mobile/reviews/order", {
    method: "POST",
    token: params.token,
    body: {
      orderId: params.orderId,
      productReviews: params.productReviews,
      deliveryRating: params.deliveryRating,
      deliveryComment: params.deliveryComment,
    },
  });
}

/**
 * The Dashboard only releases bank details to buyers who already have an order
 * with that seller, so this is called from the pay page and never at checkout.
 */
export async function getSellerBank(params: {
  sellerUserId: number;
  token: string;
}): Promise<SellerBank | null> {
  try {
    return await restRequest<SellerBank>(
      `/api/mobile/checkout/seller-bank/${params.sellerUserId}?full=1`,
      { token: params.token },
    );
  } catch {
    return null;
  }
}
