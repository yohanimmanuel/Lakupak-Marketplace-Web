import Image from "next/image";
import Link from "next/link";
import { MessageCircle, Star } from "lucide-react";

import ReviewImageStrip from "@/components/product/ReviewImageStrip";
import { getTranslations } from "@/i18n/server";
import type { ProductReviews as ProductReviewsData } from "@/lib/api/types";
import {
  formatDate,
  formatNumber,
  formatRelativeReviewDate,
} from "@/lib/format";
import { displayPackageType } from "@/lib/packageLabel";

function StarRow({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const className = size === "md" ? "size-4" : "size-3";
  return (
    <span className="inline-flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${className} ${
            star <= Math.round(value)
              ? "fill-laku-rating-star text-laku-rating-star"
              : "text-laku-line"
          }`}
        />
      ))}
    </span>
  );
}

function RatingBreakdown({
  total,
  breakdown,
  overallRating,
  reviewsLabel,
}: {
  total: number;
  breakdown: Record<number, number>;
  overallRating: number;
  reviewsLabel: string;
}) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
      <div className="shrink-0 text-center sm:min-w-[7rem] sm:text-left">
        <p className="text-3xl font-bold text-laku-ink">
          {overallRating.toFixed(1)}
        </p>
        <div className="mt-1 flex justify-center sm:justify-start">
          <StarRow value={overallRating} size="md" />
        </div>
        <p className="mt-1 text-sm text-laku-muted">{reviewsLabel}</p>
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = breakdown[rating] ?? 0;
          const width = total > 0 ? (count / total) * 100 : 0;
          return (
            <div key={rating} className="flex items-center gap-2 text-xs text-laku-muted">
              <span className="w-3 tabular-nums">{rating}</span>
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-laku-chip">
                <div
                  className="h-full rounded-full bg-laku-rating-star"
                  style={{ width: `${width}%` }}
                />
              </div>
              <span className="w-6 text-right tabular-nums">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ReviewerAvatar({
  name,
  imageUrl,
}: {
  name: string;
  imageUrl?: string | null;
}) {
  const initial = (name || "U").charAt(0).toUpperCase();
  return (
    <div className="relative size-9 shrink-0 overflow-hidden rounded-full bg-laku-chip">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="36px"
          className="object-cover"
          unoptimized
        />
      ) : (
        <span className="flex h-full items-center justify-center text-sm font-semibold text-laku-muted">
          {initial}
        </span>
      )}
    </div>
  );
}

export default async function ProductReviews({
  productId,
  reviews,
  variant = "panel",
}: {
  productId: string;
  reviews: ProductReviewsData | null;
  /** panel = product PDP inline; list = full reviews page */
  variant?: "panel" | "list";
}) {
  const t = await getTranslations();
  const total = reviews?.totalReviews ?? 0;
  const overallRating = reviews?.overallRating ?? 0;
  const breakdown = reviews?.breakdown ?? { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  const list = reviews?.reviews ?? [];
  const moreHref = `/product/${encodeURIComponent(productId)}/reviews`;
  const isPanel = variant === "panel";

  return (
    <div>
      {isPanel ? (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-laku-ink">
            {t("product.reviewsTitle")}
          </h2>
          {total > 0 ? (
            <Link
              href={moreHref}
              className="shrink-0 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
              aria-label={t("product.moreReviewsA11y")}
            >
              {t("product.moreReviews")}
            </Link>
          ) : (
            <span
              className="shrink-0 text-sm font-semibold text-laku-blue/40"
              aria-disabled="true"
            >
              {t("product.moreReviews")}
            </span>
          )}
        </div>
      ) : null}

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white px-5 py-12 text-center">
          <MessageCircle className="size-8 text-laku-faint" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-laku-ink">
            {t("product.noReviewsYet")}
          </p>
        </div>
      ) : isPanel ? (
        <div className="rounded-2xl bg-white p-5">
          <RatingBreakdown
            total={total}
            breakdown={breakdown}
            overallRating={overallRating}
            reviewsLabel={`${formatNumber(total, t.locale)} ${t("product.reviewsCount")}`}
          />
          <ul className="mt-5">
            {list.map((review) => (
              <li
                key={review.id}
                className="flex gap-3 border-t border-laku-line/70 py-4 first:border-t-0 first:pt-0 last:pb-0"
              >
                <ReviewerAvatar
                  name={review.reviewerDisplayName}
                  imageUrl={review.reviewerProfileImage}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <StarRow value={review.rating} />
                    <p className="truncate text-sm font-semibold text-laku-ink">
                      {review.reviewerDisplayName}
                    </p>
                    <span className="text-xs text-laku-faint">
                      {formatRelativeReviewDate(review.createdAt, t)}
                    </span>
                  </div>
                  {review.title ? (
                    <p className="mt-2 text-sm font-semibold text-laku-ink">
                      {review.title}
                    </p>
                  ) : null}
                  {review.comment ? (
                    <p className="mt-1 text-sm/6 text-laku-ink">
                      {`\u201c${review.comment}\u201d`}
                    </p>
                  ) : null}
                  <ReviewImageStrip
                    urls={review.imageUrls ?? []}
                    openLabel={t("productReviewsList.openImage")}
                    closeLabel={t("productReviewsList.close")}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl bg-white p-5">
            <h2 className="mb-4 text-sm font-bold text-laku-ink">
              {t("productReviewsList.overall")}
            </h2>
            <RatingBreakdown
              total={total}
              breakdown={breakdown}
              overallRating={overallRating}
              reviewsLabel={`${formatNumber(total, t.locale)} ${t("product.reviewsCount")}`}
            />
          </div>

          <div className="rounded-2xl bg-white p-5">
            <h2 className="mb-3 text-sm font-bold text-laku-ink">
              {t("productReviewsList.latest")}
            </h2>
            <ul>
              {list.map((review) => {
                const packageLabel = review.purchasedPackage
                  ? displayPackageType(review.purchasedPackage)
                  : null;

                return (
                  <li
                    key={review.id}
                    className="flex gap-3 border-t border-laku-line/70 py-4 first:border-t-0 first:pt-0 last:pb-0"
                  >
                    <ReviewerAvatar
                      name={review.reviewerDisplayName}
                      imageUrl={review.reviewerProfileImage}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-laku-ink">
                        {review.reviewerDisplayName}
                      </p>
                      <div className="mt-1">
                        <StarRow value={review.rating} />
                      </div>
                      {review.purchasedVariantName || packageLabel ? (
                        <div className="mt-1 space-y-0.5 text-xs text-laku-muted">
                          {review.purchasedVariantName ? (
                            <p className="line-clamp-2">
                              {review.purchasedVariantName}
                            </p>
                          ) : null}
                          {packageLabel ? <p>{packageLabel}</p> : null}
                        </div>
                      ) : null}
                      {review.title ? (
                        <p className="mt-2 text-sm font-semibold text-laku-ink">
                          {review.title}
                        </p>
                      ) : null}
                      {review.comment ? (
                        <p className="mt-1 text-sm/6 text-laku-ink">
                          {review.comment}
                        </p>
                      ) : null}
                      <p className="mt-2 text-xs text-laku-faint">
                        {formatDate(review.createdAt, t.locale)}
                      </p>
                      <ReviewImageStrip
                        urls={review.imageUrls ?? []}
                        openLabel={t("productReviewsList.openImage")}
                        closeLabel={t("productReviewsList.close")}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
