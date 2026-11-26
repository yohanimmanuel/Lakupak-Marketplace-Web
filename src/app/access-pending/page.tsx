import type { Metadata } from "next";
import Link from "next/link";

import { getTranslations } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("auth.membership.pendingTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function AccessPendingPage() {
  const t = await getTranslations();

  return (
    <div className="mx-auto max-w-md px-4 py-16 md:px-6">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h1 className="text-2xl font-bold text-amber-950">{t("auth.membership.pendingTitle")}</h1>
        <p className="mt-3 text-sm leading-6 text-amber-900/90">{t("auth.membership.pendingBody")}</p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-laku-blue px-4 text-sm font-bold text-white hover:bg-laku-blue-dark"
        >
          {t("auth.membership.backHome")}
        </Link>
      </div>
    </div>
  );
}
