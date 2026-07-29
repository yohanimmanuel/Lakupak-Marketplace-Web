"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Package, Store, Trash2 } from "lucide-react";

import { removeCartItemAction, updateCartItemAction } from "@/app/actions/cart";
import FreeItemsBadge from "@/components/ui/FreeItemsBadge";
import QuantityStepper from "@/components/ui/QuantityStepper";
import { useTranslations } from "@/i18n/client";
import type { CartItem } from "@/lib/api/types";
import { getCartVariant } from "@/lib/cartPricing";
import { formatCurrency } from "@/lib/format";
import { getSellerKey } from "@/lib/checkout";
import { displayPackageType } from "@/lib/packageLabel";
import { calculateProductPromotionGift } from "@/lib/promotion";
import { getSelectedMoq, resolveVariantPricing } from "@/lib/variants";

type Props = { items: CartItem[] };

function quantityOf(item: CartItem): number {
  const quantity = Number(item.metadata?.quantity);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 1;
}

function lineTotal(item: CartItem, quantity: number): number {
  const pieces = Number(item.productData?.piecesPerPackage) || 1;
  const { unitPrice } = resolveVariantPricing(
    item.productData,
    getCartVariant(item),
  );
  return unitPrice * pieces * quantity;
}

export default function CartView({ items }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<number, number>>(() =>
    Object.fromEntries(items.map((item) => [item.id, quantityOf(item)])),
  );
  const persistTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>(
    {},
  );

  // Seed new lines / drop removed ones without clobbering in-flight edits.
  useEffect(() => {
    setQuantities((prev) => {
      const next: Record<number, number> = {};
      for (const item of items) {
        next[item.id] = prev[item.id] ?? quantityOf(item);
      }
      return next;
    });
  }, [items]);

  useEffect(() => {
    const timers = persistTimers.current;
    return () => {
      for (const timer of Object.values(timers)) clearTimeout(timer);
    };
  }, []);

  // Grouped for display only: the API splits the order per seller on submit.
  const groups = new Map<string, CartItem[]>();
  for (const item of items) {
    const key = getSellerKey(item.productData);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  const subtotal = items.reduce((total, item) => {
    const quantity = quantities[item.id] ?? quantityOf(item);
    return total + lineTotal(item, quantity);
  }, 0);

  const persistQuantity = (itemId: number, next: number, revertTo: number) => {
    setError(null);
    startTransition(async () => {
      const result = await updateCartItemAction(itemId, next);
      if (!result.ok) {
        setError(result.error ?? t("cart.updateError"));
        setQuantities((prev) => ({ ...prev, [itemId]: revertTo }));
      }
      router.refresh();
    });
  };

  const handleQuantityChange = (item: CartItem, next: number) => {
    const previous = quantities[item.id] ?? quantityOf(item);
    setQuantities((prev) => ({ ...prev, [item.id]: next }));

    clearTimeout(persistTimers.current[item.id]);
    persistTimers.current[item.id] = setTimeout(() => {
      persistQuantity(item.id, next, previous);
    }, 300);
  };

  const removeItem = (itemId: number) => {
    setError(null);
    clearTimeout(persistTimers.current[itemId]);
    startTransition(async () => {
      const result = await removeCartItemAction(itemId);
      if (!result.ok) setError(result.error ?? t("cart.updateError"));
      router.refresh();
    });
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
                const quantity = quantities[item.id] ?? quantityOf(item);
                const variant = getCartVariant(item);
                const { unitPrice, option } = resolveVariantPricing(product, variant);
                const packageType = displayPackageType(product.packageType);
                const freeQty =
                  calculateProductPromotionGift(
                    product,
                    quantity,
                    getSelectedMoq(product, option),
                  )?.freeQty ?? 0;

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
                      <p className="mt-0.5 text-xs text-laku-muted">
                        {formatCurrency(unitPrice, t.locale)}
                        {packageType ? (
                          <>
                            {" · "}
                            {t("cart.packageInfo", { packageType })}
                          </>
                        ) : null}
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2.5">
                        <QuantityStepper
                          size="sm"
                          value={quantity}
                          updateOnType
                          onChange={(next) => handleQuantityChange(item, next)}
                        />
                        <FreeItemsBadge
                          count={freeQty}
                          label={t("cart.freeItems", { count: freeQty })}
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
                    </div>

                    <p className="shrink-0 text-sm font-bold text-laku-ink">
                      {formatCurrency(lineTotal(item, quantity), t.locale)}
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
            <dt className="text-laku-muted">{t("cart.subtotal")}</dt>
            <dd className="font-medium text-laku-ink">
              {formatCurrency(subtotal, t.locale)}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-laku-muted">{t("cart.shipping")}</dt>
            <dd className="text-laku-muted">{t("cart.shippingNote")}</dd>
          </div>
          <div className="flex justify-between border-t border-laku-line pt-3">
            <dt className="font-bold text-laku-ink">{t("cart.total")}</dt>
            <dd className="text-lg font-bold text-laku-blue">
              {formatCurrency(subtotal, t.locale)}
            </dd>
          </div>
        </dl>

        {groups.size > 1 ? (
          <p className="mt-3 rounded-lg bg-laku-surface px-3 py-2 text-xs text-laku-muted">
            {t("cart.splitNote", { count: groups.size })}
          </p>
        ) : null}

        <Link
          href="/checkout"
          className="mt-4 block rounded-lg bg-laku-blue px-5 py-3.5 text-center text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
        >
          {t("cart.checkout")}
        </Link>
      </aside>
    </div>
  );
}
