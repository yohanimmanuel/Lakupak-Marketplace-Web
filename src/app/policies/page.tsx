import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import PoliciesContent from "@/components/legal/PoliciesContent";
import { getTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("policies.metaTitle"),
    robots: { index: true, follow: true },
  };
}

export default async function PoliciesPage() {
  const t = await getTranslations();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <Link
        href="/settings"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("policies.backToSettings")}
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-laku-ink">
        {t("policies.headerTitle")}
      </h1>

      <PoliciesContent />

      <div className="mt-6">
        <Link
          href="/settings"
          className="inline-flex w-full items-center justify-center rounded-xl bg-laku-blue px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark sm:w-auto"
        >
          {t("policies.actions.understand")}
        </Link>
      </div>
    </div>
  );
}
