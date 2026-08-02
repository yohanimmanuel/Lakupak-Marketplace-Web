"use client";

import Image from "next/image";
import Link from "next/link";
import { Gift, ImageIcon, MapPin, Star, Truck } from "lucide-react";

import { useTranslations } from "@/i18n/client";
import type { MarketplaceProduct } from "@/lib/api/types";
import {
  formatProductOriginalPrice,
  formatProductPrice,
  getDeliveryLabel,
  getDiscountLabel,
  getPromotion,
  getShippingLocation,
  showsStrikethrough,
} from "@/lib/format";
import { productUrl } from "@/lib/share";

type Props = {
  product: MarketplaceProduct;
  priority?: boolean;
};

export default function ProductCard({ product, priority = false }: Props) {
  const t = useTranslations();
  const image = product.images[0];
  const discountLabel = getDiscountLabel(product, t.locale);
  const promotion = getPromotion(product);
  const delivery = getDeliveryLabel(product, t);
  const location = getShippingLocation(product);
  const rating = product.reviews?.overallRating ?? product.rating ?? 0;
  const ratingLabel =
    Number.isFinite(rating) && rating > 0
      ? (Math.round(rating * 10) / 10).toFixed(1)
      : "0.0";
  const showDiscountTag = Boolean(discountLabel) && product.offerBadge !== "Promotion";

  return (
    <Link
      href={productUrl(product.id)}
      className="group block overflow-hidden rounded-card bg-white transition-transform duration-200 ease-out hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-laku-blue"
    >
      <div className="relative aspect-7/6 overflow-hidden bg-laku-surface">
        {image ? (
          <Image
            src={image}
            alt={product.name}
            fill
            priority={priority}
            sizes="(min-width: 1280px) 20vw, (min-width: 768px) 30vw, 50vw"
            className="object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-laku-chip">
            <ImageIcon className="size-10 text-laku-faint" aria-hidden />
          </div>
        )}

        {showDiscountTag ? (
          <span className="absolute top-2 left-2 rounded-[4px] bg-laku-discount-bg px-1.5 py-1 text-[10px] font-bold text-laku-discount-ink">
            {discountLabel}
          </span>
        ) : null}
      </div>

      <div className="p-2">
        <h3 className="mb-1 line-clamp-2 text-sm/[18px] font-medium text-laku-ink">
          {product.name}
        </h3>

        <div className="mb-1 flex flex-col items-start gap-0.5">
          {showsStrikethrough(product) ? (
            <span className="text-xs text-laku-faint line-through">
              {formatProductOriginalPrice(product, t.locale)}
            </span>
          ) : null}
          <span className="text-sm font-bold text-laku-blue">
            {formatProductPrice(product, t.locale)}
          </span>
        </div>

        {promotion ? (
          <span className="mb-1.5 inline-flex max-w-full items-center gap-1 truncate rounded-[4px] bg-laku-promo-bg px-2 py-1 text-[11px] font-bold text-laku-promo-ink">
            <Gift className="size-2.5 shrink-0" aria-hidden />
            {t("product.promoBuyGet", {
              min: promotion.minQuantity,
              free: promotion.freeQuantity,
            })}
          </span>
        ) : null}

        <div className="mb-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <span
            className="inline-flex items-center gap-1 rounded-[4px] border border-laku-rating-line bg-laku-rating-bg px-2 py-0.5 text-xs font-semibold text-laku-ink"
            aria-label={`Rating ${ratingLabel} out of 5`}
          >
            <Star
              className="size-[11px] fill-laku-rating-star text-laku-rating-star"
              aria-hidden
            />
            {ratingLabel}
          </span>
          <span className="text-xs text-[#d1d5db]" aria-hidden>
            •
          </span>
          <span className="text-xs font-medium text-laku-muted">
            {t("product.sold", { count: product.soldCount })}
          </span>
        </div>

        <div className="flex items-center gap-[3px] text-[11px]">
          <Truck
            className={`size-3 shrink-0 ${delivery ? "text-laku-ship" : "text-laku-faint"}`}
            aria-hidden
          />
          <span
            className={
              delivery ? "font-semibold text-laku-ship" : "font-medium text-laku-faint"
            }
          >
            {delivery ?? t("product.notProvided")}
          </span>
          <span className="text-[#d1d5db]">•</span>
          <MapPin className="size-3 shrink-0 text-laku-faint" aria-hidden />
          <span className="truncate text-laku-faint">
            {location ?? t("product.notProvided")}
          </span>
        </div>
      </div>
    </Link>
  );
}
