import type { Translator } from "@/i18n/translate";

/** Localised copy for the Laku API's closed-marketplace referral / invite errors. */
export function referralErrorMessage(t: Translator, code: string | undefined): string | null {
  if (code === "REFERRAL_CODE_REQUIRED") return t("auth.referralCode.required");
  if (code === "REFERRAL_CODE_INVALID") return t("auth.referralCode.invalid");
  if (code === "INVITE_INVALID") return t("auth.invite.invalid");
  if (code === "INVITE_EXPIRED") return t("auth.invite.expired");
  if (code === "INVITE_USED") return t("auth.invite.used");
  if (code === "INVITE_ALREADY_LINKED") return t("auth.invite.alreadyLinked");
  if (code === "ACCESS_REVOKED") return t("auth.invite.revoked");
  return null;
}
