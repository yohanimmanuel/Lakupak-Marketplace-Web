import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Building2, ShieldCheck } from "lucide-react";

import PayOrderForm from "@/components/orders/PayOrderForm";
import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { getOrderById, getSellerBank } from "@/lib/api/orders";
import { getSession } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/format";
import {
  getDistributorUserId,
  getSellerName,
  hasSubmittedPaymentProof,
  isBankTransferOrder,
  isCodOrder,
  isPayable,
  orderPaymentSplit,
} from "@/lib/orders";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("payOrder.metaTitle"),
    robots: { index: false, follow: false },
  };
}

type Params = Promise<{ orderId: string }>;

export default async function PayOrderPage({ params }: { params: Params }) {
  const { orderId } = await params;
  const decodedId = decodeURIComponent(orderId);
  const t = await getTranslations();
  const session = await getSession();

  if (!session) {
    return (
      <SignedOutPrompt
        title={t("payOrder.signedOutTitle")}
        body={t("payOrder.signedOutBody")}
      />
    );
  }

  const order = await getOrderById({
    orderId: decodedId,
    userId: session.user.id,
    token: session.token,
  });

  if (!order) notFound();
  if (!isPayable(order)) redirect(`/orders/${encodeURIComponent(order.orderId)}`);

  const paymentSplit = orderPaymentSplit(order);
  const isCod = isCodOrder(order);
  const isBankTransfer = isBankTransferOrder(order);
  const sellerUserId = getDistributorUserId(order);

  // Bank details are only released to buyers who already ordered from this seller,
  // which is always true by the time an order exists.
  const bank =
    isBankTransfer && sellerUserId
      ? await getSellerBank({ sellerUserId, token: session.token })
      : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <Link
        href={`/orders/${encodeURIComponent(order.orderId)}`}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("payOrder.backToDetails")}
      </Link>

      <h1 className="text-2xl font-bold text-laku-ink">{t("payOrder.title")}</h1>
      <p className="mt-1 font-mono text-sm text-laku-muted">#{order.orderId}</p>

      <section className="mt-5 rounded-2xl bg-laku-blue px-5 py-5 text-white">
        <p className="text-sm text-white/80">{t("payOrder.totalPayment")}</p>
        <p className="mt-1 text-3xl font-bold">
          {formatCurrency(order.totalAmount, t.locale)}
        </p>
        <p className="mt-2 text-sm text-white/80">
          {t("payOrder.productCount", {
            count: order.orderItems.length,
            terms: order.paymentTerms ?? t("payOrder.paymentFallback"),
          })}
        </p>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-white p-5">
          <p className="text-sm font-semibold text-green-600">{t("payOrder.paid")}</p>
          <p className="mt-1 text-lg font-bold text-laku-ink">
            {formatCurrency(paymentSplit.paid, t.locale)}
          </p>
        </div>
        <div className="rounded-2xl bg-white p-5">
          <p className="text-sm font-semibold text-red-600">{t("payOrder.unpaid")}</p>
          <p className="mt-1 text-lg font-bold text-laku-ink">
            {formatCurrency(paymentSplit.unpaid, t.locale)}
          </p>
        </div>
      </section>

      <section className="mt-4 rounded-2xl bg-white p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-laku-ink">
          <Building2 className="size-4 text-laku-blue" aria-hidden />
          {t("payOrder.payTo")}
        </h2>
        <p className="text-sm font-semibold text-laku-ink">
          {bank?.companyName ?? getSellerName(order, t)}
        </p>
        {order.user?.company?.businessAddress ? (
          <p className="mt-0.5 text-xs text-laku-muted">
            {order.user.company.businessAddress}
          </p>
        ) : null}
      </section>

      <PayOrderForm
        orderDbId={order.id}
        orderId={order.orderId}
        isCod={isCod}
        bank={bank}
        alreadySubmitted={hasSubmittedPaymentProof(order)}
        existingProofUrl={order.paymentProofUrls?.[0] ?? null}
      />

      <p className="mt-5 flex items-start gap-2 text-xs text-laku-muted">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-laku-ship" aria-hidden />
        {t("payOrder.securityNote")}
      </p>
    </div>
  );
}
