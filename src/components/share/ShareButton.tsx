"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

import { useTranslations } from "@/i18n/client";

type Props = {
  title: string;
  text?: string;
  url: string;
};

export default function ShareButton({ title, text, url }: Props) {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User dismissed the sheet, or sharing is unavailable: fall back to copying.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-lg border border-laku-line bg-white px-4 py-2.5 text-sm font-semibold text-laku-ink transition-colors hover:border-laku-blue hover:text-laku-blue"
    >
      {copied ? (
        <Check className="size-4 text-laku-ship" aria-hidden />
      ) : (
        <Share2 className="size-4" aria-hidden />
      )}
      {copied ? t("product.linkCopied") : t("product.share")}
    </button>
  );
}
