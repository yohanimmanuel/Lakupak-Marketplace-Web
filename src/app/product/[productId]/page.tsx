import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Gift, MapPin, ShieldCheck, Star, Store, Truck } from "lucide-react";

import OpenInAppButton from "@/components/app/OpenInAppButton";
import ContactSellerButton from "@/components/messages/ContactSellerButton";
import ProductGrid from "@/components/product/ProductGrid";
import ProductGallery from "@/components/product/ProductGallery";
import ProductAssuranceBadges from "@/components/product/ProductAssuranceBadges";
import ProductPurchasePanel from "@/components/product/ProductPurchasePanel";
import ProductReviews from "@/components/product/ProductReviews";
import ShareButton from "@/components/share/ShareButton";
import SectionHeader from "@/components/ui/SectionHeader";
import { getTranslations } from "@/i18n/server";
import {
  getDistributorReviews,
  getProductById,
  getProductReviews,
  getProductsSafe,
} from "@/lib/api/marketplace";
import { getSession } from "@/lib/auth/session";
import { translateCategory } from "@/lib/categories";
import {
  formatProductOriginalPrice,
  formatProductPrice,
  getDeliveryLabel,
  getDiscountLabel,
  getProductPriceRange,
  getPromotion,
  getShippingLocation,
  showsStrikethrough,
} from "@/lib/format";
import { absoluteProductUrl, productAppUrl, productUrl } from "@/lib/share";

export const revalidate = 120;

type Params = Promise<{ productId: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const t = await getTranslations();
  const { productId } = await params;
  const product = await getProductById(decodeURIComponent(productId));

  if (!product) {
    return { title: t("product.notFound") };
  }

  const seller = product.seller?.company?.name ?? product.seller?.name;
  const description = `${formatProductPrice(product, t.locale)} · ${
    seller ? `${seller} · ` : ""
  }${product.description?.slice(0, 140) || t("product.metaDescription")}`;

  return {
    title: product.name,
    description,
    alternates: { canonical: productUrl(product.id) },
    openGraph: {
      type: "website",
      title: product.name,
      description,
      url: absoluteProductUrl(product.id),
      images: product.images.slice(0, 1).map((url) => ({ url })),
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: product.images.slice(0, 1),
    },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const t = await getTranslations();
  const { productId } = await params;
  const decodedId = decodeURIComponent(productId);
  const [product, session] = await Promise.all([
    getProductById(decodedId),
    getSession(),
  ]);

  if (!product) notFound();

  const sessionUserId = session?.user.id ?? null;

  const [reviews, related, sellerReviews] = await Promise.all([
    getProductReviews(product.id),
    getProductsSafe({ category: product.category, limit: 10 }),
    // GraphQL hardcodes seller.rating to 0 — use the reviews API instead.
    product.userId ? getDistributorReviews(product.userId) : Promise.resolve(null),
  ]);

  const relatedProducts = related.products
    .filter((item) => item.id !== product.id)
    .slice(0, 5);

  const discountLabel = getDiscountLabel(product, t.locale);
  const promotion = getPromotion(product);
  const delivery = getDeliveryLabel(product, t);
  const location = getShippingLocation(product);
  const rating = reviews?.overallRating ?? product.reviews?.overallRating ?? 0;
  const totalReviews = reviews?.totalReviews ?? product.reviews?.totalReviews ?? 0;
  const sellerRating =
    sellerReviews?.overallRating ?? product.seller?.rating ?? 0;
  const sellerReviewCount =
    sellerReviews?.totalReviews ?? product.seller?.reviewCount ?? 0;
  const sellerName = product.seller?.company?.name ?? product.seller?.name;
  const sellerImage =
    product.seller?.company?.logo?.trim() ||
    product.seller?.avatar?.trim() ||
    null;
  const shareUrl = absoluteProductUrl(product.id);

  const priceRange = getProductPriceRange(product);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.slice(0, 3),
    sku: product.sku ?? undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    offers: priceRange.hasRange
      ? {
          "@type": "AggregateOffer",
          lowPrice: priceRange.min,
          highPrice: priceRange.max,
          priceCurrency: "IDR",
          availability:
            product.stockStatus === "Out of Stock"
              ? "https://schema.org/OutOfStock"
              : "https://schema.org/InStock",
          url: shareUrl,
        }
      : {
          "@type": "Offer",
          price: priceRange.min > 0 ? priceRange.min : product.sellingPrice,
          priceCurrency: "IDR",
          availability:
            product.stockStatus === "Out of Stock"
              ? "https://schema.org/OutOfStock"
              : "https://schema.org/InStock",
          url: shareUrl,
        },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-laku-muted">
        <Link href="/" className="hover:text-laku-blue">
          {t("nav.home")}
        </Link>
        <span className="px-2">/</span>
        <Link
          href={`/search?q=${encodeURIComponent(translateCategory(product.category, t))}&category=${encodeURIComponent(product.category)}`}
          className="hover:text-laku-blue"
        >
          {translateCategory(product.category, t)}
        </Link>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <h1 className="text-2xl font-semibold text-balance text-laku-ink md:text-3xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            {rating > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-[4px] border border-laku-rating-line bg-laku-rating-bg px-2 py-1 font-semibold text-laku-ink">
                <Star
                  className="size-3.5 fill-laku-rating-star text-laku-rating-star"
                  aria-hidden
                />
                {rating.toFixed(1)}
                {totalReviews > 0 ? (
                  <span className="font-medium text-laku-muted">
                    ({totalReviews})
                  </span>
                ) : null}
              </span>
            ) : null}
            <span className="font-medium text-laku-muted">
              {t("product.sold", { count: product.soldCount })}
            </span>
            <span
              className={`font-semibold ${
                product.stockStatus === "Out of Stock"
                  ? "text-laku-alert"
                  : "text-laku-ship"
              }`}
            >
              {product.stockStatus === "Out of Stock"
                ? t("product.outOfStock")
                : t("product.inStock")}
            </span>
          </div>

          <div className="mt-6 flex flex-wrap items-end gap-3">
            <span className="text-3xl font-bold text-laku-blue">
              {formatProductPrice(product, t.locale)}
            </span>
            {showsStrikethrough(product) ? (
              <span className="pb-1 text-base text-laku-faint line-through">
                {formatProductOriginalPrice(product, t.locale)}
              </span>
            ) : null}
            {discountLabel && product.offerBadge !== "Promotion" ? (
              <span className="mb-1 rounded-[4px] bg-laku-discount-bg px-2 py-1 text-xs font-bold text-laku-discount-ink">
                {discountLabel}
              </span>
            ) : null}
          </div>

          {promotion ? (
            <p className="mt-4 inline-flex items-center gap-2 rounded-card bg-laku-promo-bg px-3 py-2 text-sm font-bold text-laku-promo-ink">
              <Gift className="size-4" aria-hidden />
              {t("product.promoBuyGet", {
                min: promotion.minQuantity,
                free: promotion.freeQuantity,
              })}
            </p>
          ) : null}

          <dl className="mt-6 space-y-2 border-t border-laku-line pt-6 text-sm">
            <div className="flex items-center gap-2">
              <Truck
                className={`size-4 ${delivery ? "text-laku-ship" : "text-laku-faint"}`}
                aria-hidden
              />
              <dt className="sr-only">{t("product.estimatedDelivery")}</dt>
              <dd className={delivery ? "text-laku-ink" : "text-laku-faint"}>
                {delivery ?? t("product.notProvided")}
              </dd>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-laku-faint" aria-hidden />
              <dt className="sr-only">{t("product.shippedFrom")}</dt>
              <dd className={location ? "text-laku-ink" : "text-laku-faint"}>
                {location ?? t("product.notProvided")}
              </dd>
            </div>
            {product.brand ? (
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-laku-faint" aria-hidden />
                <dt className="sr-only">{t("product.brand")}</dt>
                <dd className="text-laku-ink">{product.brand}</dd>
              </div>
            ) : null}
          </dl>

          <ProductAssuranceBadges assurance={product.assurance} />

          <ProductPurchasePanel product={product} />

          <div className="mt-4 flex flex-wrap gap-3">
            <ShareButton
              title={product.name}
              text={t("product.shareText", {
                name: product.name,
                price: formatProductPrice(product, t.locale),
              })}
              url={shareUrl}
            />
            {product.userId ? (
              <ContactSellerButton
                userId={sessionUserId}
                distributorId={product.userId}
                name={sellerName ?? t("product.distributorFallback")}
                phone={product.seller?.company?.businessPhone ?? null}
                logoUrl={sellerImage}
                productId={product.id}
                productName={product.name}
                label={t("product.chatNow")}
                className="inline-flex items-center gap-2 rounded-lg border border-laku-line bg-white px-4 py-2.5 text-sm font-semibold text-laku-ink transition-colors hover:border-laku-blue hover:text-laku-blue"
              />
            ) : null}
            <OpenInAppButton appUrl={productAppUrl(product.id)} />
          </div>

          {sellerName ? (
            <div className="mt-8 rounded-2xl bg-white p-5">
              <h2 className="mb-3 text-sm font-bold text-laku-ink">
                {t("product.sellerInfo")}
              </h2>
              {product.userId ? (
                <Link
                  href={`/seller/${product.userId}`}
                  className="flex items-center gap-3 transition-opacity hover:opacity-90"
                >
                  <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-laku-blue/10 text-laku-blue">
                    {sellerImage ? (
                      <Image
                        src={sellerImage}
                        alt=""
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    ) : (
                      <Store className="size-5" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-laku-ink">
                      {sellerName}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-laku-muted">
                      <span className="inline-flex items-center gap-1 font-semibold text-laku-ink">
                        <Star
                          className="size-3 fill-laku-rating-star text-laku-rating-star"
                          aria-hidden
                        />
                        {sellerRating > 0 ? sellerRating.toFixed(1) : "—"}
                      </span>
                      {sellerReviewCount > 0 ? (
                        <span>
                          {t("product.sellerReviews", {
                            count: sellerReviewCount,
                          })}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-laku-muted">
                      {product.seller?.company?.businessAddress ??
                        t("product.distributorFallback")}
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-laku-blue/10 text-laku-blue">
                    {sellerImage ? (
                      <Image
                        src={sellerImage}
                        alt=""
                        fill
                        sizes="44px"
                        className="object-cover"
                      />
                    ) : (
                      <Store className="size-5" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-laku-ink">
                      {sellerName}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-laku-muted">
                      <span className="inline-flex items-center gap-1 font-semibold text-laku-ink">
                        <Star
                          className="size-3 fill-laku-rating-star text-laku-rating-star"
                          aria-hidden
                        />
                        {sellerRating > 0 ? sellerRating.toFixed(1) : "—"}
                      </span>
                      {sellerReviewCount > 0 ? (
                        <span>
                          {t("product.sellerReviews", {
                            count: sellerReviewCount,
                          })}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-laku-muted">
                      {product.seller?.company?.businessAddress ??
                        t("product.distributorFallback")}
                    </p>
                  </div>
                </div>
              )}
              {product.userId ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/distributor/${product.userId}`}
                    className="rounded-lg border border-laku-line px-3 py-1.5 text-xs font-semibold text-laku-ink transition-colors hover:bg-laku-surface"
                  >
                    {t("product.viewShop")}
                  </Link>
                  <Link
                    href={`/seller/${product.userId}`}
                    className="rounded-lg bg-laku-blue/10 px-3 py-1.5 text-xs font-semibold text-laku-blue transition-colors hover:bg-laku-blue/15"
                  >
                    {t("product.viewSellerInfo")}
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {product.description ? (
        <section className="mt-14 max-w-3xl">
          <h2 className="mb-3 text-lg font-bold text-laku-ink">
            {t("product.description")}
          </h2>
          <p className="text-sm/7 whitespace-pre-line text-laku-muted">
            {product.description}
          </p>
        </section>
      ) : null}

      <section className="mt-14">
        <ProductReviews productId={product.id} reviews={reviews} />
      </section>

      {relatedProducts.length > 0 ? (
        <section className="mt-14">
          <SectionHeader
            title={t("product.related")}
            href={`/search?q=${encodeURIComponent(translateCategory(product.category, t))}&category=${encodeURIComponent(product.category)}`}
          />
          <ProductGrid products={relatedProducts} />
        </section>
      ) : null}
    </div>
  );
}
