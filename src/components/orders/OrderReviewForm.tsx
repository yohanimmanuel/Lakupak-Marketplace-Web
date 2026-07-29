"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, Package, Star } from "lucide-react";

import { submitOrderReviewsAction } from "@/app/actions/orders";
import PhotoUploadGrid from "@/components/orders/PhotoUploadGrid";
import { useTranslations } from "@/i18n/client";
import type { OrderReviewsPayload } from "@/lib/api/orders";
import type { OrderItem } from "@/lib/api/types";

type ReviewDraft = {
  rating: number;
  title: string;
  comment: string;
  images: string[];
};

function emptyDraft(): ReviewDraft {
  return { rating: 0, title: "", comment: "", images: [] };
}

function draftFromExisting(
  item: OrderItem,
  existing: OrderReviewsPayload | null | undefined,
): ReviewDraft {
  const review = existing?.productReviews?.find(
    (entry) => entry.productId === item.productId,
  );
  if (!review) return emptyDraft();
  return {
    rating: review.rating ?? 0,
    title: review.title ?? "",
    comment: review.comment ?? "",
    images: review.imageUrls?.slice(0, 5) ?? [],
  };
}

export default function OrderReviewForm({
  orderId,
  items,
  existingReviews,
}: {
  orderId: string;
  items: OrderItem[];
  existingReviews?: OrderReviewsPayload | null;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isEditing = Boolean(existingReviews?.productReviews?.length);
  const [drafts, setDrafts] = useState<ReviewDraft[]>(() =>
    items.map((item) => draftFromExisting(item, existingReviews)),
  );
  const [deliveryRating, setDeliveryRating] = useState(
    () => existingReviews?.deliveryReview?.deliveryRating ?? 0,
  );
  const [deliveryComment, setDeliveryComment] = useState(
    () => existingReviews?.deliveryReview?.deliveryComment ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [uploadingCount, setUploadingCount] = useState(0);

  const backHref = `/orders/${encodeURIComponent(orderId)}`;
  const photosBusy = uploadingCount > 0;
  const actionsDisabled = pending || photosBusy;

  const setPhotoUploading = (busy: boolean) => {
    setUploadingCount((count) => Math.max(0, count + (busy ? 1 : -1)));
  };

  const updateDraft = (index: number, patch: Partial<ReviewDraft>) => {
    setDrafts((prev) =>
      prev.map((draft, i) => (i === index ? { ...draft, ...patch } : draft)),
    );
  };

  const submit = () => {
    if (actionsDisabled) return;
    if (drafts.some((draft) => draft.rating < 1)) {
      setError(t("orderReview.errors.ratingRequired"));
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await submitOrderReviewsAction({
        orderId,
        productReviews: items.map((item, index) => ({
          productId: item.productId ?? "",
          rating: drafts[index]?.rating ?? 0,
          title: drafts[index]?.title.trim() || undefined,
          comment: drafts[index]?.comment.trim() || undefined,
          imageUrls: drafts[index]?.images.slice(0, 5),
        })),
        deliveryRating: deliveryRating > 0 ? deliveryRating : undefined,
        deliveryComment: deliveryComment.trim() || undefined,
      });

      if (!result.ok) {
        setError(result.error ?? t("orderDetails.actionError"));
        return;
      }

      router.push(backHref);
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <Link
        href={backHref}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("orderReview.backToOrder")}
      </Link>

      <h1 className="text-2xl font-bold text-laku-ink">
        {isEditing ? t("orderReview.editTitle") : t("orderReview.title")}
      </h1>
      <p className="mt-1 text-sm text-laku-muted">{t("orderReview.body")}</p>

      <div className="mt-6 space-y-4">
        {items.map((item, index) => (
          <section key={`${item.productId}-${index}`} className="rounded-2xl bg-white p-5">
            <div className="flex gap-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-laku-chip">
                {item.images?.[0] ? (
                  <Image
                    src={item.images[0]}
                    alt=""
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center">
                    <Package className="size-5 text-laku-faint" aria-hidden />
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold text-laku-ink">
                  {item.productName ?? t("product.distributorFallback")}
                </p>
                {item.variantNameSnapshot ? (
                  <p className="mt-0.5 text-xs text-laku-muted">
                    {item.variantNameSnapshot}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold text-laku-muted">
                {t("orderReview.productRating")}
              </p>
              <StarPicker
                value={drafts[index]?.rating ?? 0}
                onChange={(rating) => updateDraft(index, { rating })}
              />
            </div>

            <input
              type="text"
              value={drafts[index]?.title ?? ""}
              onChange={(event) => updateDraft(index, { title: event.target.value })}
              placeholder={t("orderReview.titlePlaceholder")}
              className="mt-3 w-full rounded-lg border border-laku-line bg-white px-3 py-2.5 text-sm text-laku-ink outline-none focus:border-laku-blue"
            />
            <textarea
              value={drafts[index]?.comment ?? ""}
              onChange={(event) => updateDraft(index, { comment: event.target.value })}
              rows={3}
              placeholder={t("orderReview.commentPlaceholder")}
              className="mt-2 w-full rounded-lg border border-laku-line bg-white px-3 py-2.5 text-sm text-laku-ink outline-none focus:border-laku-blue"
            />

            <PhotoUploadGrid
              folder="reviews"
              urls={drafts[index]?.images ?? []}
              onUrlsChange={(images) => updateDraft(index, { images })}
              onBusyChange={setPhotoUploading}
              disabled={pending}
              label={t("orderReview.photosLabel", { max: 5 })}
              hint={t("orderReview.photosHint")}
              addLabel={t("photoUpload.add")}
              uploadingLabel={t("photoUpload.uploading")}
              removeLabel={t("photoUpload.remove")}
              uploadErrorLabel={t("photoUpload.errors.upload")}
            />
          </section>
        ))}

        <section className="rounded-2xl bg-white p-5">
          <h2 className="text-sm font-bold text-laku-ink">
            {t("orderReview.deliveryTitle")}
          </h2>
          <p className="mt-1 text-xs text-laku-muted">{t("orderReview.deliveryBody")}</p>
          <StarPicker value={deliveryRating} onChange={setDeliveryRating} />
          <textarea
            value={deliveryComment}
            onChange={(event) => setDeliveryComment(event.target.value)}
            rows={3}
            placeholder={t("orderReview.deliveryCommentPlaceholder")}
            className="mt-3 w-full rounded-lg border border-laku-line bg-white px-3 py-2.5 text-sm text-laku-ink outline-none focus:border-laku-blue"
          />
        </section>
      </div>

      {error ? (
        <p className="mt-4 text-sm font-medium text-laku-alert">{error}</p>
      ) : null}

      {photosBusy ? (
        <p className="mt-4 text-sm text-laku-muted">{t("photoUpload.waitToSubmit")}</p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={actionsDisabled}
          onClick={submit}
          className="rounded-lg bg-laku-blue px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? t("common.processing")
            : photosBusy
              ? t("photoUpload.uploading")
              : isEditing
                ? t("orderReview.update")
                : t("orderReview.submit")}
        </button>
        {actionsDisabled ? (
          <span
            aria-disabled="true"
            className="rounded-lg border border-laku-line bg-white px-5 py-3 text-sm font-semibold text-laku-ink opacity-60"
          >
            {t("common.cancel")}
          </span>
        ) : (
          <Link
            href={backHref}
            className="rounded-lg border border-laku-line bg-white px-5 py-3 text-sm font-semibold text-laku-ink transition-colors hover:bg-laku-surface"
          >
            {t("common.cancel")}
          </Link>
        )}
      </div>
    </div>
  );
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="rounded p-0.5 transition-transform hover:scale-110"
          aria-label={`${star}`}
        >
          <Star
            className={`size-7 ${
              star <= value
                ? "fill-laku-rating-star text-laku-rating-star"
                : "text-laku-line"
            }`}
            aria-hidden
          />
        </button>
      ))}
    </div>
  );
}
