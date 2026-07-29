import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import OrderReasonForm from "@/components/orders/OrderReasonForm";
import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { getOrderById } from "@/lib/api/orders";
import { getSession } from "@/lib/auth/session";
import { isReturnable } from "@/lib/orders";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("orderReason.returnMetaTitle"),
    robots: { index: false, follow: false },
  };
}

type Params = Promise<{ orderId: string }>;

export default async function ReturnOrderPage({ params }: { params: Params }) {
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
  if (!isReturnable(order) || order.returnStatus) {
    redirect(`/orders/${encodeURIComponent(order.orderId)}`);
  }

  return <OrderReasonForm mode="return" orderId={order.orderId} />;
}
