"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearCart, getCart, getCartQuantity, getCartVariant } from "@/lib/api/cart";
import { getProductById } from "@/lib/api/marketplace";
import {
  cancelOrder,
  createOrders,
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
  getMinPackageQuantity,
  getPaymentTerms,
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

function toOrderItem({ product, quantity, variant }: LineItem): CreateOrderItemPayload {
  const piecesPerPackage = Number(product.piecesPerPackage) || 1;
  const { unitPrice, variantOptionId } = resolveVariantPricing(product, variant);
  const packageQuantity = Math.max(
    getMinPackageQuantity(product, variant),
    Math.trunc(quantity) || 1,
  );
  const variantLabel = variant?.trim() || "Default";

  return {
    productId: product.id,
    productName: product.name,
    quantity: packageQuantity * piecesPerPackage,
    priceAtPurchase: String(unitPrice),
    subtotal: unitPrice * piecesPerPackage * packageQuantity,
    packageType: product.packageType ?? "Box",
    piecesPerPackage,
    packageQuantity,
    pricePerPackage: unitPrice * piecesPerPackage,
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
  const deliveryOptionId = String(formData.get("deliveryOption") ?? "");
  const paymentMethodId = String(formData.get("paymentMethod") ?? "") as PaymentMethodId;
  const contactPerson = String(formData.get("contactPerson") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const deliveryAddress = String(formData.get("deliveryAddress") ?? "").trim();
  const storeName = String(formData.get("storeName") ?? "").trim();
  const preferredDate = String(formData.get("preferredDate") ?? "").trim();
  const preferredTime = String(formData.get("preferredTime") ?? "").trim();

  const deliveryOption = getDeliveryOption(deliveryOptionId);
  if (!deliveryOption) return { ok: false, error: t("checkout.errors.delivery") };
  if (!contactPerson) return { ok: false, error: t("checkout.errors.name") };
  if (!contactPhone) return { ok: false, error: t("checkout.errors.phone") };
  if (!deliveryAddress) return { ok: false, error: t("checkout.errors.address") };

  const lineItems = await resolveLineItems({
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

  const orderItems = lineItems.map(toOrderItem);
  const subtotal = orderItems.reduce((total, item) => total + item.subtotal, 0);
  const totalOrders = orderItems.reduce(
    (total, item) => total + item.packageQuantity * item.piecesPerPackage,
    0,
  );

  const isPickup = deliveryOption.id === "self_pickup";
  const scheduledDate = preferredDate ? new Date(preferredDate).toISOString() : null;
  const shippingLabel = t(deliveryOption.labelKey);

  const result = await createOrders(
    {
      orderId: generateOrderId(),
      userId: session.user.id,
      orderDate: new Date().toISOString(),
      orderItems,
      subtotal,
      discounts: 0,
      shippingFee: 0,
      totalAmount: subtotal,
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
      orderStatus: "Pending",
      paymentStatus: "Unpaid",
      paymentTerms: getPaymentTerms(paymentMethodId),
    },
    session.token,
  );

  if (!result.ok) return { ok: false, error: result.error };

  const created = result.data.orders ?? [result.data.order];
  const orderIds = created.map((order) => order.orderId).filter(Boolean);

  // Keep the checkout address for next time, the way saving a default address
  // does in the app.
  await updateProfile({
    userId: session.user.id,
    token: session.token,
    input: { name: contactPerson, phone: contactPhone, chosenAddress: deliveryAddress },
  });

  if (source !== "direct") {
    await clearCart({
      userId: session.user.id,
      token: session.token,
      trackAbandonment: false,
    });
  }

  revalidatePath("/cart");
  revalidatePath("/orders");
  revalidatePath("/", "layout");

  const params = new URLSearchParams({
    orders: orderIds.join(","),
    total: String(subtotal),
    payment: paymentMethodId,
  });
  redirect(`/checkout/success?${params.toString()}`);
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
