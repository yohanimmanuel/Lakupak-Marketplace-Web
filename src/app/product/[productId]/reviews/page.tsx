import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import ProductReviews from "@/components/product/ProductReviews";
import { getTranslations } from "@/i18n/server";
import { getProductById, getProductReviews } from "@/lib/api/marketplace";

type Params = Promise<{ productId: string }>;
type SearchParams = Promise<{ page?: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProductById(decodeURIComponent(productId));
  const t = await getTranslations();
  const name = product?.name?.trim();
  return {
    title: name
      ? t("productReviewsList.titleWithName", { productName: name })
      : t("productReviewsList.title"),
    robots: { index: false, follow: false },
  };
}

export default async function ProductReviewsPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { productId } = await params;
  const { page: pageParam } = await searchParams;
  const decodedId = decodeURIComponent(productId);
  const t = await getTranslations();

  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const product = await getProductById(decodedId);
  if (!product) notFound();

  const reviews = await getProductReviews(product.id, { page, limit: 10 });
  const totalPages = Math.max(1, reviews?.totalPages ?? 1);
  const currentPage = reviews?.page ?? page;
  const backHref = `/product/${encodeURIComponent(product.id)}`;
  const baseReviewsHref = `/product/${encodeURIComponent(product.id)}/reviews`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Link
        href={backHref}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("productReviewsList.back")}
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-laku-ink">
        {t("productReviewsList.titleWithName", {
          productName: product.name ?? t("product.distributorFallback"),
        })}
      </h1>

      <ProductReviews productId={product.id} reviews={reviews} variant="list" />

      {totalPages > 1 ? (
        <nav
          className="mt-6 flex items-center justify-between gap-3"
          aria-label={t("productReviewsList.pagination")}
        >
          {currentPage > 1 ? (
            <Link
              href={`${baseReviewsHref}?page=${currentPage - 1}`}
              className="rounded-lg border border-laku-line bg-white px-4 py-2 text-sm font-semibold text-laku-ink transition-colors hover:bg-laku-surface"
            >
              {t("productReviewsList.prev")}
            </Link>
          ) : (
            <span />
          )}
          <p className="text-sm text-laku-muted">
            {t("productReviewsList.pageOf", {
              page: currentPage,
              total: totalPages,
            })}
          </p>
          {currentPage < totalPages ? (
            <Link
              href={`${baseReviewsHref}?page=${currentPage + 1}`}
              className="rounded-lg border border-laku-line bg-white px-4 py-2 text-sm font-semibold text-laku-ink transition-colors hover:bg-laku-surface"
            >
              {t("productReviewsList.next")}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
