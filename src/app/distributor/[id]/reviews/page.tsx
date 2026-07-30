import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import DistributorReviews from "@/components/distributor/DistributorReviews";
import { getTranslations } from "@/i18n/server";
import { getDistributor, getDistributorReviews } from "@/lib/api/marketplace";

type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ page?: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const distributorId = Number(id);
  const t = await getTranslations();
  if (!Number.isFinite(distributorId) || distributorId < 1) {
    return { title: t("distributorReviewsList.title") };
  }

  const distributor = await getDistributor(distributorId);
  const name =
    distributor?.companyName?.trim() ||
    distributor?.name?.trim() ||
    t("product.distributorFallback");

  return {
    title: t("distributorReviewsList.titleWithName", { name }),
    robots: { index: false, follow: false },
  };
}

export default async function DistributorReviewsPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const distributorId = Number(id);
  const t = await getTranslations();

  if (!Number.isFinite(distributorId) || distributorId < 1) notFound();

  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const [distributor, reviews] = await Promise.all([
    getDistributor(distributorId),
    getDistributorReviews(distributorId, { page, limit: 10 }),
  ]);

  if (!distributor) notFound();

  const name =
    distributor.companyName?.trim() ||
    distributor.name?.trim() ||
    t("product.distributorFallback");
  const totalPages = Math.max(1, reviews?.totalPages ?? 1);
  const currentPage = reviews?.page ?? page;
  const backHref = `/distributor/${distributorId}`;
  const baseReviewsHref = `/distributor/${distributorId}/reviews`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Link
        href={backHref}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("distributorReviewsList.back")}
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-laku-ink">
        {t("distributorReviewsList.titleWithName", { name })}
      </h1>

      <DistributorReviews
        distributorId={distributorId}
        reviews={reviews}
        variant="list"
      />

      {totalPages > 1 ? (
        <nav
          className="mt-6 flex items-center justify-between gap-3"
          aria-label={t("distributorReviewsList.pagination")}
        >
          {currentPage > 1 ? (
            <Link
              href={`${baseReviewsHref}?page=${currentPage - 1}`}
              className="rounded-lg border border-laku-line bg-white px-4 py-2 text-sm font-semibold text-laku-ink transition-colors hover:bg-laku-surface"
            >
              {t("distributorReviewsList.prev")}
            </Link>
          ) : (
            <span />
          )}
          <p className="text-sm text-laku-muted">
            {t("distributorReviewsList.pageOf", {
              page: currentPage,
              total: totalPages,
            })}
          </p>
          {currentPage < totalPages ? (
            <Link
              href={`${baseReviewsHref}?page=${currentPage + 1}`}
              className="rounded-lg border border-laku-line bg-white px-4 py-2 text-sm font-semibold text-laku-ink transition-colors hover:bg-laku-surface"
            >
              {t("distributorReviewsList.next")}
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
