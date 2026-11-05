"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearCart, getCart, getCartQuantity, getCartVariant } from "@/lib/api/cart";
import { getProductById } from "@/lib/api/marketplace";
import {
  cancelOrder,
  createOrders,
  updateOrderDetails,
  createReturnRequest,
  markOrderReceived,
  submitOrderReviews,
  submitPaymentIntent,
  type CreateOrderItemPayload,
  type OrderReviewProductPayload,
} from "@/lib/api/orders";
import type { CancelReasonCode, ReturnReasonCode } from "@/lib/orders";
import { updateProfile } from "@/lib/api/profile";
import { getSession } from "@/lib/auth/session";
import type { MarketplaceProduct } from "@/lib/api/types";
import {
  generateOrderId,
  getDeliveryOption,
  getDistributorGroupKey,
  getMinPackageQuantity,
  getPaymentTerms,
  PAYMENT_METHODS,
  type DeliveryOptionId,
  type PaymentMethodId,
} from "@/lib/checkout";
import { resolveVariantPricing } from "@/lib/variants";
import { getTranslations } from "@/i18n/server";
import type { ActionState } from "@/app/actions/cart";

type LineItem = {
  product: MarketplaceProduct;
  quantity: number;
  variant?: string;
};

type GroupShippingInput = {
  delivery: string;
  preferredDate?: string;
  preferredTime?: string;
};

function toOrderItem({ product, quantity, variant }: LineItem): CreateOrderItemPayload {
  const piecesPerPackage = Number(product.piecesPerPackage) || 1;
  const { variantOptionId } = resolveVariantPricing(product, variant);
  const packageQuantity = Math.max(
    getMinPackageQuantity(product, variant),
    Math.trunc(quantity) || 1,
  );
  const variantLabel = variant?.trim() || "Default";

  // Marketplace never sends catalog/offer prices — distributor resolves pricing
  // after the PO lands (getOfferForClientAndProduct on Orders side).
  return {
    productId: product.id,
    productName: product.name,
    quantity: packageQuantity * piecesPerPackage,
    priceAtPurchase: "0",
    subtotal: 0,
    packageType: product.packageType ?? "Box",
    piecesPerPackage,
    packageQuantity,
    pricePerPackage: 0,
    category: product.category,
    variantId: variantOptionId,
    variantName: variantLabel,
  };
}

/**
 * Rebuilds the basket server-side from the cart or the product catalog, so the
 * browser can only choose what to buy — never at what price.
 */
async function resolveLineItems(params: {
  userId: number;
  token: string;
  source: string;
  productId?: string | null;
  quantity?: number;
  variant?: string | null;
}): Promise<LineItem[]> {
  if (params.source === "direct" && params.productId) {
    const product = await getProductById(params.productId);
    if (!product) return [];
    const variant = params.variant?.trim() || "Default";
    const requested = Math.max(1, params.quantity ?? 1);
    return [
      {
        product,
        quantity: Math.max(requested, getMinPackageQuantity(product, variant)),
        variant,
      },
    ];
  }

  const cart = await getCart({ userId: params.userId, token: params.token });
  return cart.map((item) => ({
    product: item.productData,
    quantity: getCartQuantity(item),
    variant: getCartVariant(item),
  }));
}

async function resolveEditCartLines(raw: string): Promise<LineItem[]> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const lines: LineItem[] = [];
  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as { productId?: unknown; quantity?: unknown; variant?: unknown };
    const productId = String(record.productId ?? "").trim();
    if (!productId) continue;
    const product = await getProductById(productId);
    if (!product) continue;
    const variant = String(record.variant ?? "").trim() || "Default";
    const requested = Math.max(1, Number(record.quantity) || 1);
    lines.push({
      product,
      quantity: Math.max(requested, getMinPackageQuantity(product, variant)),
      variant,
    });
  }
  return lines;
}

function parseShippingByDistributor(
  raw: string,
): Record<string, GroupShippingInput> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, GroupShippingInput>;
  } catch {
    return {};
  }
}

/** Detect Dashboard/Prisma unique-orderId collisions so retries can recover. */
function isDuplicateOrderError(error: string): boolean {
  const msg = error.toLowerCase();
  return (
    msg.includes("unique constraint") ||
    msg.includes("duplicate key") ||
    msg.includes("already exists") ||
    (msg.includes("duplicate") && msg.includes("order"))
  );
}

export async function updateOrderDetailsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  const t = await getTranslations();
  if (!session) return { ok: false, error: t("checkout.errors.sessionExpired") };

  const orderId = String(formData.get("orderId") ?? "").trim();
  const shippingChoice = Object.values(
    parseShippingByDistributor(String(formData.get("shippingByDistributor") ?? "")),
  )[0];
  const deliveryOption = String(shippingChoice?.delivery || formData.get("deliveryOption") || "");
  const paymentMethod = String(formData.get("paymentMethod") ?? "");
  const deliveryAddress = String(formData.get("deliveryAddress") ?? "").trim();
  const contactPerson = String(formData.get("contactPerson") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const storeName = String(formData.get("storeName") ?? "").trim();

  if (!orderId) return { ok: false, error: t("checkout.errors.empty") };
  if (!contactPerson) return { ok: false, error: t("checkout.errors.name") };
  if (!contactPhone) return { ok: false, error: t("checkout.errors.phone") };
  if (!deliveryAddress) return { ok: false, error: t("checkout.errors.address") };
  if (deliveryOption !== "self_pickup" && deliveryOption !== "seller_delivery" && deliveryOption !== "buyer_courier") {
    return { ok: false, error: t("checkout.errors.delivery") };
  }
  if (paymentMethod !== "cod" && paymentMethod !== "bank_transfer") {
    return { ok: false, error: t("checkout.errors.payment") };
  }

  const result = await updateOrderDetails(
    {
      orderId,
      userId: session.user.id,
      contactPerson,
      contactPhone,
      storeName: storeName || contactPerson,
      deliveryAddress,
      deliveryOption,
      paymentMethod,
    },
    session.token,
  );
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  redirect(`/orders/${encodeURIComponent(orderId)}`);
}

export async function placeOrderAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await getSession();
  const t = await getTranslations();
  if (!session) return { ok: false, error: t("checkout.errors.sessionExpired") };

  const source = String(formData.get("source") ?? "cart");
  const productId = formData.get("productId")?.toString() || null;
  const quantity = Number(formData.get("quantity") ?? 1);
  const variant = formData.get("variant")?.toString() || null;
  const paymentMethodId = String(formData.get("paymentMethod") ?? "") as PaymentMethodId;
  const contactPerson = String(formData.get("contactPerson") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const deliveryAddress = String(formData.get("deliveryAddress") ?? "").trim();
  const storeName = String(formData.get("storeName") ?? "").trim();
  const shippingByDistributor = parseShippingByDistributor(
    String(formData.get("shippingByDistributor") ?? ""),
  );
  // Legacy single delivery fallback for older clients / single-group carts.
  const legacyDeliveryOptionId = String(formData.get("deliveryOption") ?? "");
  const legacyPreferredDate = String(formData.get("preferredDate") ?? "").trim();
  const legacyPreferredTime = String(formData.get("preferredTime") ?? "").trim();

  if (!contactPerson) return { ok: false, error: t("checkout.errors.name") };
  if (!contactPhone) return { ok: false, error: t("checkout.errors.phone") };
  if (!deliveryAddress) return { ok: false, error: t("checkout.errors.address") };
  if (!PAYMENT_METHODS.some((method) => method.id === paymentMethodId)) {
    return { ok: false, error: t("checkout.errors.payment") };
  }

  const poReference = String(formData.get("poReference") ?? "").trim();
  const noteToDistributor = String(formData.get("noteToDistributor") ?? "").trim();
  const deliveryNoteParts = [
    poReference ? `PO: ${poReference}` : "",
    noteToDistributor,
  ].filter(Boolean);
  const deliveryNote =
    deliveryNoteParts.length > 0 ? deliveryNoteParts.join("\n") : null;

  const lineItems = source === "editCart"
    ? await resolveEditCartLines(String(formData.get("editCartLines") ?? ""))
    : await resolveLineItems({
    userId: session.user.id,
    token: session.token,
    source,
    productId,
    quantity,
    variant,
  });

  if (lineItems.length === 0) {
    return { ok: false, error: t("checkout.errors.empty") };
  }

  const groups = new Map<string, LineItem[]>();
  for (const line of lineItems) {
    const key = getDistributorGroupKey(line.product);
    groups.set(key, [...(groups.get(key) ?? []), line]);
  }

  const expectedGroupCount = groups.size;
  const appendOrderId = String(formData.get("appendOrderId") ?? "").trim();
  if (appendOrderId && groups.size !== 1) {
    return { ok: false, error: t("checkout.singleDistributorOnly") };
  }
  const orderIds: string[] = [];
  let totalAmount = 0;
  // Stable per checkout submit so a retry of the same attempt cannot mint
  // new IDs for groups that already persisted (Dashboard enforces unique orderId).
  const checkoutAttemptId =
    String(formData.get("checkoutAttemptId") ?? "").trim() || generateOrderId();
  let groupIndex = 0;

  const finishPlacedOrders = async (partial: boolean): Promise<never> => {
    await updateProfile({
      userId: session.user.id,
      token: session.token,
      input: {
        name: contactPerson,
        phone: contactPhone,
        chosenAddress: deliveryAddress,
      },
    });

    if (source !== "direct" && source !== "editCart") {
      await clearCart({
        userId: session.user.id,
        token: session.token,
        trackAbandonment: false,
      });
    }

    revalidatePath("/cart");
    revalidatePath("/orders");
    if (appendOrderId) revalidatePath(`/orders/${appendOrderId}`);
    revalidatePath("/", "layout");

    const params = new URLSearchParams({
      orders: orderIds.join(","),
      total: String(totalAmount),
      payment: paymentMethodId,
    });
    if (partial) {
      params.set("partial", "1");
      params.set("expected", String(expectedGroupCount));
    }
    if (appendOrderId) {
      redirect(`/orders/${encodeURIComponent(appendOrderId)}?appended=1`);
    }
    redirect(`/checkout/success?${params.toString()}`);
  };

  for (const [groupKey, groupLines] of groups) {
    const shipping =
      shippingByDistributor[groupKey] ??
      ({
        delivery: legacyDeliveryOptionId || "seller_delivery",
        preferredDate: legacyPreferredDate,
        preferredTime: legacyPreferredTime,
      } satisfies GroupShippingInput);

    const deliveryOption = getDeliveryOption(shipping.delivery);
    if (!deliveryOption) {
      if (orderIds.length > 0) await finishPlacedOrders(true);
      return { ok: false, error: t("checkout.errors.delivery") };
    }

    const orderItems = groupLines.map(toOrderItem);
    const totalOrders = orderItems.reduce(
      (sum, item) => sum + item.packageQuantity * item.piecesPerPackage,
      0,
    );

    const isPickup = deliveryOption.id === ("self_pickup" as DeliveryOptionId);
    const preferredDate = String(shipping.preferredDate ?? "").trim();
    const preferredTime = String(shipping.preferredTime ?? "").trim();
    const parsedDate = preferredDate ? new Date(preferredDate) : null;
    const scheduledDate =
      parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toISOString()
        : null;
    const shippingLabel = t(deliveryOption.labelKey);

    const groupUserId = groupLines[0]?.product.userId;
    const distributorUserId =
      typeof groupUserId === "number" &&
      Number.isFinite(groupUserId) &&
      groupUserId > 0
        ? groupUserId
        : null;
    if (distributorUserId == null) {
      console.warn(
        "[placeOrderAction] Missing or invalid product.userId for distributor group; omitting distributorUserId from payload",
        {
          groupKey,
          productId: groupLines[0]?.product.id ?? null,
          userId: groupUserId ?? null,
        },
      );
    }
    const orderId =
      expectedGroupCount > 1
        ? `${checkoutAttemptId}-${groupIndex}`
        : checkoutAttemptId;
    groupIndex += 1;

    const payload = {
      orderId,
      userId: session.user.id,
      ...(distributorUserId ? { distributorUserId } : {}),
      orderDate: new Date().toISOString(),
      orderItems,
      subtotal: 0,
      discounts: 0,
      shippingFee: 0,
      totalAmount: 0,
      totalOrders,
      contactPerson,
      storeName: storeName || contactPerson,
      contactPhone,
      customerEmail: session.user.email,
      deliveryAddress,
      deliveryMethod: deliveryOption.method,
      deliveryOption: deliveryOption.id,
      shippingMethodLabel: shippingLabel,
      shippingMethod: shippingLabel,
      preferredDeliveryDate: isPickup ? null : scheduledDate,
      preferredDeliveryTime: isPickup ? null : preferredTime || null,
      preferredPickupDate: isPickup ? scheduledDate : null,
      preferredPickupTime: isPickup ? preferredTime || null : null,
      ...(deliveryNote ? { deliveryNote } : {}),
      // Existing Orders module status for awaiting distributor confirmation.
      orderStatus: "Pending" as const,
      paymentStatus: "Unpaid" as const,
      paymentTerms: getPaymentTerms(paymentMethodId),
      ...(appendOrderId ? { appendToOrderId: appendOrderId } : {}),
    };

    const result = await createOrders(payload, session.token);
    if (!result.ok) {
      console.error("[placeOrderAction] createOrders failed", {
        orderId,
        status: result.status,
        error: result.error,
        groupKey,
        distributorUserId,
      });
      // Same checkoutAttemptId retry: this groupId may already be persisted.
      if (isDuplicateOrderError(result.error)) {
        orderIds.push(orderId);
        totalAmount += 0;
        continue;
      }
      // Earlier groups may already be persisted — surface them instead of an
      // error that hides the created orders.
      if (orderIds.length > 0) await finishPlacedOrders(true);
      return { ok: false, error: result.error };
    }

    const created = result.data?.orders ?? (result.data?.order ? [result.data.order] : []);
    let added = false;
    for (const order of created) {
      if (order?.orderId) {
        orderIds.push(order.orderId);
        added = true;
      }
    }
    if (!added) orderIds.push(orderId);
    totalAmount += 0;
  }

  await finishPlacedOrders(false);
  // redirect() never returns; keep a typed fallback for TypeScript.
  return { ok: false, error: t("checkout.errors.empty") };
}

export async function submitPaymentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await getTranslations();
  const session = await getSession();
  if (!session) return { ok: false, error: t("checkout.errors.sessionExpired") };

  const orderDbId = Number(formData.get("orderDbId"));
  const orderId = String(formData.get("orderId") ?? "");
  const proofUrl = String(formData.get("proofUrl") ?? "").trim();
  const proofFileName = String(formData.get("proofFileName") ?? "").trim();
  const requiresProof = formData.get("requiresProof") === "1";
  const update = formData.get("update") === "1";

  if (!Number.isFinite(orderDbId)) {
    return { ok: false, error: t("payOrder.errors.invalidOrder") };
  }
  if (requiresProof && !proofUrl) {
    return { ok: false, error: t("payOrder.errors.noProof") };
  }

  const result = await submitPaymentIntent({
    orderDbId,
    token: session.token,
    proofUrls: proofUrl ? [proofUrl] : undefined,
    proofFileNames: proofFileName ? [proofFileName] : undefined,
    update,
  });

  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");

  return {
    ok: true,
    message: t("payOrder.successMessage"),
  };
}

export async function markOrderReceivedAction(params: {
  orderDbId: number;
  orderId: string;
}): Promise<ActionState> {
  const t = await getTranslations();
  const session = await getSession();
  if (!session) return { ok: false, error: t("checkout.errors.sessionExpired") };

  const result = await markOrderReceived({
    orderDbId: params.orderDbId,
    token: session.token,
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath(`/orders/${params.orderId}`);
  revalidatePath("/orders");
  return { ok: true, message: t("orderDetails.receivedSuccess") };
}

export async function cancelOrderAction(params: {
  orderId: string;
  reasonCode: CancelReasonCode;
  reasonDetail?: string;
}): Promise<ActionState> {
  const t = await getTranslations();
  const session = await getSession();
  if (!session) return { ok: false, error: t("checkout.errors.sessionExpired") };

  const result = await cancelOrder({
    orderId: params.orderId,
    userId: session.user.id,
    token: session.token,
    reasonCode: params.reasonCode,
    reason:
      params.reasonDetail?.trim() ||
      t(`cancelReasons.${params.reasonCode}`),
    reasonDetail: params.reasonDetail?.trim() || undefined,
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath(`/orders/${params.orderId}`);
  revalidatePath("/orders");
  return { ok: true, message: t("orderDetails.cancelSuccess") };
}

export async function requestReturnAction(params: {
  orderId: string;
  reason: ReturnReasonCode;
  reasonDetail?: string;
  imageUrls?: string[];
}): Promise<ActionState> {
  const t = await getTranslations();
  const session = await getSession();
  if (!session) return { ok: false, error: t("checkout.errors.sessionExpired") };

  const result = await createReturnRequest({
    orderId: params.orderId,
    token: session.token,
    reason: params.reason,
    reasonDetail: params.reasonDetail?.trim() || undefined,
    imageUrls: params.imageUrls,
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath(`/orders/${params.orderId}`);
  return { ok: true, message: t("orderDetails.returnSuccess") };
}

export async function submitOrderReviewsAction(params: {
  orderId: string;
  productReviews: OrderReviewProductPayload[];
  deliveryRating?: number;
  deliveryComment?: string;
}): Promise<ActionState> {
  const t = await getTranslations();
  const session = await getSession();
  if (!session) return { ok: false, error: t("checkout.errors.sessionExpired") };

  if (
    params.productReviews.length === 0 ||
    !params.productReviews.every((item) => item.rating > 0)
  ) {
    return { ok: false, error: t("orderReview.errors.ratingRequired") };
  }

  const result = await submitOrderReviews({
    orderId: params.orderId,
    token: session.token,
    productReviews: params.productReviews,
    deliveryRating: params.deliveryRating,
    deliveryComment: params.deliveryComment?.trim() || undefined,
  });
  if (!result.ok) return { ok: false, error: result.error };

  revalidatePath(`/orders/${params.orderId}`);
  return { ok: true, message: t("orderReview.success") };
}
