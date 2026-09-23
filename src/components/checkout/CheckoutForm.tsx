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
} from "lucide-react";

import { placeOrderAction } from "@/app/actions/orders";
import type { CheckoutLine } from "@/app/checkout/page";
import { useTranslations } from "@/i18n/client";
import FreeItemsBadge from "@/components/ui/FreeItemsBadge";
import type { MarketplaceAddress } from "@/lib/api/addresses";
import {
  getAvailableDeliveryOptions,
  getDistributorGroupKey,
  getDistributorGroupLabel,
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
  addresses: MarketplaceAddress[];
  buyer: {
    name: string;
    phone: string;
    storeName: string;
    address: string;
    email: string;
  };
};

type DeliverySlot = "morning" | "afternoon" | "any";

type GroupShipping = {
  delivery: DeliveryOptionId;
  preferredDate: string;
  preferredSlot: DeliverySlot;
};

const INITIAL = { ok: false } as const;

const SLOT_TIME: Record<DeliverySlot, string> = {
  morning: "09:00",
  afternoon: "14:00",
  any: "",
};

export default function CheckoutForm({
  lines,
  deliveryOptions,
  source,
  productId,
  addresses,
  buyer,
}: Props) {
  const t = useTranslations();
  const [state, formAction, pending] = useActionState(placeOrderAction, INITIAL);
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

  const distributorLabel =
    [...groups.values()][0]?.label ?? t("product.distributorFallback");
  const multiDistributor = groups.size > 1;
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

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
        preferredSlot: "any",
      };
    }
    return initial;
  });

  const directVariant = lines[0]?.variant;
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
          preferredSlot: "any" as DeliverySlot,
        } satisfies GroupShipping);
      payload[key] = {
        delivery: shipping.delivery,
        preferredDate: shipping.preferredDate,
        preferredTime: SLOT_TIME[shipping.preferredSlot],
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
        preferredSlot: prev[key]?.preferredSlot ?? "any",
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
      <input type="hidden" name="paymentMethod" value="cod" />
      <input type="hidden" name="checkoutAttemptId" value={checkoutAttemptId} />
      <input type="hidden" name="shippingByDistributor" value={shippingPayload} />
      <input type="hidden" name="deliveryAddress" value={resolvedAddress} />
      <input type="hidden" name="contactPerson" value={contactName} />
      <input type="hidden" name="contactPhone" value={contactPhone} />
      <input type="hidden" name="storeName" value={buyer.storeName} />
      <input type="hidden" name="poReference" value={poReference} />
      <input type="hidden" name="noteToDistributor" value={noteToDistributor} />

      <div className="space-y-4">
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

        {[...groups.entries()].map(([key, group]) => {
          const shipping = shippingByGroup[key] ?? {
            delivery: (group.options[0]?.id ?? "seller_delivery") as DeliveryOptionId,
            preferredDate: "",
            preferredSlot: "any" as DeliverySlot,
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
                  <fieldset className="block text-xs font-semibold text-laku-muted">
                    <legend>
                      {isPickup
                        ? t("checkout.pickupSlot")
                        : t("checkout.deliverySlot")}
                    </legend>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {(
                        [
                          ["morning", "checkout.slotMorning"],
                          ["afternoon", "checkout.slotAfternoon"],
                          ["any", "checkout.slotAny"],
                        ] as const
                      ).map(([slot, labelKey]) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => updateGroup(key, { preferredSlot: slot })}
                          className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                            shipping.preferredSlot === slot
                              ? "border-laku-blue bg-laku-blue/10 text-laku-blue"
                              : "border-laku-line text-laku-ink hover:border-laku-faint"
                          }`}
                        >
                          {t(labelKey)}
                        </button>
                      ))}
                    </div>
                  </fieldset>
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
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}

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
            <div className="flex justify-between gap-4">
              <dt className="text-laku-muted">{t("checkout.distributor")}</dt>
              <dd className="max-w-[60%] truncate text-right font-semibold text-laku-ink">
                {distributorLabel}
              </dd>
            </div>
            <div className="border-t border-laku-line pt-3">
              <p className="text-xs text-laku-muted">
                {t("checkout.pricingNote", { distributor: distributorLabel })}
              </p>
            </div>
          </dl>

          {multiDistributor ? (
            <p className="mt-3 rounded-lg bg-laku-alert/10 px-3 py-2 text-xs font-medium text-laku-alert">
              {t("checkout.singleDistributorOnly")}
            </p>
          ) : null}

          {state.error ? (
            <p className="mt-4 rounded-lg bg-laku-discount-bg px-3 py-2 text-sm font-medium text-laku-discount-ink">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={
              pending ||
              multiDistributor ||
              !resolvedAddress.trim() ||
              contactIncomplete
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-laku-blue px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark disabled:opacity-60"
          >
            <ShieldCheck className="size-4" aria-hidden />
            {pending ? t("checkout.submitting") : t("checkout.submitPo")}
          </button>
          <p className="mt-3 text-xs text-laku-muted">{t("checkout.terms")}</p>
        </section>
      </aside>
    </form>
  );
}
