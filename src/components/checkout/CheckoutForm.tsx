"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  CalendarClock,
  ClipboardList,
  MapPin,
  Package,
  ShieldCheck,
  Store,
  Truck,
  User,
  Wallet,
} from "lucide-react";

import { placeOrderAction, updateOrderDetailsAction } from "@/app/actions/orders";
import type { CheckoutLine } from "@/app/checkout/page";
import { useTranslations } from "@/i18n/client";
import FreeItemsBadge from "@/components/ui/FreeItemsBadge";
import type { MarketplaceAddress } from "@/lib/api/addresses";
import {
  getAvailableDeliveryOptions,
  getDistributorGroupKey,
  getDistributorGroupLabel,
  PAYMENT_METHODS,
  type DeliveryOptionId,
  type PaymentMethodId,
} from "@/lib/checkout";
import { getBaseLineTotal } from "@/lib/cartPricing";
import { formatCurrency } from "@/lib/format";
import { displayPackageType } from "@/lib/packageLabel";
import { calculateProductPromotionGift } from "@/lib/promotion";
import { getSelectedMoq, resolveVariantPricing } from "@/lib/variants";

type Props = {
  lines: CheckoutLine[];
  /** Fallback when a group has no product-level shipping prefs. */
  deliveryOptions: ReturnType<typeof getAvailableDeliveryOptions>;
  source: "cart" | "direct" | "editCart";
  productId: string | null;
  appendOrderId?: string | null;
  editOrderId?: string | null;
  initialDelivery?: DeliveryOptionId | null;
  initialPayment?: PaymentMethodId | null;
  addresses: MarketplaceAddress[];
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
  appendOrderId,
  editOrderId,
  initialDelivery,
  initialPayment,
  addresses,
  buyer,
}: Props) {
  const t = useTranslations();
  const editingExisting = Boolean(editOrderId) && !appendOrderId;
  const [state, formAction, pending] = useActionState(
    editingExisting ? updateOrderDetailsAction : placeOrderAction,
    INITIAL,
  );
  const [checkoutAttemptId] = useState(() => {
    const entropy = Math.floor(10_000_000 + Math.random() * 90_000_000);
    return `LKO-${Date.now()}${entropy}`;
  });

  const defaultAddressId =
    addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null;
  const [selectedAddressId, setSelectedAddressId] = useState<number | "new">(
    defaultAddressId ?? "new",
  );
  const [newAddress, setNewAddress] = useState({
    line: buyer.address,
    city: "",
    postalCode: "",
    landmark: "",
  });
  const [poReference, setPoReference] = useState("");
  const [noteToDistributor, setNoteToDistributor] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>(
    initialPayment ?? "cod",
  );

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
    for (const [key, group] of map) {
      group.options = getAvailableDeliveryOptions(
        group.lines.map((line) => line.product),
      );
      if (group.options.length === 0) group.options = deliveryOptions;
      map.set(key, group);
    }
    return map;
  }, [lines, deliveryOptions]);

  const lineTotalFor = (line: CheckoutLine) =>
    typeof line.displaySubtotal === "number"
      ? line.displaySubtotal
      : getBaseLineTotal(line.product, line.variant, line.quantity);
  const distributorSummaries = [...groups.entries()].map(([key, group]) => ({
    key,
    distributor: group.label || t("product.distributorFallback"),
    count: group.lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: group.lines.reduce((sum, line) => sum + lineTotalFor(line), 0),
  }));
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);
  const subtotal = lines.reduce((sum, line) => sum + lineTotalFor(line), 0);

  const [shippingByGroup, setShippingByGroup] = useState<
    Record<string, GroupShipping>
  >(() => {
    const initial: Record<string, GroupShipping> = {};
    for (const [key, group] of groups) {
      const preferred = initialDelivery && group.options.some((option) => option.id === initialDelivery)
        ? initialDelivery
        : undefined;
      initial[key] = {
        delivery: (preferred ??
          group.options[0]?.id ??
          deliveryOptions[0]?.id ??
          "seller_delivery") as DeliveryOptionId,
        preferredDate: "",
        preferredTime: "",
      };
    }
    return initial;
  });

  const submittedLine = productId
    ? lines.filter((line) => line.product.id === productId).at(-1) ?? lines[0]
    : lines[0];
  const directVariant = submittedLine?.variant;
  const shippingPayload = useMemo(() => {
    const payload: Record<
      string,
      { delivery: string; preferredDate: string; preferredTime: string }
    > = {};
    for (const [key, group] of groups) {
      const shipping =
        shippingByGroup[key] ??
        ({
          delivery: (group.options[0]?.id ??
            deliveryOptions[0]?.id ??
            "seller_delivery") as DeliveryOptionId,
          preferredDate: "",
          preferredTime: "",
        } satisfies GroupShipping);
      payload[key] = {
        delivery: shipping.delivery,
        preferredDate: shipping.preferredDate,
        preferredTime: shipping.preferredTime.trim(),
      };
    }
    return JSON.stringify(payload);
  }, [groups, shippingByGroup, deliveryOptions]);

  const resolvedAddress = useMemo(() => {
    if (selectedAddressId === "new") {
      const parts = [
        newAddress.line.trim(),
        newAddress.city.trim(),
        newAddress.postalCode.trim(),
        newAddress.landmark.trim()
          ? t("checkout.landmarkPrefix", { landmark: newAddress.landmark.trim() })
          : "",
      ].filter(Boolean);
      return parts.join(", ");
    }
    const match = addresses.find((a) => a.id === selectedAddressId);
    return match?.address?.trim() || buyer.address;
  }, [selectedAddressId, newAddress, addresses, buyer.address, t]);

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

  const contactName = buyer.name.trim();
  const contactPhone = buyer.phone.trim();
  const contactIncomplete = !contactName || !contactPhone;

  return (
    <form
      action={formAction}
      className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start"
    >
      <input type="hidden" name="source" value={source} />
      {productId ? <input type="hidden" name="productId" value={productId} /> : null}
      {appendOrderId ? (
        <input type="hidden" name="appendOrderId" value={appendOrderId} />
      ) : null}
      {editOrderId ? <input type="hidden" name="orderId" value={editOrderId} /> : null}
      {source === "editCart" ? (
        <input
          type="hidden"
          name="editCartLines"
          value={JSON.stringify(
            lines
              .filter((line) => line.displaySubtotal == null)
              .map((line) => ({
                productId: line.product.id,
                quantity: line.quantity,
                variant: line.variant ?? "Default",
              })),
          )}
        />
      ) : null}
      {productId ? (
        <input type="hidden" name="quantity" value={submittedLine?.quantity ?? 1} />
      ) : null}
      {productId && directVariant ? (
        <input type="hidden" name="variant" value={directVariant} />
      ) : null}
      <input type="hidden" name="paymentMethod" value={paymentMethod} />
      <input type="hidden" name="checkoutAttemptId" value={checkoutAttemptId} />
      <input type="hidden" name="shippingByDistributor" value={shippingPayload} />
      <input type="hidden" name="deliveryAddress" value={resolvedAddress} />
      <input type="hidden" name="contactPerson" value={contactName} />
      <input type="hidden" name="contactPhone" value={contactPhone} />
      <input type="hidden" name="storeName" value={buyer.storeName} />
      <input type="hidden" name="poReference" value={poReference} />
      <input type="hidden" name="noteToDistributor" value={noteToDistributor} />

      <div className="space-y-4">
        {editingExisting && distributorSummaries[0] ? (
          <section className="rounded-2xl bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-bold text-laku-ink">
              <Store className="size-4 text-laku-blue" aria-hidden />
              {t("distributorDetails.infoTitle")}
            </h2>
            <p className="mt-3 text-base font-semibold text-laku-ink">
              {distributorSummaries[0].distributor}
            </p>
            {lines[0]?.product.seller?.company?.industryType ? (
              <p className="mt-1 text-sm text-laku-muted">
                {t("distributorDetails.industry")}: {lines[0].product.seller.company.industryType}
              </p>
            ) : null}
            {lines[0]?.product.seller?.name &&
            lines[0].product.seller.name !== distributorSummaries[0].distributor ? (
              <p className="mt-1 text-sm text-laku-muted">
                {lines[0].product.seller.name}
              </p>
            ) : null}
          </section>
        ) : null}
        <section className="rounded-2xl bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-laku-ink">
            <MapPin className="size-4 text-laku-blue" aria-hidden />
            {t("checkout.addressTitle")}
          </h2>

          {addresses.length > 0 ? (
            <div className="mt-4 space-y-2">
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors ${
                    selectedAddressId === address.id
                      ? "border-laku-blue bg-laku-blue/5"
                      : "border-laku-line hover:border-laku-faint"
                  }`}
                >
                  <input
                    type="radio"
                    name="addressChoice"
                    checked={selectedAddressId === address.id}
                    onChange={() => setSelectedAddressId(address.id)}
                    className="mt-0.5 size-4 accent-laku-blue"
                  />
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2 text-sm font-semibold text-laku-ink">
                      {address.label === "home" ||
                      address.label === "work" ||
                      address.label === "store"
                        ? t(`addresses.labels.${address.label}`)
                        : address.label?.trim() || t("checkout.savedAddress")}
                      {address.isDefault ? (
                        <span className="rounded bg-laku-blue/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-laku-blue">
                          {t("addresses.defaultBadge")}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block text-xs text-laku-muted">
                      {address.address}
                    </span>
                  </span>
                </label>
              ))}
              <label
                className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors ${
                  selectedAddressId === "new"
                    ? "border-laku-blue bg-laku-blue/5"
                    : "border-laku-line hover:border-laku-faint"
                }`}
              >
                <input
                  type="radio"
                  name="addressChoice"
                  checked={selectedAddressId === "new"}
                  onChange={() => setSelectedAddressId("new")}
                  className="mt-0.5 size-4 accent-laku-blue"
                />
                <span className="text-sm font-semibold text-laku-ink">
                  {t("checkout.useNewAddress")}
                </span>
              </label>
            </div>
          ) : null}

          {selectedAddressId === "new" || addresses.length === 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="addressLine"
                  className="mb-1.5 block text-xs font-semibold text-laku-muted"
                >
                  {t("checkout.addressLine")}
                </label>
                <textarea
                  id="addressLine"
                  rows={2}
                  required={selectedAddressId === "new" || addresses.length === 0}
                  value={newAddress.line}
                  onChange={(event) =>
                    setNewAddress((prev) => ({ ...prev, line: event.target.value }))
                  }
                  placeholder={t("checkout.addressPlaceholder")}
                  className="w-full rounded-lg border border-laku-line px-3.5 py-2.5 text-sm text-laku-ink outline-none transition-colors focus:border-laku-blue"
                />
              </div>
              <div>
                <label
                  htmlFor="city"
                  className="mb-1.5 block text-xs font-semibold text-laku-muted"
                >
                  {t("checkout.city")}
                </label>
                <input
                  id="city"
                  value={newAddress.city}
                  onChange={(event) =>
                    setNewAddress((prev) => ({ ...prev, city: event.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-laku-line px-3.5 text-sm text-laku-ink outline-none focus:border-laku-blue"
                />
              </div>
              <div>
                <label
                  htmlFor="postalCode"
                  className="mb-1.5 block text-xs font-semibold text-laku-muted"
                >
                  {t("checkout.postalCode")}
                </label>
                <input
                  id="postalCode"
                  value={newAddress.postalCode}
                  onChange={(event) =>
                    setNewAddress((prev) => ({
                      ...prev,
                      postalCode: event.target.value,
                    }))
                  }
                  className="h-10 w-full rounded-lg border border-laku-line px-3.5 text-sm text-laku-ink outline-none focus:border-laku-blue"
                />
              </div>
              <div className="sm:col-span-2">
                <label
                  htmlFor="landmark"
                  className="mb-1.5 block text-xs font-semibold text-laku-muted"
                >
                  {t("checkout.landmark")}
                </label>
                <input
                  id="landmark"
                  value={newAddress.landmark}
                  onChange={(event) =>
                    setNewAddress((prev) => ({
                      ...prev,
                      landmark: event.target.value,
                    }))
                  }
                  placeholder={t("checkout.landmarkPlaceholder")}
                  className="h-10 w-full rounded-lg border border-laku-line px-3.5 text-sm text-laku-ink outline-none focus:border-laku-blue"
                />
              </div>
            </div>
          ) : null}

          <p className="mt-3 text-xs text-laku-muted">
            <Link
              href="/account/addresses"
              className="font-semibold text-laku-blue hover:underline"
            >
              {t("checkout.manageAddresses")}
            </Link>
          </p>
        </section>

        <section className="rounded-2xl bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-laku-ink">
            <User className="size-4 text-laku-blue" aria-hidden />
            {t("checkout.contactTitle")}
          </h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-xs font-semibold text-laku-muted">
                {t("checkout.recipientName")}
              </dt>
              <dd className="mt-1 font-medium text-laku-ink">
                {buyer.name || t("checkout.notSet")}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-laku-muted">
                {t("checkout.phone")}
              </dt>
              <dd className="mt-1 font-medium text-laku-ink">
                {buyer.phone || t("checkout.notSet")}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold text-laku-muted">
                {t("checkout.email")}
              </dt>
              <dd className="mt-1 font-medium text-laku-ink">
                {buyer.email || t("checkout.notSet")}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-laku-muted">
            {t("checkout.contactReadOnly")}{" "}
            <Link
              href="/account"
              className="font-semibold text-laku-blue hover:underline"
            >
              {t("checkout.editInAccount")}
            </Link>
          </p>
          {!contactPhone ? (
            <p className="mt-3 rounded-lg bg-laku-alert/10 px-3 py-2 text-xs font-medium text-laku-alert">
              {t("checkout.errors.phone")}{" "}
              <Link
                href="/account"
                className="font-semibold underline hover:text-laku-alert"
              >
                {t("checkout.editInAccount")}
              </Link>
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-laku-ink">
            <Wallet className="size-4 text-laku-blue" aria-hidden />
            {t("checkout.paymentTitle")}
          </h2>
          <div className="mt-4 space-y-2">
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method.id}
                className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors ${
                  paymentMethod === method.id
                    ? "border-laku-blue bg-laku-blue/5"
                    : "border-laku-line hover:border-laku-faint"
                }`}
              >
                <input
                  type="radio"
                  name="paymentChoice"
                  checked={paymentMethod === method.id}
                  onChange={() => setPaymentMethod(method.id)}
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

              <ul className="divide-y divide-laku-line border-b border-laku-line">
                {group.lines.map((line, lineIndex) => {
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
                  const lineTotal = lineTotalFor(line);
                  return (
                    <li
                      key={`${line.product.id}-${line.variant ?? "Default"}-${lineIndex}`}
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
                          {t("checkout.lineQty", {
                            quantity: line.quantity,
                            packageType,
                          })}
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
                      {lineTotal > 0 ? (
                        <p className="shrink-0 text-sm font-bold text-laku-blue">
                          {formatCurrency(lineTotal, t.locale)}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>

              {editOrderId || appendOrderId ? (
                <div className="border-b border-laku-line px-5 py-4">
                  <Link
                    href={`/search?appendOrderId=${encodeURIComponent(editOrderId || appendOrderId || "")}`}
                    className="inline-flex w-full items-center justify-center rounded-lg border border-laku-blue bg-white px-4 py-3 text-sm font-bold text-laku-blue transition-colors hover:bg-laku-blue/5"
                  >
                    {t("orderDetails.addMoreProducts")}
                  </Link>
                </div>
              ) : null}

              <div className="px-5 py-4">
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

                {editingExisting ? null : (
                  <>
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
                  </>
                )}
              </div>
            </section>
          );
        })}

        {editingExisting ? null : (
        <section className="rounded-2xl bg-white p-5">
          <h2 className="flex items-center gap-2 text-sm font-bold text-laku-ink">
            <ClipboardList className="size-4 text-laku-blue" aria-hidden />
            {t("checkout.poNotesTitle")}
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="poReference"
                className="mb-1.5 block text-xs font-semibold text-laku-muted"
              >
                {t("checkout.poReference")}
              </label>
              <input
                id="poReference"
                value={poReference}
                onChange={(event) => setPoReference(event.target.value)}
                placeholder={t("checkout.poReferencePlaceholder")}
                className="h-10 w-full rounded-lg border border-laku-line px-3.5 text-sm text-laku-ink outline-none focus:border-laku-blue"
              />
            </div>
            <div>
              <label
                htmlFor="noteToDistributor"
                className="mb-1.5 block text-xs font-semibold text-laku-muted"
              >
                {t("checkout.noteToDistributor")}
              </label>
              <textarea
                id="noteToDistributor"
                rows={3}
                value={noteToDistributor}
                onChange={(event) => setNoteToDistributor(event.target.value)}
                placeholder={t("checkout.noteToDistributorPlaceholder")}
                className="w-full rounded-lg border border-laku-line px-3.5 py-2.5 text-sm text-laku-ink outline-none focus:border-laku-blue"
              />
            </div>
          </div>
        </section>
        )}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-24">
        <section className="rounded-2xl bg-white p-5">
          <h2 className="text-sm font-bold text-laku-ink">
            {t("checkout.summaryTitle")}
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-laku-muted">{t("checkout.itemCount")}</dt>
              <dd className="font-semibold text-laku-ink">
                {t("checkout.qtyBadge", { count: itemCount })}
              </dd>
            </div>
            <div className="space-y-2 border-t border-laku-line pt-3">
              {distributorSummaries.map((group) => (
                <div key={group.key} className="space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 flex-1 font-semibold break-words text-laku-ink">
                      {t("checkout.distributorGroupLine", {
                        distributor: group.distributor,
                        count: group.count,
                      })}
                    </p>
                    {group.subtotal > 0 ? (
                      <p className="shrink-0 font-medium text-laku-ink">
                        {formatCurrency(group.subtotal, t.locale)}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-xs text-laku-muted">
                    {t("checkout.pricingNote", { distributor: group.distributor })}
                  </p>
                </div>
              ))}
            </div>
            {subtotal > 0 ? (
              <div className="flex justify-between gap-4 border-t border-laku-line pt-3">
                <dt className="font-semibold text-laku-ink">{t("checkout.subtotal")}</dt>
                <dd className="font-bold text-laku-blue">
                  {formatCurrency(subtotal, t.locale)}
                </dd>
              </div>
            ) : null}
          </dl>

          {subtotal > 0 ? (
            <p className="mt-2 text-xs text-laku-muted">{t("checkout.basePriceNote")}</p>
          ) : null}

          {groups.size > 1 ? (
            <p className="mt-3 text-xs text-laku-muted">
              {t("checkout.splitNote", { count: groups.size })}
            </p>
          ) : null}

          {state.error ? (
            <p className="mt-4 rounded-lg bg-laku-discount-bg px-3 py-2 text-sm font-medium text-laku-discount-ink">
              {state.error}
            </p>
          ) : null}

          {appendOrderId ? (
            <p className="mt-4 text-sm font-semibold text-laku-blue">
              {t("checkout.addingToOrder", { orderId: appendOrderId })}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={
              pending ||
              !resolvedAddress.trim() ||
              contactIncomplete
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-laku-blue px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark disabled:opacity-60"
          >
            <ShieldCheck className="size-4" aria-hidden />
            {pending
              ? t(editingExisting ? "checkout.confirming" : appendOrderId ? "checkout.adding" : "checkout.submitting")
              : t(editingExisting ? "checkout.confirm" : appendOrderId ? "checkout.addToOrder" : "checkout.submitPo")}
          </button>
          <p className="mt-3 text-xs text-laku-muted">{t("checkout.terms")}</p>
        </section>
      </aside>
    </form>
  );
}
