"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import {
  CalendarClock,
  CreditCard,
  MapPin,
  Package,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";

import { placeOrderAction } from "@/app/actions/orders";
import type { CheckoutLine } from "@/app/checkout/page";
import { useTranslations } from "@/i18n/client";
import { formatCurrency } from "@/lib/format";
import FreeItemsBadge from "@/components/ui/FreeItemsBadge";
import {
  PAYMENT_METHODS,
  getPackagePrice,
  getSellerKey,
  type DeliveryOption,
} from "@/lib/checkout";
import { displayPackageType } from "@/lib/packageLabel";
import { calculateProductPromotionGift } from "@/lib/promotion";
import { getSelectedMoq, resolveVariantPricing } from "@/lib/variants";

type Props = {
  lines: CheckoutLine[];
  deliveryOptions: DeliveryOption[];
  source: "cart" | "direct";
  productId: string | null;
  buyer: {
    name: string;
    phone: string;
    storeName: string;
    address: string;
    email: string;
  };
};

const INITIAL = { ok: false } as const;

export default function CheckoutForm({
  lines,
  deliveryOptions,
  source,
  productId,
  buyer,
}: Props) {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(placeOrderAction, INITIAL);
  const [delivery, setDelivery] = useState(deliveryOptions[0]?.id ?? "seller_delivery");
  const [payment, setPayment] = useState<string>(PAYMENT_METHODS[0].id);

  const subtotal = lines.reduce(
    (total, line) =>
      total + getPackagePrice(line.product, line.variant) * line.quantity,
    0,
  );

  const groups = new Map<string, CheckoutLine[]>();
  for (const line of lines) {
    const key = getSellerKey(line.product);
    groups.set(key, [...(groups.get(key) ?? []), line]);
  }

  const isPickup = delivery === "self_pickup";
  const directVariant = lines[0]?.variant;

  return (
    <form
      action={formAction}
      className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start"
    >
      <input type="hidden" name="source" value={source} />
      {productId ? <input type="hidden" name="productId" value={productId} /> : null}
      {productId ? (
        <input type="hidden" name="quantity" value={lines[0]?.quantity ?? 1} />
      ) : null}
      {productId && directVariant ? (
        <input type="hidden" name="variant" value={directVariant} />
      ) : null}
      <input type="hidden" name="deliveryOption" value={delivery} />
      <input type="hidden" name="paymentMethod" value={payment} />

      <div className="space-y-4">
        <section className="rounded-2xl bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-laku-ink">
            <MapPin className="size-4 text-laku-blue" aria-hidden />
            {t("checkout.addressTitle")}
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              name="contactPerson"
              label={t("checkout.recipientName")}
              defaultValue={buyer.name}
              required
            />
            <Field
              name="contactPhone"
              label={t("checkout.phone")}
              type="tel"
              defaultValue={buyer.phone}
              required
            />
            <Field
              name="storeName"
              label={t("checkout.storeName")}
              defaultValue={buyer.storeName}
            />
            <div className="sm:col-span-2">
              <label
                htmlFor="deliveryAddress"
                className="mb-1.5 block text-xs font-semibold text-laku-muted"
              >
                {t("checkout.fullAddress")}
              </label>
              <textarea
                id="deliveryAddress"
                name="deliveryAddress"
                rows={3}
                required
                defaultValue={buyer.address}
                placeholder={t("checkout.addressPlaceholder")}
                className="w-full rounded-lg border border-laku-line px-3.5 py-2.5 text-sm text-laku-ink outline-none transition-colors focus:border-laku-blue"
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-laku-muted">{t("checkout.addressSaveNote")}</p>
        </section>

        <section className="rounded-2xl bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-laku-ink">
            <Truck className="size-4 text-laku-blue" aria-hidden />
            {t("checkout.deliveryTitle")}
          </h2>

          <div className="mt-4 space-y-2.5">
            {deliveryOptions.map((option) => (
              <label
                key={option.id}
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
                  delivery === option.id
                    ? "border-laku-blue bg-laku-blue/5"
                    : "border-laku-line hover:border-laku-faint"
                }`}
              >
                <input
                  type="radio"
                  name="deliveryChoice"
                  checked={delivery === option.id}
                  onChange={() => setDelivery(option.id)}
                  className="mt-0.5 size-4 accent-laku-blue"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-laku-ink">
                    {t(option.labelKey)}
                  </span>
                  <span className="mt-0.5 block text-xs text-laku-muted">
                    {t(option.descriptionKey)}
                  </span>
                </span>
              </label>
            ))}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              name="preferredDate"
              type="date"
              label={
                isPickup ? t("checkout.pickupDate") : t("checkout.deliveryDate")
              }
            />
            <Field
              name="preferredTime"
              type="time"
              label={
                isPickup ? t("checkout.pickupTime") : t("checkout.deliveryTime")
              }
            />
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-xs text-laku-muted">
            <CalendarClock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {t("checkout.scheduleNote")}
          </p>
        </section>

        <section className="rounded-2xl bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-laku-ink">
            <CreditCard className="size-4 text-laku-blue" aria-hidden />
            {t("checkout.paymentTitle")}
          </h2>

          <div className="mt-4 space-y-2.5">
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method.id}
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
                  payment === method.id
                    ? "border-laku-blue bg-laku-blue/5"
                    : "border-laku-line hover:border-laku-faint"
                }`}
              >
                <input
                  type="radio"
                  name="paymentChoice"
                  checked={payment === method.id}
                  onChange={() => setPayment(method.id)}
                  className="mt-0.5 size-4 accent-laku-blue"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-laku-ink">
                    {t(method.labelKey)}
                  </span>
                  <span className="mt-0.5 block text-xs text-laku-muted">
                    {t(method.descriptionKey)}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </section>

        {[...groups.entries()].map(([seller, sellerLines]) => (
          <section key={seller} className="overflow-hidden rounded-2xl bg-white">
            <h2 className="flex items-center gap-2 border-b border-laku-line px-5 py-3.5 text-sm font-bold text-laku-ink">
              <Store className="size-4 text-laku-blue" aria-hidden />
              {seller}
            </h2>
            <ul className="divide-y divide-laku-line">
              {sellerLines.map((line) => {
                const packageType = displayPackageType(line.product.packageType);
                const { option } = resolveVariantPricing(line.product, line.variant);
                const moq = getSelectedMoq(line.product, option);
                const freeQty =
                  calculateProductPromotionGift(line.product, line.quantity, moq)
                    ?.freeQty ?? 0;
                return (
                  <li key={`${line.product.id}-${line.variant ?? "Default"}`} className="flex gap-4 px-5 py-4">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-laku-chip">
                      {line.product.images?.[0] ? (
                        <Image
                          src={line.product.images[0]}
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
                      <p className="line-clamp-2 text-sm font-semibold text-laku-ink">
                        {line.product.name}
                      </p>
                      {line.variant && line.variant !== "Default" ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-laku-muted">
                          {line.variant}
                        </p>
                      ) : null}
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-laku-muted">
                        <span>
                          {packageType
                            ? t("checkout.lineSummaryWithPackage", {
                                quantity: line.quantity,
                                packageType,
                                price: formatCurrency(
                                  getPackagePrice(line.product, line.variant),
                                  t.locale,
                                ),
                              })
                            : t("checkout.lineSummary", {
                                quantity: line.quantity,
                                price: formatCurrency(
                                  getPackagePrice(line.product, line.variant),
                                  t.locale,
                                ),
                              })}
                        </span>
                        <FreeItemsBadge
                          count={freeQty}
                          label={t("checkout.freeItems", { count: freeQty })}
                        />
                      </div>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-laku-ink">
                      {formatCurrency(
                        getPackagePrice(line.product, line.variant) * line.quantity,
                        t.locale,
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <aside className="rounded-2xl bg-white p-5 lg:sticky lg:top-24">
        <h2 className="text-sm font-bold text-laku-ink">{t("checkout.summaryTitle")}</h2>

        <dl className="mt-4 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-laku-muted">{t("checkout.subtotal")}</dt>
            <dd className="font-medium text-laku-ink">
              {formatCurrency(subtotal, t.locale)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-laku-muted">{t("checkout.shipping")}</dt>
            <dd className="text-right text-xs text-laku-muted">
              {t("checkout.shippingNote")}
            </dd>
          </div>
          <div className="flex justify-between border-t border-laku-line pt-3">
            <dt className="font-bold text-laku-ink">{t("checkout.totalPayment")}</dt>
            <dd className="text-lg font-bold text-laku-blue">
              {formatCurrency(subtotal, t.locale)}
            </dd>
          </div>
        </dl>

        {groups.size > 1 ? (
          <p className="mt-3 rounded-lg bg-laku-surface px-3 py-2 text-xs text-laku-muted">
            {t("checkout.splitNote", { count: groups.size })}
          </p>
        ) : null}

        {state.error ? (
          <p className="mt-3 rounded-lg bg-laku-discount-bg px-3 py-2 text-sm font-medium text-laku-discount-ink">
            {state.error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="mt-4 w-full rounded-lg bg-laku-blue px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? t("checkout.placing") : t("checkout.placeOrder")}
        </button>

        <p className="mt-3 flex items-start gap-1.5 text-xs text-laku-muted">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-laku-ship" aria-hidden />
          {t("checkout.terms")}
        </p>
      </aside>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  defaultValue,
  required,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-xs font-semibold text-laku-muted">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-laku-line px-3.5 py-2.5 text-sm text-laku-ink outline-none transition-colors focus:border-laku-blue"
      />
    </div>
  );
}
