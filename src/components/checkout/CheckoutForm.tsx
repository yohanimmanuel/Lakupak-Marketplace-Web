"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
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
  getAvailableDeliveryOptions,
  getDistributorGroupKey,
  getDistributorGroupLabel,
  getPackagePrice,
  type DeliveryOptionId,
} from "@/lib/checkout";
import { displayPackageType } from "@/lib/packageLabel";
import { calculateProductPromotionGift } from "@/lib/promotion";
import { getSelectedMoq, resolveVariantPricing } from "@/lib/variants";

type Props = {
  lines: CheckoutLine[];
  /** Fallback when a group has no product-level shipping prefs. */
  deliveryOptions: ReturnType<typeof getAvailableDeliveryOptions>;
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

type GroupShipping = {
  delivery: DeliveryOptionId;
  preferredDate: string;
  preferredTime: string;
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
  const [payment, setPayment] = useState<string>(PAYMENT_METHODS[0].id);
  // One id per form mount — ties each distributor group orderId to this attempt.
  const [checkoutAttemptId] = useState(() => {
    const entropy = Math.floor(10_000_000 + Math.random() * 90_000_000);
    return `LKO-${Date.now()}${entropy}`;
  });

  const groups = useMemo(() => {
    const map = new Map<
      string,
      { label: string; lines: CheckoutLine[]; options: typeof deliveryOptions }
    >();
    for (const line of lines) {
      const key = getDistributorGroupKey(line.product);
      const existing = map.get(key);
      if (existing) {
        existing.lines.push(line);
      } else {
        map.set(key, {
          label: getDistributorGroupLabel(line.product),
          lines: [line],
          options: getAvailableDeliveryOptions([line.product]),
        });
      }
    }
    // Recompute options from full group products.
    for (const [key, group] of map) {
      group.options = getAvailableDeliveryOptions(
        group.lines.map((line) => line.product),
      );
      if (group.options.length === 0) group.options = deliveryOptions;
      map.set(key, group);
    }
    return map;
  }, [lines, deliveryOptions]);

  const [shippingByGroup, setShippingByGroup] = useState<
    Record<string, GroupShipping>
  >(() => {
    const initial: Record<string, GroupShipping> = {};
    for (const [key, group] of groups) {
      initial[key] = {
        delivery: (group.options[0]?.id ??
          deliveryOptions[0]?.id ??
          "seller_delivery") as DeliveryOptionId,
        preferredDate: "",
        preferredTime: "",
      };
    }
    return initial;
  });

  const subtotal = lines.reduce(
    (total, line) =>
      total + getPackagePrice(line.product, line.variant) * line.quantity,
    0,
  );

  const directVariant = lines[0]?.variant;
  const shippingPayload = useMemo(() => {
    const payload: Record<string, GroupShipping> = {};
    for (const [key, group] of groups) {
      payload[key] =
        shippingByGroup[key] ?? {
          delivery: (group.options[0]?.id ??
            deliveryOptions[0]?.id ??
            "seller_delivery") as DeliveryOptionId,
          preferredDate: "",
          preferredTime: "",
        };
    }
    return JSON.stringify(payload);
  }, [groups, shippingByGroup, deliveryOptions]);

  function updateGroup(key: string, patch: Partial<GroupShipping>) {
    setShippingByGroup((prev) => ({
      ...prev,
      [key]: {
        delivery: prev[key]?.delivery ?? "seller_delivery",
        preferredDate: prev[key]?.preferredDate ?? "",
        preferredTime: prev[key]?.preferredTime ?? "",
        ...patch,
      },
    }));
  }

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
      <input type="hidden" name="paymentMethod" value={payment} />
      <input type="hidden" name="checkoutAttemptId" value={checkoutAttemptId} />
      <input type="hidden" name="shippingByDistributor" value={shippingPayload} />

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

        {[...groups.entries()].map(([key, group]) => {
          const shipping = shippingByGroup[key] ?? {
            delivery: (group.options[0]?.id ?? "seller_delivery") as DeliveryOptionId,
            preferredDate: "",
            preferredTime: "",
          };
          const isPickup = shipping.delivery === "self_pickup";

          return (
            <section key={key} className="overflow-hidden rounded-2xl bg-white">
              <h2 className="flex items-center gap-2 border-b border-laku-line px-5 py-3.5 text-sm font-bold text-laku-ink">
                <Store className="size-4 text-laku-blue" aria-hidden />
                {group.label}
              </h2>

              <div className="border-b border-laku-line px-5 py-4">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-laku-muted">
                  <Truck className="size-3.5 text-laku-blue" aria-hidden />
                  {t("checkout.deliveryTitle")}
                </h3>
                <div className="space-y-2">
                  {group.options.map((option) => (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors ${
                        shipping.delivery === option.id
                          ? "border-laku-blue bg-laku-blue/5"
                          : "border-laku-line hover:border-laku-faint"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`deliveryChoice-${key}`}
                        checked={shipping.delivery === option.id}
                        onChange={() =>
                          updateGroup(key, {
                            delivery: option.id as DeliveryOptionId,
                          })
                        }
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

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block text-xs font-semibold text-laku-muted">
                    {isPickup
                      ? t("checkout.pickupDate")
                      : t("checkout.deliveryDate")}
                    <input
                      type="date"
                      value={shipping.preferredDate}
                      onChange={(event) =>
                        updateGroup(key, { preferredDate: event.target.value })
                      }
                      className="mt-1 h-10 w-full rounded-lg border border-laku-line px-3 text-sm text-laku-ink outline-none focus:border-laku-blue"
                    />
                  </label>
                  <label className="block text-xs font-semibold text-laku-muted">
                    {isPickup
                      ? t("checkout.pickupTime")
                      : t("checkout.deliveryTime")}
                    <input
                      type="time"
                      value={shipping.preferredTime}
                      onChange={(event) =>
                        updateGroup(key, { preferredTime: event.target.value })
                      }
                      className="mt-1 h-10 w-full rounded-lg border border-laku-line px-3 text-sm text-laku-ink outline-none focus:border-laku-blue"
                    />
                  </label>
                </div>
                <p className="mt-2 flex items-start gap-1.5 text-xs text-laku-muted">
                  <CalendarClock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  {t("checkout.scheduleNote")}
                </p>
              </div>

              <ul className="divide-y divide-laku-line">
                {group.lines.map((line) => {
                  const packageType = displayPackageType(line.product.packageType);
                  const { option } = resolveVariantPricing(
                    line.product,
                    line.variant,
                  );
                  const moq = getSelectedMoq(line.product, option);
                  const freeQty =
                    calculateProductPromotionGift(
                      line.product,
                      line.quantity,
                      moq,
                    )?.freeQty ?? 0;
                  return (
                    <li
                      key={`${line.product.id}-${line.variant ?? "Default"}`}
                      className="flex gap-4 px-5 py-4"
                    >
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
                          <Package className="m-auto size-6 text-laku-faint" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-laku-ink">
                          {line.product.name}
                        </p>
                        <p className="mt-1 text-xs text-laku-muted">
                          {line.quantity} {packageType}
                          {line.variant && line.variant !== "Default"
                            ? ` · ${line.variant}`
                            : ""}
                        </p>
                        {freeQty > 0 ? (
                          <FreeItemsBadge
                            count={freeQty}
                            label={t("checkout.freeItems", { count: freeQty })}
                            className="mt-1"
                          />
                        ) : null}
                      </div>
                      <p className="shrink-0 text-sm font-bold text-laku-ink">
                        {formatCurrency(
                          getPackagePrice(line.product, line.variant) *
                            line.quantity,
                          t.locale,
                        )}
                      </p>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

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
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24">
        <section className="rounded-2xl bg-white p-5">
          <h2 className="text-sm font-bold text-laku-ink">
            {t("checkout.summaryTitle")}
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-laku-muted">{t("checkout.subtotal")}</dt>
              <dd className="font-semibold text-laku-ink">
                {formatCurrency(subtotal, t.locale)}
              </dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-laku-line pt-3 text-base">
              <dt className="font-bold text-laku-ink">{t("checkout.totalPayment")}</dt>
              <dd className="font-bold text-laku-blue">
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
            <p className="mt-4 rounded-lg bg-laku-discount-bg px-3 py-2 text-sm font-medium text-laku-discount-ink">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-laku-blue px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark disabled:opacity-60"
          >
            <ShieldCheck className="size-4" aria-hidden />
            {pending ? t("checkout.placing") : t("checkout.placeOrder")}
          </button>
          <p className="mt-3 text-xs text-laku-muted">{t("checkout.terms")}</p>
        </section>
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
        className="h-10 w-full rounded-lg border border-laku-line px-3.5 text-sm text-laku-ink outline-none transition-colors focus:border-laku-blue"
      />
    </div>
  );
}
