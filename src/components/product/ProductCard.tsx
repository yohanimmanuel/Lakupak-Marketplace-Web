"use client";

import Image from "next/image";
import Link from "next/link";
import { ImageIcon, MapPin, Store, Truck } from "lucide-react";

import { useTranslations } from "@/i18n/client";
import type { MarketplaceProduct } from "@/lib/api/types";
import { formatBasePrice, getDeliveryLabel, getShippingLocation } from "@/lib/format";
import { keepAppendOrder, productUrl } from "@/lib/share";

type Props = {
  product: MarketplaceProduct;
  priority?: boolean;
  appendOrderId?: string | null;
};

function distributorLabel(product: MarketplaceProduct, fallback: string): string {
  return (
    product.seller?.company?.name?.trim() ||
    product.seller?.name?.trim() ||
    fallback
  );
}

export default function ProductCard({ product, priority = false, appendOrderId }: Props) {
  const t = useTranslations();
  const image = product.images[0];
  const delivery = getDeliveryLabel(product, t);
  const location = getShippingLocation(product);
  const sellerName = distributorLabel(product, t("product.distributorFallback"));
  const sellerLogo =
    product.seller?.company?.logo?.trim() ||
    product.seller?.avatar?.trim() ||
    null;
  const category = product.productCategory || product.category || null;
  const basePrice = formatBasePrice(product, t.locale);

  return (
    <Link
      href={keepAppendOrder(productUrl(product.id), appendOrderId)}
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
      </div>

      <div className="p-2">
        <h3 className="mb-1 line-clamp-2 text-sm/[18px] font-medium text-laku-ink">
          {product.name}
        </h3>

        {basePrice ? (
          <p className="mb-1 text-sm font-bold text-laku-blue">{basePrice}</p>
        ) : null}

        {product.brand ? (
          <p className="mb-1 truncate text-xs text-laku-muted">{product.brand}</p>
        ) : null}

        {category ? (
          <p className="mb-1.5 truncate text-[11px] font-medium text-laku-faint">
            {category}
          </p>
        ) : null}

        <div className="mb-1.5 flex items-center gap-1.5">
          <span className="relative flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-laku-blue/10 text-laku-blue">
            {sellerLogo ? (
              <Image src={sellerLogo} alt="" fill sizes="20px" className="object-cover" />
            ) : (
              <Store className="size-3" aria-hidden />
            )}
          </span>
          <span className="truncate text-xs font-semibold text-laku-ink">
            {sellerName}
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
