import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  MapPin,
  Package,
  Phone,
  Receipt,
  Truck,
  UserRound,
} from "lucide-react";

import OrderActions from "@/components/orders/OrderActions";
import ContactSellerButton from "@/components/messages/ContactSellerButton";
import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import FreeItemsBadge from "@/components/ui/FreeItemsBadge";
import { getTranslations } from "@/i18n/server";
import { getOrderById, getOrderReviews } from "@/lib/api/orders";
import { getSession } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/format";
import { displayPackageType } from "@/lib/packageLabel";
import { getOrderOfferDisplay } from "@/lib/promotion";
import {
  formatOrderDateTime,
  getDistributorUserId,
  getEstimatedDeliveryLabel,
  getOrderTimeline,
  getPaymentColor,
  getScheduleLabel,
  getSellerLogo,
  getSellerName,
  getStatusLabel,
  getStatusMessage,
  getStatusStyle,
  isReviewable,
} from "@/lib/orders";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("orderDetails.metaTitle"),
    robots: { index: false, follow: false },
  };
}

type Params = Promise<{ orderId: string }>;

export default async function OrderDetailsPage({ params }: { params: Params }) {
  const { orderId } = await params;
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
    orderId: decodeURIComponent(orderId),
    userId: session.user.id,
    token: session.token,
  });

  if (!order) notFound();

  const statusStyle = getStatusStyle(order.orderStatus);
  const timeline = getOrderTimeline(order, t);
  const estimate = getEstimatedDeliveryLabel(order, t);
  const schedule = getScheduleLabel(order, t.locale);
  const sellerLogo = getSellerLogo(order);
  const distributorId = getDistributorUserId(order);
  const productTotal = order.orderItems.reduce((total, item) => total + item.subtotal, 0);
  const anyItemPending = order.orderItems.some((item) => !(Number(item.subtotal) > 0));
  const pricingPending = anyItemPending || !(Number(order.totalAmount) > 0);
  const pendingPriceLabel = t("orderDetails.pendingPrice");
  const formatOrderMoney = (amount: number) =>
    Number(amount) > 0 ? formatCurrency(amount, t.locale) : pendingPriceLabel;
  const formatOrderTotal = () =>
    pricingPending ? pendingPriceLabel : formatCurrency(order.totalAmount, t.locale);

  const existingReviews = isReviewable(order)
    ? await getOrderReviews({
        orderId: order.orderId,
        token: session.token,
      })
    : null;
  const hasExistingReview = Boolean(existingReviews?.productReviews?.length);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Link
        href="/orders"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("orderDetails.backToOrders")}
      </Link>

      <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-laku-ink">{t("orderDetails.title")}</h1>
          <p className="mt-1 font-mono text-sm text-laku-muted">#{order.orderId}</p>
        </div>
        <span
          className="rounded-full px-3 py-1.5 text-sm font-semibold"
          style={{ backgroundColor: statusStyle.background, color: statusStyle.color }}
        >
          {getStatusLabel(order.orderStatus, t)}
        </span>
      </header>

      <section className="overflow-hidden rounded-2xl bg-white">
        <div className="bg-laku-blue px-5 py-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-white">
            <Truck className="size-5" aria-hidden />
            {getStatusMessage(order.orderStatus, t)}
          </h2>
          {estimate ? (
            <p className="mt-1 text-sm text-white/85">
              {t("orderDetails.estimatedArrival", { date: estimate })}
            </p>
          ) : null}
        </div>

        <div className="px-5 py-5">
          {timeline ? (
            <ol className="mb-5 space-y-3">
              {timeline.map((step) => (
                <li key={step.key} className="flex items-center gap-3">
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full ${
                      step.state === "upcoming"
                        ? "border-2 border-laku-line bg-white"
                        : "bg-laku-ship text-white"
                    }`}
                  >
                    {step.state !== "upcoming" ? (
                      <CheckCircle2 className="size-4" aria-hidden />
                    ) : null}
                  </span>
                  <span
                    className={`text-sm ${
                      step.state === "current"
                        ? "font-semibold text-laku-ink"
                        : step.state === "done"
                          ? "text-laku-ink"
                          : "text-laku-faint"
                    }`}
                  >
                    {step.label}
                  </span>
                </li>
              ))}
            </ol>
          ) : null}

          <dl className="space-y-3 border-t border-laku-line pt-4 text-sm">
            <DetailRow
              icon={UserRound}
              label={t("orderDetails.recipient")}
              value={order.contactPerson}
            />
            <DetailRow
              icon={Phone}
              label={t("orderDetails.phone")}
              value={order.contactPhone}
            />
            <DetailRow
              icon={MapPin}
              label={t("orderDetails.address")}
              value={order.deliveryAddress}
            />
            {schedule ? (
              <DetailRow
                icon={CalendarClock}
                label={t("orderDetails.schedule")}
                value={schedule}
              />
            ) : null}
            {order.assignedLogistics ? (
              <DetailRow
                icon={Truck}
                label={t("orderDetails.logistics")}
                value={order.assignedLogistics}
              />
            ) : null}
            {order.trackingNumber ? (
              <DetailRow
                icon={Package}
                label={t("orderDetails.trackingNumber")}
                value={order.trackingNumber}
              />
            ) : null}
            {order.deliveryNote ? (
              <DetailRow
                icon={Receipt}
                label={t("orderDetails.note")}
                value={order.deliveryNote}
              />
            ) : null}
          </dl>
        </div>
      </section>

      <section className="mt-4 rounded-2xl bg-white p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-laku-ink">
          <Building2 className="size-4 text-laku-blue" aria-hidden />
          {t("orderDetails.distributorInfo")}
        </h2>
        {distributorId ? (
          <Link
            href={`/distributor/${distributorId}`}
            className="flex items-center gap-3 transition-opacity hover:opacity-90"
          >
            <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-laku-blue/10 text-laku-blue">
              {sellerLogo ? (
                <Image src={sellerLogo} alt="" fill sizes="44px" className="object-cover" />
              ) : (
                <Building2 className="size-5" aria-hidden />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-laku-ink">
                {getSellerName(order, t)}
              </p>
              <p className="truncate text-xs text-laku-muted">
                {order.user?.company?.businessAddress ?? t("product.distributorFallback")}
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-laku-blue/10 text-laku-blue">
              {sellerLogo ? (
                <Image src={sellerLogo} alt="" fill sizes="44px" className="object-cover" />
              ) : (
                <Building2 className="size-5" aria-hidden />
              )}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-laku-ink">
                {getSellerName(order, t)}
              </p>
              <p className="truncate text-xs text-laku-muted">
                {order.user?.company?.businessAddress ?? t("product.distributorFallback")}
              </p>
            </div>
          </div>
        )}
        {distributorId ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href={`/seller/${distributorId}`}
              className="rounded-lg border border-laku-line px-3 py-1.5 text-xs font-semibold text-laku-ink transition-colors hover:bg-laku-surface"
            >
              {t("orderDetails.viewSellerInfo")}
            </Link>
            <Link
              href={`/distributor/${distributorId}/details`}
              className="rounded-lg border border-laku-line px-3 py-1.5 text-xs font-semibold text-laku-ink transition-colors hover:bg-laku-surface"
            >
              {t("orderDetails.viewDistributorDetails")}
            </Link>
          </div>
        ) : null}
      </section>

      <section className="mt-4 rounded-2xl bg-white p-5">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-laku-ink">
          <Package className="size-4 text-laku-blue" aria-hidden />
          {t("orderDetails.productInfo")}
        </h2>

        <ul className="divide-y divide-laku-line">
          {order.orderItems.map((item, index) => {
            const packageType = displayPackageType(item.packageType);
            const offer = getOrderOfferDisplay(item);
            const discountLabel =
              offer.percentOff != null
                ? t("orderDetails.percentOff", { percent: Math.round(offer.percentOff) })
                : offer.amountOff != null
                  ? t("orderDetails.amountOff", {
                      amount: formatCurrency(offer.amountOff, t.locale),
                    })
                  : null;
            return (
            <li key={`${item.productId ?? index}`} className="flex gap-3 py-3 first:pt-0">
              <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-laku-chip">
                {item.images?.[0] ? (
                  <Image
                    src={item.images[0]}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center">
                    <Package className="size-5 text-laku-faint" aria-hidden />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                {item.productId && !item.productDeleted ? (
                  <Link
                    href={`/product/${encodeURIComponent(item.productId)}`}
                    className="line-clamp-2 text-sm font-semibold text-laku-ink hover:text-laku-blue"
                  >
                    {item.productName ?? t("product.fallbackName")}
                  </Link>
                ) : (
                  <p className="line-clamp-2 text-sm font-semibold text-laku-ink">
                    {item.productName ?? t("product.fallbackName")}
                  </p>
                )}
                <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-laku-muted">
                  <span>
                    {item.variantNameSnapshot ? `${item.variantNameSnapshot} · ` : ""}
                    {packageType
                      ? t("orderDetails.itemUnits", {
                          quantity: item.packageQuantity ?? 1,
                          packageType,
                        })
                      : `×${item.packageQuantity ?? 1}`}
                  </span>
                  <FreeItemsBadge
                    count={offer.freePieces}
                    label={t("orderDetails.freeItems", { count: offer.freePieces })}
                  />
                </div>
              </div>

              <div className="shrink-0 text-right">
                {discountLabel ? (
                  <p className="mb-1 inline-flex rounded bg-laku-discount-bg px-1.5 py-0.5 text-[11px] font-semibold text-laku-discount-ink">
                    {discountLabel}
                  </p>
                ) : null}
                {offer.originalLineTotal != null ? (
                  <p className="text-xs text-laku-muted line-through">
                    {formatCurrency(offer.originalLineTotal, t.locale)}
                  </p>
                ) : null}
                <p className="text-sm font-semibold text-laku-ink">
                  {formatOrderMoney(item.subtotal)}
                </p>
              </div>
            </li>
            );
          })}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-laku-line pt-4 text-sm">
          <SummaryRow
            label={t("orderDetails.productTotal")}
            value={
              pricingPending ? pendingPriceLabel : formatCurrency(productTotal, t.locale)
            }
          />
          <SummaryRow
            label={
              order.shippingMethodLabel ??
              order.deliveryMethod ??
              t("orderDetails.shipping")
            }
            value={
              order.shippingFee > 0
                ? formatCurrency(order.shippingFee, t.locale)
                : t("orderDetails.shippingSeparate")
            }
            muted
          />
          {order.discounts > 0 ? (
            <SummaryRow
              label={t("orderDetails.discount")}
              value={`- ${formatCurrency(order.discounts, t.locale)}`}
            />
          ) : null}
          <div className="flex items-center justify-between border-t border-laku-line pt-3">
            <dt className="text-sm font-bold text-laku-ink">
              {t("orderDetails.orderTotal")}
            </dt>
            <dd className="text-lg font-bold text-laku-blue">
              {formatOrderTotal()}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-4 rounded-2xl bg-white p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-laku-ink">
          <CreditCard className="size-4 text-laku-blue" aria-hidden />
          {t("orderDetails.orderInfo")}
        </h2>
        <dl className="space-y-2.5 text-sm">
          <SummaryRow label={t("orderDetails.orderId")} value={order.orderId} />
          <SummaryRow
            label={t("orderDetails.paymentMethod")}
            value={order.paymentTerms ?? "-"}
          />
          <div className="flex items-center justify-between gap-4">
            <dt className="text-laku-muted">{t("orderDetails.paymentStatus")}</dt>
            <dd
              className="font-semibold"
              style={{ color: getPaymentColor(order.paymentStatus) }}
            >
              {order.paymentStatus === "Paid"
                ? t("orderDetails.paid")
                : t("orderDetails.unpaid")}
            </dd>
          </div>
          <SummaryRow
            label={t("orderDetails.orderDate")}
            value={formatOrderDateTime(order.orderDate ?? order.createdAt, t.locale)}
          />
          {order.paymentProofSubmittedAt ? (
            <SummaryRow
              label={t("orderDetails.proofSubmitted")}
              value={formatOrderDateTime(order.paymentProofSubmittedAt, t.locale)}
            />
          ) : null}
          {order.receivedAt ? (
            <SummaryRow
              label={t("orderDetails.receivedAt")}
              value={formatOrderDateTime(order.receivedAt, t.locale)}
            />
          ) : null}
          {order.cancellationReason ? (
            <SummaryRow
              label={t("orderDetails.cancelReason")}
              value={order.cancellationReason}
            />
          ) : null}
          {order.returnStatus ? (
            <SummaryRow
              label={t("orderDetails.returnStatus")}
              value={order.returnStatus}
            />
          ) : null}
        </dl>
      </section>

      <OrderActions order={order} hasExistingReview={hasExistingReview} />

      <section className="mt-4 rounded-2xl bg-white p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-laku-ink">
          <HelpCircle className="size-4 text-laku-blue" aria-hidden />
          {t("orderDetails.supportTitle")}
        </h2>
        <ul className="divide-y divide-laku-line">
          <SupportLink
            href={`/orders/${encodeURIComponent(order.orderId)}/return-info`}
            label={t("orderDetails.supportReturnInfo")}
          />
          <SupportLink
            href={`/orders/${encodeURIComponent(order.orderId)}/help`}
            label={t("orderDetails.supportHelpCenter")}
          />
          <SupportLink
            href={`/orders/${encodeURIComponent(order.orderId)}/invoice`}
            label={t("orderDetails.supportInvoice")}
          />
          {distributorId ? (
            <SupportLink
              href={`/seller/${distributorId}/report`}
              label={t("orderDetails.supportReport")}
            />
          ) : null}
        </ul>
      </section>

      {distributorId ? (
        <div className="mt-4 rounded-2xl bg-white p-5">
          <ContactSellerButton
            userId={session.user.id}
            distributorId={distributorId}
            name={getSellerName(order, t)}
            phone={order.user?.company?.businessPhone ?? null}
            logoUrl={sellerLogo}
            orderId={order.orderId}
          />
        </div>
      ) : null}
    </div>
  );
}

function SupportLink({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between gap-3 py-3 text-sm font-semibold text-laku-ink transition-colors hover:text-laku-blue"
      >
        {label}
        <span aria-hidden className="text-laku-faint">
          →
        </span>
      </Link>
    </li>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;

  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-laku-faint" aria-hidden />
      <div className="min-w-0">
        <dt className="text-xs text-laku-muted">{label}</dt>
        <dd className="text-sm text-laku-ink">{value}</dd>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-laku-muted">{label}</dt>
      <dd
        className={`text-right ${muted ? "text-laku-muted" : "font-medium text-laku-ink"}`}
      >
        {value}
      </dd>
    </div>
  );
}
