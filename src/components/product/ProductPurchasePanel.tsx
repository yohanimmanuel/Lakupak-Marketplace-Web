"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, Heart, ClipboardList } from "lucide-react";

import { addToCartAction } from "@/app/actions/cart";
import { recordProductViewAction, toggleFavoriteAction } from "@/app/actions/activity";
import QuantityStepper from "@/components/ui/QuantityStepper";
import { useTranslations } from "@/i18n/client";
import { addEditCartItem, beginEditCart, endEditCart, landedByBrowserBack, readEditCart } from "@/lib/editCart";
import { clearAppendOrder, rememberAppendOrder } from "@/lib/share";
import type { MarketplaceProduct } from "@/lib/api/types";
import { displayStockUnit } from "@/lib/packageLabel";
import {
  findSelectedVariantOption,
  formatVariantName,
  getSelectedMoq,
  getSelectedStock,
  getSelectedStockStatus,
  initialVariantSelection,
} from "@/lib/variants";

export default function ProductPurchasePanel({
  product,
  appendOrderId,
}: {
  product: MarketplaceProduct;
  appendOrderId?: string | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const definitions = product.variants ?? [];
  const hasVariants = definitions.length > 0;

  const [selected, setSelected] = useState<Record<string, string>>(() =>
    initialVariantSelection(definitions, product.variantOptions ?? []),
  );
  const [signedIn, setSignedIn] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const option = useMemo(
    () => findSelectedVariantOption(product, selected),
    [product, selected],
  );

  const pieces = Math.max(1, Number(product.piecesPerPackage) || 1);
  const moq = getSelectedMoq(product, option);
  const stock = getSelectedStock(product, option);
  const stockStatus = getSelectedStockStatus(product, option);
  const minQuantity = moq ? Math.max(1, Math.ceil(moq / pieces)) : 1;
  const maxQuantity =
    stock > 0 ? Math.max(1, Math.floor(stock / pieces)) : 9999;

  const [quantity, setQuantity] = useState(minQuantity);
  const optionKey = String(option?.id ?? "default");
  const [prevOptionKey, setPrevOptionKey] = useState(optionKey);
  if (optionKey !== prevOptionKey) {
    setPrevOptionKey(optionKey);
    setQuantity(Math.min(maxQuantity, minQuantity));
  }

  const purchaseQuantity = Math.min(maxQuantity, Math.max(minQuantity, quantity));
  const moqMet = !moq || purchaseQuantity * pieces >= moq;
  const outOfStock = stockStatus === "Out of Stock" || stock <= 0;
  const canPurchase = !pending && !outOfStock && moqMet;
  const variantName = formatVariantName(selected, option);
  const loginHref = `/login?next=${encodeURIComponent(`/product/${product.id}`)}`;
  const distributorName =
    product.seller?.company?.name?.trim() ||
    product.seller?.name?.trim() ||
    t("product.distributorFallback");

  const stockStatusLabel =
    stockStatus === "Out of Stock"
      ? t("product.outOfStock")
      : stockStatus === "Low Stock"
        ? t("product.lowStock")
        : t("product.inStock");
  const stockStatusClass =
    stockStatus === "Out of Stock"
      ? "text-laku-alert"
      : stockStatus === "Low Stock"
        ? "text-laku-rating-star"
        : "text-laku-ship";

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      const response = await fetch(
        `/api/me/product-state?productId=${encodeURIComponent(product.id)}`,
      );
      if (!response.ok) return;

      const state = (await response.json()) as { signedIn: boolean; favorite: boolean };
      if (!active) return;

      setSignedIn(state.signedIn);
      setFavorite(state.favorite);
      if (state.signedIn) void recordProductViewAction(product.id);
    };

    void hydrate();
    return () => {
      active = false;
    };
  }, [product.id]);

  useEffect(() => {
    if (appendOrderId) {
      if (landedByBrowserBack() && !readEditCart()) return;
      rememberAppendOrder(appendOrderId);
      beginEditCart(appendOrderId);
    } else {
      clearAppendOrder();
      endEditCart();
    }
  }, [appendOrderId]);

  const requireAuth = () => {
    router.push(loginHref);
  };

  const handleAddToPo = () => {
    if (!signedIn) return requireAuth();
    if (!moqMet) return;

    setError(null);
    if (appendOrderId) {
      beginEditCart(appendOrderId);
      addEditCartItem({ product, quantity: purchaseQuantity, variant: variantName });
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
      return;
    }
    startTransition(async () => {
      const result = await addToCartAction(product.id, purchaseQuantity, variantName);
      if (result.ok) {
        setAdded(true);
        setTimeout(() => setAdded(false), 2500);
        router.refresh();
      } else if (result.error === "unauthenticated") {
        requireAuth();
      } else {
        setError(result.error ?? t("product.addToCartError"));
      }
    });
  };

  const handleRequestOrder = () => {
    if (!signedIn) return requireAuth();
    if (!moqMet) return;
    const params = new URLSearchParams({
      productId: product.id,
      quantity: String(purchaseQuantity),
    });
    if (variantName && variantName !== "Default") {
      params.set("variant", variantName);
    }
    if (appendOrderId) params.set("appendOrderId", appendOrderId);
    router.push(`/checkout?${params.toString()}`);
  };

  const handleFavorite = () => {
    if (!signedIn) return requireAuth();

    const next = !favorite;
    setFavorite(next);
    startTransition(async () => {
      const result = await toggleFavoriteAction(product.id, next);
      if (!result.ok) {
        setFavorite(!next);
        setError(result.error ?? t("product.favoriteError"));
      }
    });
  };

  return (
    <div className="mt-8 rounded-2xl border border-laku-line p-5">
      {hasVariants ? (
        <div className="mb-5 space-y-4">
          {definitions.map((definition) => (
            <div key={definition.id}>
              <p className="mb-2 text-xs font-semibold text-laku-muted">
                {definition.variantType}
              </p>
              <div className="flex flex-wrap gap-2">
                {definition.options.map((choice) => {
                  const active = selected[definition.variantType] === choice;
                  return (
                    <button
                      key={`${definition.id}-${choice}`}
                      type="button"
                      onClick={() =>
                        setSelected((prev) => ({
                          ...prev,
                          [definition.variantType]: choice,
                        }))
                      }
                      className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                        active
                          ? "border-laku-blue bg-laku-blue/10 text-laku-blue"
                          : "border-laku-line bg-white text-laku-ink hover:border-laku-blue"
                      }`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-laku-ink">
          {t("product.stock", { count: stock })}
        </span>
        <span
          className={`font-semibold ${stockStatusClass}`}
          aria-label={t("product.stockStatus")}
        >
          {stockStatusLabel}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-laku-muted">{t("product.quantity")}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <QuantityStepper
              value={quantity}
              onChange={setQuantity}
              min={minQuantity}
              max={maxQuantity}
              updateOnType
              disabled={pending || outOfStock}
            />
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

        <div className="max-w-xs text-right">
          <p className="text-xs font-semibold text-laku-muted">
            {t("product.poItemsLabel")}
          </p>
          <p className="text-2xl font-bold text-laku-ink">
            {t("product.poQuantityCount", {
              count: purchaseQuantity,
              unit: displayStockUnit(product.stockUnit ?? product.packageType),
            })}
          </p>
          <p className="text-xs text-laku-muted">
            {t("product.pricingConfirmedBy", { distributor: distributorName })}
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-4 text-sm font-medium text-laku-alert">{error}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!canPurchase}
          onClick={handleRequestOrder}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-laku-blue px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {appendOrderId ? t("product.addToThisOrder") : t("product.requestOrder")}
        </button>

        <button
          type="button"
          disabled={!canPurchase}
          onClick={handleAddToPo}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-laku-line bg-white px-5 py-3.5 text-sm font-bold text-laku-ink transition-colors hover:border-laku-blue hover:text-laku-blue disabled:cursor-not-allowed disabled:opacity-50"
        >
          {added ? (
            <>
              <Check className="size-4 text-laku-ship" aria-hidden />
              {t("product.addedToPo")}
            </>
          ) : (
            <>
              <ClipboardList className="size-4" aria-hidden />
              {t("product.addToPo")}
            </>
          )}
        </button>

        <button
          type="button"
          disabled={pending}
          onClick={handleFavorite}
          aria-label={favorite ? t("product.removeFavorite") : t("product.addFavorite")}
          className="inline-flex items-center justify-center rounded-lg border border-laku-line bg-white px-4 py-3.5 text-laku-ink transition-colors hover:border-laku-blue hover:text-laku-blue disabled:opacity-50"
        >
          <Heart
            className={`size-4 ${favorite ? "fill-laku-alert text-laku-alert" : ""}`}
            aria-hidden
          />
        </button>
      </div>

      {outOfStock ? (
        <p className="mt-3 text-sm font-medium text-laku-alert">
          {t("product.outOfStockNote")}
        </p>
      ) : null}
    </div>
  );
}
