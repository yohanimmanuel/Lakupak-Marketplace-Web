"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, Heart, ShoppingCart } from "lucide-react";

import { addToCartAction } from "@/app/actions/cart";
import { recordProductViewAction, toggleFavoriteAction } from "@/app/actions/activity";
import FreeItemsBadge from "@/components/ui/FreeItemsBadge";
import QuantityStepper from "@/components/ui/QuantityStepper";
import { useTranslations } from "@/i18n/client";
import type { MarketplaceProduct } from "@/lib/api/types";
import { formatCurrency } from "@/lib/format";
import { calculateProductPromotionGift } from "@/lib/promotion";
import {
  findSelectedVariantOption,
  formatVariantName,
  getSelectedMoq,
  getSelectedStock,
  getSelectedUnitPrice,
  initialVariantSelection,
} from "@/lib/variants";

export default function ProductPurchasePanel({
  product,
}: {
  product: MarketplaceProduct;
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
  const unitPrice = getSelectedUnitPrice(product, option);
  const packagePrice = unitPrice * pieces;
  const moq = getSelectedMoq(product, option);
  const stock = getSelectedStock(product, option);
  const minQuantity = moq ? Math.max(1, Math.ceil(moq / pieces)) : 1;
  const maxQuantity =
    stock > 0 ? Math.max(1, Math.floor(stock / pieces)) : 9999;

  const [quantity, setQuantity] = useState(minQuantity);

  // Raw typed qty drives the live total; clamp only for purchase / MOQ checks.
  const purchaseQuantity = Math.min(maxQuantity, Math.max(minQuantity, quantity));
  const displayQuantity = Math.min(maxQuantity, Math.max(0, quantity));
  const totalPackages = displayQuantity;
  const moqMet = !moq || purchaseQuantity * pieces >= moq;
  const freeGift = calculateProductPromotionGift(product, displayQuantity, moq);
  const freeQty = freeGift?.freeQty ?? 0;
  const outOfStock =
    product.stockStatus === "Out of Stock" ||
    stock <= 0 ||
    option?.stockStatus === "Out of Stock";
  const canPurchase = !pending && !outOfStock && moqMet;
  const variantName = formatVariantName(selected, option);
  const loginHref = `/login?next=${encodeURIComponent(`/product/${product.id}`)}`;

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

  const requireAuth = () => {
    router.push(loginHref);
  };

  const handleAddToCart = () => {
    if (!signedIn) return requireAuth();
    if (!moqMet) return;

    setError(null);
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

  const handleBuyNow = () => {
    if (!signedIn) return requireAuth();
    if (!moqMet) return;
    const params = new URLSearchParams({
      productId: product.id,
      quantity: String(purchaseQuantity),
    });
    if (variantName && variantName !== "Default") {
      params.set("variant", variantName);
    }
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
                      className={`rounded-lg border px-3.5 py-2 text-sm font-semibold transition-colors ${
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
            <FreeItemsBadge
              count={freeQty}
              label={t("product.freeItems", { count: freeQty })}
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

        <div className="text-right">
          <p className="text-xs font-semibold text-laku-muted">{t("product.total")}</p>
          <p className="text-2xl font-bold text-laku-blue">
            {formatCurrency(packagePrice * displayQuantity, t.locale)}
          </p>
          <p className="text-xs text-laku-muted">
            {t("product.unitBreakdown", {
              count: totalPackages,
              price: formatCurrency(packagePrice, t.locale),
            })}
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
          onClick={handleBuyNow}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-laku-blue px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("product.buyNow")}
        </button>

        <button
          type="button"
          disabled={!canPurchase}
          onClick={handleAddToCart}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border-2 border-laku-blue px-5 py-3.5 text-sm font-bold text-laku-blue transition-colors hover:bg-laku-blue/5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {added ? (
            <>
              <Check className="size-4" aria-hidden />
              {t("product.addedToCart")}
            </>
          ) : (
            <>
              <ShoppingCart className="size-4" aria-hidden />
              {t("product.addToCart")}
            </>
          )}
        </button>

        <button
          type="button"
          aria-label={
            favorite ? t("product.removeFavorite") : t("product.addFavorite")
          }
          aria-pressed={favorite}
          onClick={handleFavorite}
          className="flex size-12 items-center justify-center rounded-lg border border-laku-line transition-colors hover:border-laku-alert"
        >
          <Heart
            className={`size-5 ${
              favorite ? "fill-laku-alert text-laku-alert" : "text-laku-muted"
            }`}
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
