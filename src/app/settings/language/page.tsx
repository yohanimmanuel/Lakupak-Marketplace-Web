import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import LanguageOptions from "@/components/settings/LanguageOptions";
import { getLocale, getTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("settings.pages.language.title"),
    robots: { index: false, follow: false },
  };
}

/** Language is a device preference, so this page works signed out too. */
export default async function LanguageSettingsPage() {
  const [t, locale] = await Promise.all([getTranslations(), getLocale()]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <Link
        href="/settings"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("settings.title")}
      </Link>

      <h1 className="text-2xl font-bold text-laku-ink">
        {t("settings.pages.language.title")}
      </h1>
      <p className="mt-1 text-sm text-laku-muted">
        {t("settings.pages.language.subtitle")}
      </p>

      <LanguageOptions current={locale} />
    </div>
  );
}
