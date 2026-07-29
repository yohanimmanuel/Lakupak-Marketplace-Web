"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useId, useState } from "react";
import { CheckCircle2, Star } from "lucide-react";

import { submitDistributorReviewAction } from "@/app/actions/distributorReviews";
import { useTranslations } from "@/i18n/client";

const INITIAL = { ok: false } as const;

function StarPicker({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  const t = useTranslations();
  const labelId = useId();

  return (
    <div>
      <p id={labelId} className="mb-1.5 text-xs font-semibold text-laku-muted">
        {label}
      </p>
      <div
        role="group"
        aria-labelledby={labelId}
        className="flex gap-1"
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(selected ? 0 : n)}
              className="rounded p-0.5 transition-transform hover:scale-110"
              aria-pressed={selected}
              aria-label={
                selected
                  ? t("distributorRating.starA11ySelected", {
                      label,
                      rating: n,
                    })
                  : t("distributorRating.starA11y", { label, rating: n })
              }
            >
              <Star
                className={`size-7 ${
                  n <= value
                    ? "fill-laku-rating-star text-laku-rating-star"
                    : "text-laku-faint"
                }`}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DistributorRatingForm({
  distributorId,
  distributorName,
}: {
  distributorId: number;
  distributorName: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    submitDistributorReviewAction,
    INITIAL,
  );
  const [overallRating, setOverallRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [productQualityRating, setProductQualityRating] = useState(0);
  const [wouldOrderAgain, setWouldOrderAgain] = useState<
    "" | "yes" | "no" | "maybe"
  >("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!state.ok) return;
    const timer = window.setTimeout(() => {
      router.push(`/distributor/${distributorId}`);
      router.refresh();
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [state.ok, distributorId, router]);

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <input type="hidden" name="distributorId" value={distributorId} />
      <input type="hidden" name="overallRating" value={overallRating} />
      <input type="hidden" name="communicationRating" value={communicationRating} />
      <input type="hidden" name="deliveryRating" value={deliveryRating} />
      <input
        type="hidden"
        name="productQualityRating"
        value={productQualityRating}
      />
      <input type="hidden" name="wouldOrderAgain" value={wouldOrderAgain} />
      <input type="hidden" name="comment" value={comment} />

      <div className="rounded-2xl bg-white p-5">
        <p className="text-xs font-semibold text-laku-muted">
          {t("distributorRating.distributorLabel")}
        </p>
        <p className="mt-1 text-sm font-semibold text-laku-ink">
          {distributorName}
        </p>
      </div>

      <div className="space-y-4 rounded-2xl bg-white p-5">
        <StarPicker
          label={t("distributorRating.overall")}
          value={overallRating}
          onChange={setOverallRating}
        />
        <StarPicker
          label={t("distributorRating.communication")}
          value={communicationRating}
          onChange={setCommunicationRating}
        />
        <StarPicker
          label={t("distributorRating.delivery")}
          value={deliveryRating}
          onChange={setDeliveryRating}
        />
        <StarPicker
          label={t("distributorRating.quality")}
          value={productQualityRating}
          onChange={setProductQualityRating}
        />
      </div>

      <div className="rounded-2xl bg-white p-5">
        <p className="mb-2 text-xs font-semibold text-laku-muted">
          {t("distributorRating.wouldOrderAgain")}
        </p>
        <div className="flex flex-wrap gap-2">
          {(["yes", "no", "maybe"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() =>
                setWouldOrderAgain((prev) => (prev === option ? "" : option))
              }
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                wouldOrderAgain === option
                  ? "border-laku-blue bg-laku-blue/10 text-laku-blue"
                  : "border-laku-line text-laku-ink"
              }`}
            >
              {t(`distributorRating.would.${option}`)}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-xs font-semibold text-laku-muted">
          {t("distributorRating.comment")}
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={4}
            maxLength={2000}
            placeholder={t("distributorRating.commentPlaceholder")}
            className="mt-1.5 w-full rounded-lg border border-laku-line px-3.5 py-2.5 text-sm text-laku-ink outline-none focus:border-laku-blue"
          />
        </label>
      </div>

      {state.error ? (
        <p className="rounded-lg bg-laku-discount-bg px-4 py-3 text-sm font-medium text-laku-discount-ink">
          {state.error}
        </p>
      ) : null}
      {state.ok && state.message ? (
        <p className="flex items-center gap-2 rounded-lg bg-laku-ship/10 px-4 py-3 text-sm font-medium text-laku-buy">
          <CheckCircle2 className="size-4" aria-hidden />
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending || state.ok || overallRating < 1}
        className="w-full rounded-lg bg-laku-blue px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending
          ? t("distributorRating.submitting")
          : t("distributorRating.submit")}
      </button>
    </form>
  );
}
