import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import CheckoutForm from "@/components/checkout/CheckoutForm";
import EditCartCheckout from "@/components/checkout/EditCartCheckout";
import { RememberAppendOrder } from "@/components/orders/RememberAppendOrder";
import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { listAddresses } from "@/lib/api/addresses";
import { getCart, getCartQuantity } from "@/lib/api/cart";
import { getProductById } from "@/lib/api/marketplace";
import { getOrderById } from "@/lib/api/orders";
import { getProfile } from "@/lib/api/profile";
import { getSession } from "@/lib/auth/session";
import type { MarketplaceProduct } from "@/lib/api/types";
import { getAvailableDeliveryOptions, getMinPackageQuantity, resolveStoredDeliveryId, type DeliveryOptionId, type PaymentMethodId } from "@/lib/checkout";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("checkout.title"),
    description: t("checkout.metaDescription"),
    robots: { index: false, follow: false },
  };
}

type SearchParams = Promise<{
  productId?: string;
  quantity?: string;
  variant?: string;
  appendOrderId?: string;
  editOrderId?: string;
  editCart?: string;
}>;

export type CheckoutLine = {
  product: MarketplaceProduct;
  quantity: number;
  variant?: string;
  /** Saved line total for products already on the order. */
  displaySubtotal?: number;
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations();
  const session = await getSession();

  if (!session) {
    return (
      <SignedOutPrompt
        title={t("checkout.signedOutTitle")}
        body={t("checkout.signedOutBody")}
      />
    );
  }

  const { productId, quantity, variant, appendOrderId, editOrderId, editCart } = await searchParams;
  const editingOrderId = editOrderId?.trim() || "";
  const appendToOrderId = editingOrderId ? null : appendOrderId?.trim() || null;
  const orderIdForLines = editingOrderId || appendToOrderId || "";
  const isDirect = Boolean(productId);
  const variantName = variant?.trim() || "Default";

  let initialDelivery: DeliveryOptionId | null = null;
  let initialPayment: PaymentMethodId | null = null;
  const existingOrder = orderIdForLines
    ? await getOrderById({
        orderId: orderIdForLines,
        userId: session.user.id,
        token: session.token,
      })
    : null;
  if (orderIdForLines && (!existingOrder || existingOrder.orderStatus !== "Pending" || existingOrder.paymentStatus !== "Unpaid")) {
    redirect(existingOrder ? `/orders/${encodeURIComponent(existingOrder.orderId)}` : "/orders");
  }
  if (existingOrder) {
    initialDelivery = resolveStoredDeliveryId(
      existingOrder.deliveryOption,
      existingOrder.deliveryMethod,
    );
    initialPayment = /cod|cash/i.test(existingOrder.paymentTerms ?? "") ? "cod" : "bank_transfer";
  }
  const editingOrder = editingOrderId ? existingOrder : null;
  const checkingOutEditCart = !editingOrder && !isDirect && Boolean(appendToOrderId) && editCart === "1";

  const orderLines = async (): Promise<CheckoutLine[]> => {
    if (!existingOrder) return [];
    const rows = await Promise.all(
      existingOrder.orderItems.map(async (item) => {
        if (!item.productId) return null;
        const product = await getProductById(item.productId);
        if (!product) return null;
        return {
          product,
          quantity: Math.max(1, Number(item.packageQuantity) || 1),
          variant: item.variantNameSnapshot?.trim() || "Default",
          displaySubtotal: Number(item.subtotal) || 0,
        };
      }),
    );
    return rows.filter((row) => row !== null);
  };

  const [freshLines, profile, addresses] = await Promise.all([
    editingOrder || checkingOutEditCart
      ? Promise.resolve([] as CheckoutLine[])
      : isDirect
      ? getProductById(productId!).then((product) => {
          if (!product) return [] as CheckoutLine[];
          const requested = Math.max(1, Number(quantity) || 1);
          return [
            {
              product,
              quantity: Math.max(
                requested,
                getMinPackageQuantity(product, variantName),
              ),
              variant: variantName,
            },
          ];
        })
      : getCart({ userId: session.user.id, token: session.token }).then((items) =>
          items.map((item) => ({
            product: item.productData,
            quantity: getCartQuantity(item),
            variant: item.metadata?.variant?.trim() || "Default",
          })),
        ),
    getProfile({ userId: session.user.id, token: session.token }),
    listAddresses({ userId: session.user.id, token: session.token }),
  ]);
  const existingLines = await orderLines();
  const buyer = {
    name: profile?.name ?? session.user.name ?? "",
    phone: profile?.phone ?? "",
    storeName: profile?.storeName ?? "",
    address: profile?.chosenAddress ?? session.user.address ?? "",
    email: profile?.email ?? session.user.email ?? "",
  };

  if (checkingOutEditCart && appendToOrderId) {
    return (
      <EditCartCheckout
        appendOrderId={appendToOrderId}
        existingLines={existingLines}
        initialDelivery={initialDelivery}
        initialPayment={initialPayment}
        addresses={addresses}
        buyer={buyer}
      />
    );
  }

  const lines = editingOrder
    ? existingLines
    : appendToOrderId
      ? [...existingLines, ...freshLines]
      : freshLines;

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center md:px-6">
        <h1 className="text-lg font-bold text-laku-ink">{t("checkout.emptyTitle")}</h1>
        <p className="mt-2 text-sm text-laku-muted">{t("checkout.emptyBody")}</p>
        <Link
          href="/search"
          className="mt-6 inline-flex rounded-lg bg-laku-blue px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
        >
          {t("checkout.findProducts")}
        </Link>
      </div>
    );
  }

  const deliveryOptions = getAvailableDeliveryOptions(lines.map((line) => line.product));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <RememberAppendOrder orderId={editingOrder?.orderId || appendToOrderId} />
      <h1 className="mb-6 text-2xl font-bold text-laku-ink">
        {editingOrder ? t("checkout.editTitle") : t("checkout.title")}
      </h1>
      <CheckoutForm
        lines={lines}
        deliveryOptions={deliveryOptions}
        source={editingOrder || isDirect ? "direct" : "cart"}
        productId={editingOrder ? null : productId ?? null}
        appendOrderId={appendToOrderId}
        editOrderId={editingOrder?.orderId ?? null}
        initialDelivery={initialDelivery}
        initialPayment={initialPayment}
        addresses={addresses}
        buyer={buyer}
      />
    </div>
  );
}
