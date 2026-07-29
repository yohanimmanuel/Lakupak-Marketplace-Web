"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  CheckCircle2,
  CreditCard,
  RotateCcw,
  Star,
  XCircle,
} from "lucide-react";

import { markOrderReceivedAction } from "@/app/actions/orders";
import { useTranslations } from "@/i18n/client";
import type { Order } from "@/lib/api/types";
import {
  isCancellable,
  isPayable,
  isReturnable,
  isReviewable,
} from "@/lib/orders";

export default function OrderActions({
  order,
  hasExistingReview = false,
}: {
  order: Order;
  hasExistingReview?: boolean;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detailsHref = `/orders/${encodeURIComponent(order.orderId)}`;
  const canPay = isPayable(order);
  const canCancel = isCancellable(order);
  const canConfirm = order.orderStatus === "Delivered";
  const canReturn = isReturnable(order) && !order.returnStatus;
  const canReview = isReviewable(order);

  if (!canPay && !canCancel && !canConfirm && !canReturn && !canReview) {
    return null;
  }

  return (
    <section className="mt-4 rounded-2xl bg-white p-5">
      <h2 className="mb-3 text-sm font-bold text-laku-ink">
        {t("orderDetails.actionsTitle")}
      </h2>

      <div className="flex flex-wrap gap-3">
        {canPay ? (
          <Link
            href={`${detailsHref}/pay`}
            className="inline-flex items-center gap-2 rounded-lg bg-laku-blue px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
          >
            <CreditCard className="size-4" aria-hidden />
            {t("orderDetails.payOrder")}
          </Link>
        ) : null}

        {canConfirm ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setError(null);
              setFeedback(null);
              startTransition(async () => {
                const result = await markOrderReceivedAction({
                  orderDbId: order.id,
                  orderId: order.orderId,
                });
                if (result.ok) {
                  setFeedback(result.message ?? t("orderDetails.actionSuccess"));
                  router.refresh();
                } else {
                  setError(result.error ?? t("orderDetails.actionError"));
                }
              });
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-laku-buy px-4 py-2.5 text-sm font-bold text-white transition-colors hover:brightness-95 disabled:opacity-60"
          >
            <CheckCircle2 className="size-4" aria-hidden />
            {t("orderDetails.markReceived")}
          </button>
        ) : null}

        {canReview ? (
          <Link
            href={`${detailsHref}/review`}
            className="inline-flex items-center gap-2 rounded-lg border border-laku-line px-4 py-2.5 text-sm font-semibold text-laku-ink transition-colors hover:bg-laku-surface"
          >
            <Star className="size-4" aria-hidden />
            {hasExistingReview
              ? t("orderDetails.editReview")
              : t("orderDetails.writeReview")}
          </Link>
        ) : null}

        {canReturn ? (
          <Link
            href={`${detailsHref}/return`}
            className="inline-flex items-center gap-2 rounded-lg border border-laku-line px-4 py-2.5 text-sm font-semibold text-laku-ink transition-colors hover:bg-laku-surface"
          >
            <RotateCcw className="size-4" aria-hidden />
            {t("orderDetails.requestReturn")}
          </Link>
        ) : null}

        {canCancel ? (
          <Link
            href={`${detailsHref}/cancel`}
            className="inline-flex items-center gap-2 rounded-lg border border-laku-line px-4 py-2.5 text-sm font-semibold text-laku-alert transition-colors hover:bg-laku-alert/5"
          >
            <XCircle className="size-4" aria-hidden />
            {t("orderDetails.cancelOrder")}
          </Link>
        ) : null}
      </div>

      {feedback ? (
        <p className="mt-3 text-sm font-medium text-laku-buy">{feedback}</p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm font-medium text-laku-alert">{error}</p>
      ) : null}
    </section>
  );
}
