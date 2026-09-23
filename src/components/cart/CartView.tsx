"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Package, Store, Trash2 } from "lucide-react";

import { removeCartItemAction, updateCartItemAction } from "@/app/actions/cart";
import QuantityStepper from "@/components/ui/QuantityStepper";
import { useTranslations } from "@/i18n/client";
import type { CartItem } from "@/lib/api/types";
import { getCartVariant } from "@/lib/cartPricing";
import {
  getMaxPackageQuantity,
  getMinPackageQuantity,
  getSellerKey,
  meetsMoq,
} from "@/lib/checkout";
import { displayPackageType } from "@/lib/packageLabel";
import { getSelectedMoq, resolveVariantPricing } from "@/lib/variants";

type Props = { items: CartItem[] };

function quantityOf(item: CartItem): number {
  const quantity = Number(item.metadata?.quantity);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

export default function CartView({ items }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [checkoutFlushing, setCheckoutFlushing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Local edits only; display falls back to server quantity so new/removed
  // lines sync without a props→state effect (react-hooks/set-state-in-effect).
  const [quantityOverrides, setQuantityOverrides] = useState<
    Record<number, number>
  >({});
  const persistTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>(
    {},
  );
  const pendingEdits = useRef<
    Record<number, { next: number; revertTo: number }>
  >({});
  /** Latest persist chain per cart line (each call awaits the prior write). */
  const inFlightPersists = useRef(new Map<number, Promise<boolean>>());
  const quantityOverridesRef = useRef(quantityOverrides);
  const itemsRef = useRef(items);

  // Non-navigation unmount only: cancel debounced work. Checkout flushes first.
  useEffect(() => {
    const timers = persistTimers.current;
    return () => {
      for (const timer of Object.values(timers)) clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    quantityOverridesRef.current = quantityOverrides;
    itemsRef.current = items;
  }, [quantityOverrides, items]);

  const quantityFor = (item: CartItem) =>
    quantityOverrides[item.id] ?? quantityOf(item);

  // Grouped for display; cart is restricted to one distributor on add.
  const groups = new Map<string, CartItem[]>();
  for (const item of items) {
    const key = getSellerKey(item.productData);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  const itemCount = items.reduce((total, item) => total + quantityFor(item), 0);
  const distributorLabel = [...groups.keys()][0] ?? t("product.distributorFallback");

  const allMoqMet = items.every((item) =>
    meetsMoq(item.productData, quantityFor(item), getCartVariant(item)),
  );

  const persistQuantity = (
    itemId: number,
    next: number,
    revertTo: number,
  ): Promise<boolean> => {
    const prior = inFlightPersists.current.get(itemId);

    const promise = (async () => {
      // Serialize per line so an older write cannot finish after a newer one.
      if (prior) await prior;
      setError(null);
      const result = await updateCartItemAction(itemId, next);
      if (!result.ok) {
        setError(result.error ?? t("cart.updateError"));
        setQuantityOverrides((prev) => ({ ...prev, [itemId]: revertTo }));
        return false;
      }
      return true;
    })();

    inFlightPersists.current.set(itemId, promise);
    void promise.finally(() => {
      if (inFlightPersists.current.get(itemId) === promise) {
        inFlightPersists.current.delete(itemId);
      }
    });

    startTransition(() => {
      void promise.then((ok) => {
        if (ok) router.refresh();
      });
    });

    return promise;
  };

  const handleQuantityChange = (item: CartItem, next: number) => {
    const previous = quantityFor(item);
    setQuantityOverrides((prev) => ({ ...prev, [item.id]: next }));
    pendingEdits.current[item.id] = { next, revertTo: previous };

    clearTimeout(persistTimers.current[item.id]);
    persistTimers.current[item.id] = setTimeout(() => {
      delete persistTimers.current[item.id];
      const edit = pendingEdits.current[item.id];
      delete pendingEdits.current[item.id];
      if (edit) void persistQuantity(item.id, edit.next, edit.revertTo);
    }, 300);
  };

  const removeItem = (itemId: number) => {
    setError(null);
    clearTimeout(persistTimers.current[itemId]);
    delete persistTimers.current[itemId];
    delete pendingEdits.current[itemId];
    startTransition(async () => {
      const result = await removeCartItemAction(itemId);
      if (!result.ok) setError(result.error ?? t("cart.updateError"));
      router.refresh();
    });
  };

  const goToCheckout = async () => {
    if (!allMoqMet) {
      setError(t("cart.moqBlocked"));
      return;
    }

    setCheckoutFlushing(true);
    setError(null);

    for (const itemId of Object.keys(persistTimers.current).map(Number)) {
      clearTimeout(persistTimers.current[itemId]);
      delete persistTimers.current[itemId];
      const edit = pendingEdits.current[itemId];
      delete pendingEdits.current[itemId];
      if (edit) void persistQuantity(itemId, edit.next, edit.revertTo);
    }

    // Latest chain per item already awaits prior writes for that item.
    const results = await Promise.all([
      ...inFlightPersists.current.values(),
    ]);
    if (results.some((ok) => !ok)) {
      setCheckoutFlushing(false);
      return;
    }

    const overrides = quantityOverridesRef.current;
    const stillMoqMet = itemsRef.current.every((item) =>
      meetsMoq(
        item.productData,
        overrides[item.id] ?? quantityOf(item),
        getCartVariant(item),
      ),
    );
    if (!stillMoqMet) {
      setError(t("cart.moqBlocked"));
      setCheckoutFlushing(false);
      return;
    }

    router.push("/checkout");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
      <div className="space-y-4">
        {[...groups.entries()].map(([seller, sellerItems]) => (
          <section key={seller} className="overflow-hidden rounded-2xl bg-white">
            <h2 className="flex items-center gap-2 border-b border-laku-line px-5 py-3.5 text-sm font-bold text-laku-ink">
              <Store className="size-4 text-laku-blue" aria-hidden />
              {seller}
            </h2>

            <ul className="divide-y divide-laku-line">
              {sellerItems.map((item) => {
                const product = item.productData;
                const quantity = quantityFor(item);
                const variant = getCartVariant(item);
                const { option } = resolveVariantPricing(product, variant);
                const packageType = displayPackageType(product.packageType);
                const moq = getSelectedMoq(product, option);
                const minQuantity = getMinPackageQuantity(product, variant);
                const maxQuantity = getMaxPackageQuantity(product);
                const moqMet = meetsMoq(product, quantity, variant);

                return (
                  <li key={item.id} className="flex gap-4 px-5 py-4">
                    <Link
                      href={`/product/${encodeURIComponent(product.id)}`}
                      className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-laku-chip"
                    >
                      {product.images?.[0] ? (
                        <Image
                          src={product.images[0]}
                          alt=""
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="flex h-full items-center justify-center">
                          <Package className="size-6 text-laku-faint" aria-hidden />
                        </span>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/product/${encodeURIComponent(product.id)}`}
                        className="line-clamp-2 text-sm font-semibold text-laku-ink hover:text-laku-blue"
                      >
                        {product.name}
                      </Link>
                      {variant !== "Default" ? (
                        <p className="mt-0.5 line-clamp-2 text-xs text-laku-muted">
                          {variant}
                        </p>
                      ) : null}
                      {packageType ? (
                        <p className="mt-0.5 text-xs text-laku-muted">
                          {t("cart.packageInfo", { packageType })}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap items-center gap-2.5">
                        <QuantityStepper
                          size="sm"
                          value={quantity}
                          min={minQuantity}
                          max={maxQuantity}
                          updateOnType
                          onChange={(next) => handleQuantityChange(item, next)}
                        />

                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => removeItem(item.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-laku-muted transition-colors hover:text-laku-alert disabled:opacity-50"
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                          {t("cart.remove")}
                        </button>
                      </div>
                      {moq ? (
                        <p
                          className={`mt-2 text-xs font-medium ${
                            moqMet ? "text-laku-muted" : "text-laku-alert"
                          }`}
                        >
                          {t("product.minimumOrder", { count: minQuantity })}
                        </p>
                      ) : null}
                    </div>

                    <p className="shrink-0 text-sm font-bold text-laku-ink">
                      {t("cart.qtyBadge", { count: quantity })}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {error ? <p className="text-sm font-medium text-laku-alert">{error}</p> : null}
      </div>

      <aside className="rounded-2xl bg-white p-5 lg:sticky lg:top-24">
        <h2 className="text-sm font-bold text-laku-ink">{t("cart.summaryTitle")}</h2>

        <dl className="mt-4 space-y-2.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-laku-muted">{t("cart.itemCount")}</dt>
            <dd className="font-medium text-laku-ink">
              {t("cart.qtyBadge", { count: itemCount })}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-laku-muted">{t("cart.distributor")}</dt>
            <dd className="max-w-[60%] truncate text-right font-medium text-laku-ink">
              {distributorLabel}
            </dd>
          </div>
          <div className="border-t border-laku-line pt-3">
            <p className="text-xs text-laku-muted">
              {t("cart.pricingNote", { distributor: distributorLabel })}
            </p>
          </div>
        </dl>

        {groups.size > 1 ? (
          <p className="mt-3 rounded-lg bg-laku-alert/10 px-3 py-2 text-xs font-medium text-laku-alert">
            {t("cart.singleDistributorOnly")}
          </p>
        ) : null}

        <button
          type="button"
          disabled={pending || checkoutFlushing || !allMoqMet || groups.size > 1}
          onClick={() => void goToCheckout()}
          className="mt-4 block w-full rounded-lg bg-laku-blue px-5 py-3.5 text-center text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark disabled:opacity-50"
        >
          {checkoutFlushing ? t("cart.preparingCheckout") : t("cart.checkout")}
        </button>
        {!allMoqMet ? (
          <p className="mt-2 text-center text-xs font-medium text-laku-alert">
            {t("cart.moqBlocked")}
          </p>
        ) : null}
      </aside>
    </div>
  );
}
