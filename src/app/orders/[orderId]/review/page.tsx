import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import OrderReviewForm from "@/components/orders/OrderReviewForm";
import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { getOrderById, getOrderReviews } from "@/lib/api/orders";
import { getSession } from "@/lib/auth/session";
import { isReviewable } from "@/lib/orders";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("orderReview.metaTitle"),
    robots: { index: false, follow: false },
  };
}

type Params = Promise<{ orderId: string }>;

export default async function ReviewOrderPage({ params }: { params: Params }) {
  const { orderId } = await params;
  const decodedId = decodeURIComponent(orderId);
  const t = await getTranslations();
  const session = await getSession();

  if (!session) {
    return (
      <SignedOutPrompt
        title={t("orderDetails.signedOutTitle")}
        body={t("orderDetails.signedOutBody")}
      />
    );
  }

  const order = await getOrderById({
    orderId: decodedId,
    userId: session.user.id,
    token: session.token,
  });

  if (!order) notFound();
  if (!isReviewable(order) || order.orderItems.length === 0) {
    redirect(`/orders/${encodeURIComponent(order.orderId)}`);
  }

  const existingReviews = await getOrderReviews({
    orderId: order.orderId,
    token: session.token,
  });

  return (
    <OrderReviewForm
      orderId={order.orderId}
      items={order.orderItems}
      existingReviews={existingReviews}
    />
  );
}
