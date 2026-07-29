import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("helpCenter.metaTitle"),
    robots: { index: true, follow: true },
  };
}

const FAQ_KEYS = [
  "verifyPhone",
  "googleLogin",
  "whereIsMyOrder",
  "walletRefunds",
  "contactSupport",
] as const;

export default async function HelpCenterPage() {
  const t = await getTranslations();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <Link
        href="/settings"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("helpCenter.backToSettings")}
      </Link>

      <h1 className="text-2xl font-bold text-laku-ink">{t("helpCenter.title")}</h1>

      <section className="mt-6 rounded-2xl bg-white p-5 md:p-6">
        <h2 className="mb-5 text-lg font-bold text-laku-ink">
          {t("helpCenter.faqTitle")}
        </h2>

        <div className="space-y-5">
          {FAQ_KEYS.map((key) => (
            <div key={key}>
              <h3 className="text-sm font-bold text-laku-ink">
                {t(`helpCenter.faqs.${key}.q`)}
              </h3>
              <p className="mt-1.5 text-sm/6 text-laku-muted">
                {t(`helpCenter.faqs.${key}.a`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6">
        <Link
          href="/settings"
          className="inline-flex w-full items-center justify-center rounded-xl bg-laku-blue px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark sm:w-auto"
        >
          {t("helpCenter.done")}
        </Link>
      </div>
    </div>
  );
}
