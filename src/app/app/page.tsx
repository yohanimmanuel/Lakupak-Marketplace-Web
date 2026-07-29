import type { Metadata } from "next";
import { Apple, Play } from "lucide-react";

import OpenInAppButton from "@/components/app/OpenInAppButton";
import { getTranslations } from "@/i18n/server";
import { ANDROID_STORE_URL, IOS_STORE_URL } from "@/lib/config";
import { homeAppUrl } from "@/lib/share";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("app.metaTitle"),
    description: t("app.metaDescription"),
    alternates: { canonical: "/app" },
  };
}

export default async function AppPage() {
  const t = await getTranslations();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center md:px-6">
      <h1 className="text-3xl font-bold text-balance text-laku-ink">
        {t("app.title")}
      </h1>
      <p className="mx-auto mt-3 max-w-lg text-sm/6 text-laku-muted">{t("app.body")}</p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <OpenInAppButton appUrl={homeAppUrl()} />
        <a
          href={ANDROID_STORE_URL}
          className="inline-flex items-center gap-2 rounded-lg border border-laku-line bg-white px-5 py-3 text-sm font-bold text-laku-ink transition-colors hover:border-laku-blue hover:text-laku-blue"
        >
          <Play className="size-4" aria-hidden />
          Google Play
        </a>
        <a
          href={IOS_STORE_URL}
          className="inline-flex items-center gap-2 rounded-lg border border-laku-line bg-white px-5 py-3 text-sm font-bold text-laku-ink transition-colors hover:border-laku-blue hover:text-laku-blue"
        >
          <Apple className="size-4" aria-hidden />
          App Store
        </a>
      </div>
    </div>
  );
}
