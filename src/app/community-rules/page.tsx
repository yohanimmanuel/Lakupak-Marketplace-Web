import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import CommunityRulesContent from "@/components/legal/CommunityRulesContent";
import { getTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("communityRules.metaTitle"),
    robots: { index: true, follow: true },
  };
}

export default async function CommunityRulesPage() {
  const t = await getTranslations();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <Link
        href="/settings"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("communityRules.backToSettings")}
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-laku-ink">
        {t("communityRules.title")}
      </h1>

      <CommunityRulesContent />
    </div>
  );
}
