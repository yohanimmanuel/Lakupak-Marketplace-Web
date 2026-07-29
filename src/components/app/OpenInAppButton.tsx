"use client";

import { useCallback } from "react";
import { Smartphone } from "lucide-react";

import { useTranslations } from "@/i18n/client";
import { ANDROID_STORE_URL, IOS_STORE_URL } from "@/lib/config";

type Props = {
  appUrl: string;
  label?: string;
  variant?: "primary" | "outline";
};

/**
 * Tries the app's deep link and falls back to the store when nothing handles it,
 * so visitors without the app still land somewhere useful.
 */
export default function OpenInAppButton({
  appUrl,
  label,
  variant = "primary",
}: Props) {
  const t = useTranslations();
  const handleClick = useCallback(() => {
    const startedAt = Date.now();
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const storeUrl = isIos ? IOS_STORE_URL : ANDROID_STORE_URL;

    const timer = window.setTimeout(() => {
      // Still here after the deep link attempt means the app did not open.
      if (Date.now() - startedAt < 2500 && !document.hidden) {
        window.location.href = storeUrl;
      }
    }, 1200);

    function clear() {
      window.clearTimeout(timer);
    }

    document.addEventListener("visibilitychange", clear, { once: true });
    window.location.href = appUrl;
  }, [appUrl]);

  const className =
    variant === "primary"
      ? "inline-flex items-center gap-2 rounded-lg bg-laku-blue px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
      : "inline-flex items-center gap-2 rounded-lg border border-laku-line bg-white px-5 py-3 text-sm font-bold text-laku-ink transition-colors hover:border-laku-blue hover:text-laku-blue";

  return (
    <button type="button" onClick={handleClick} className={className}>
      <Smartphone className="size-4" aria-hidden />
      {label ?? t("nav.openInApp")}
    </button>
  );
}
