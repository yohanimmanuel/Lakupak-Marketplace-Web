"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Eye, HeartOff } from "lucide-react";

import { toggleFavoriteAction } from "@/app/actions/activity";
import ProductCard from "@/components/product/ProductCard";
import { useTranslations } from "@/i18n/client";
import type { MarketplaceProduct } from "@/lib/api/types";
import { productUrl } from "@/lib/share";

type Props = {
  products: MarketplaceProduct[];
  /** Favourites get an unlike shortcut; other lists only link to the product. */
  allowUnfavorite?: boolean;
};

export default function ActivityGrid({ products, allowUnfavorite = false }: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const unfavorite = (productId: string) => {
    setError(null);
    startTransition(async () => {
      const result = await toggleFavoriteAction(productId, false);
      if (!result.ok) setError(result.error ?? t("product.favoriteError"));
      router.refresh();
    });
  };

  return (
    <div>
      {error ? <p className="mb-4 text-sm font-medium text-laku-alert">{error}</p> : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {products.map((product) => (
          <div key={product.id} className="overflow-hidden rounded-card bg-white">
            <ProductCard product={product} />

            <div className="flex gap-2 px-2 pb-2">
              <Link
                href={productUrl(product.id)}
                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-laku-blue px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-laku-blue-dark"
              >
                <Eye className="size-3.5" aria-hidden />
                {t("moreService.view")}
              </Link>

              {allowUnfavorite ? (
                <button
                  type="button"
                  aria-label={t("moreService.removeFavorite")}
                  disabled={pending}
                  onClick={() => unfavorite(product.id)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-laku-line text-laku-muted transition-colors hover:border-laku-alert hover:text-laku-alert disabled:opacity-60"
                >
                  <HeartOff className="size-3.5" aria-hidden />
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
