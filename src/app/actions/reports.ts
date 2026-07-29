"use server";

import type { ActionState } from "@/app/actions/cart";
import { getTranslations } from "@/i18n/server";
import { submitDistributorReport } from "@/lib/api/reports";
import { getSession } from "@/lib/auth/session";

const REASON_CODES = new Set([
  "fraud",
  "poor_service",
  "quality",
  "policy",
  "other",
]);

export async function submitDistributorReportAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const t = await getTranslations();
  const session = await getSession();
  if (!session) {
    return { ok: false, error: t("reportDistributor.errors.signIn") };
  }

  const distributorId = Number.parseInt(
    String(formData.get("distributorId") ?? ""),
    10,
  );
  const reasonCode = String(formData.get("reasonCode") ?? "").trim();
  const reasonDetail = String(formData.get("reasonDetail") ?? "").trim();
  const imageUrls = formData
    .getAll("imageUrls")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!Number.isFinite(distributorId) || distributorId < 1) {
    return { ok: false, error: t("reportDistributor.errors.invalidDistributor") };
  }
  if (!REASON_CODES.has(reasonCode)) {
    return { ok: false, error: t("reportDistributor.errors.selectReason") };
  }
  if (reasonCode === "other" && !reasonDetail) {
    return { ok: false, error: t("reportDistributor.errors.provideReason") };
  }
  if (imageUrls.length === 0) {
    return { ok: false, error: t("reportDistributor.errors.photosRequired") };
  }

  const reasonText =
    reasonCode === "other"
      ? reasonDetail
      : t(`reportDistributor.reasons.${reasonCode}.label`);

  const result = await submitDistributorReport({
    token: session.token,
    input: {
      distributorId,
      reasonCode,
      reasonText,
      reasonDetail: reasonCode === "other" ? reasonDetail : undefined,
      imageUrls,
    },
  });

  if (!result.ok) {
    return { ok: false, error: result.error || t("reportDistributor.errors.submit") };
  }

  return { ok: true, message: t("reportDistributor.submitted") };
}
