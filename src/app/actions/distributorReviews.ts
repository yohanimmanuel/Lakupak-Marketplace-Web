"use server";

import { revalidatePath } from "next/cache";

import type { ActionState } from "@/app/actions/cart";
import { getTranslations } from "@/i18n/server";
import { submitDistributorReview } from "@/lib/api/marketplace";
import { getSession } from "@/lib/auth/session";

/** Whole-number string only — rejects truncation cases like "3.7" or "12abc". */
function parseStrictInt(raw: FormDataEntryValue | null): number | null {
  const value = String(raw ?? "").trim();
  if (!/^-?\d+$/.test(value)) return null;
  const n = Number(value);
  return Number.isSafeInteger(n) ? n : null;
}

function isRatingInRange(
  value: number | null,
  min: number,
  max: number,
): value is number {
  return value != null && value >= min && value <= max;
}

export async function submitDistributorReviewAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await getTranslations();
  const session = await getSession();
  if (!session) {
    return { ok: false, error: t("distributorRating.errors.signIn") };
  }

  const distributorId = parseStrictInt(formData.get("distributorId"));
  const overallRating = parseStrictInt(formData.get("overallRating"));
  const communicationRating = parseStrictInt(formData.get("communicationRating"));
  const deliveryRating = parseStrictInt(formData.get("deliveryRating"));
  const productQualityRating = parseStrictInt(
    formData.get("productQualityRating"),
  );
  const wouldRaw = String(formData.get("wouldOrderAgain") ?? "").trim();
  const wouldOrderAgain =
    wouldRaw === "yes" || wouldRaw === "no" || wouldRaw === "maybe"
      ? wouldRaw
      : null;
  const comment = String(formData.get("comment") ?? "").trim();

  if (distributorId == null || distributorId < 1) {
    return { ok: false, error: t("distributorRating.errors.invalid") };
  }
  if (!isRatingInRange(overallRating, 1, 5)) {
    return { ok: false, error: t("distributorRating.errors.ratingRequired") };
  }
  if (
    !isRatingInRange(communicationRating, 0, 5) ||
    !isRatingInRange(deliveryRating, 0, 5) ||
    !isRatingInRange(productQualityRating, 0, 5)
  ) {
    return { ok: false, error: t("distributorRating.errors.ratingRequired") };
  }

  const result = await submitDistributorReview({
    token: session.token,
    distributorId,
    overallRating,
    communicationRating,
    deliveryRating,
    productQualityRating,
    wouldOrderAgain,
    comment,
  });

  if (!result.ok) {
    return { ok: false, error: t("distributorRating.errors.submit") };
  }

  revalidatePath(`/distributor/${distributorId}`);
  revalidatePath(`/distributor/${distributorId}/details`);
  revalidatePath(`/seller/${distributorId}`);
  return { ok: true, message: t("distributorRating.submitted") };
}
