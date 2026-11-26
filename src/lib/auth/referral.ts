import type { Translator } from "@/i18n/translate";

/** Localised copy for the Laku API's closed-marketplace referral / membership errors. */
export function referralErrorMessage(t: Translator, code: string | undefined): string | null {
  if (code === "REFERRAL_CODE_REQUIRED") return t("auth.referralCode.required");
  if (code === "REFERRAL_CODE_INVALID") return t("auth.referralCode.invalid");
  if (code === "ACCESS_REVOKED") return t("auth.membership.revoked");
  if (code === "MEMBERSHIP_PENDING") return t("auth.membership.pending");
  return null;
}
