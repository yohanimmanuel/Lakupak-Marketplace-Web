import { LocateFixed, LoaderCircle } from "lucide-react";

import { useTranslations } from "@/i18n/client";

type Props = {
  /** Client callback from parent forms (named *Action for Next.js TS 71007). */
  onLocateAction: () => void;
  locating?: boolean;
  disabled?: boolean;
};

/**
 * Matches AddressLocationFields "Use current location" on mobile.
 * Imported only by client forms (RegisterForm / AddressForm).
 */
export default function UseCurrentLocationButton({
  onLocateAction,
  locating = false,
  disabled = false,
}: Props) {
  const t = useTranslations();
  const busy = locating || disabled;

  return (
    <button
      type="button"
      onClick={onLocateAction}
      disabled={busy}
      aria-busy={locating}
      className="flex w-full items-center justify-center gap-2 rounded-xl border border-laku-blue bg-white px-4 py-3 text-sm font-semibold text-laku-blue transition-colors hover:bg-laku-blue/5 disabled:opacity-90"
    >
      {locating ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
      ) : (
        <LocateFixed className="size-4" aria-hidden />
      )}
      {locating
        ? t("location.locatingCurrent")
        : t("location.useCurrentLocation")}
    </button>
  );
}
