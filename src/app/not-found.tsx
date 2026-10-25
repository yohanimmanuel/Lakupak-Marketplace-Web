import Link from "next/link";

import { getTranslations } from "@/i18n/server";

export default async function NotFound() {
  const t = await getTranslations();

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center md:px-6">
      <h1 className="text-3xl font-bold text-laku-ink">{t("notFound.title")}</h1>
      <p className="mt-3 text-sm/6 text-laku-muted">{t("notFound.body")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-laku-blue px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
        >
          {t("notFound.home")}
        </Link>
        <Link
          href="/search"
          className="rounded-lg border border-laku-line bg-white px-5 py-3 text-sm font-bold text-laku-ink transition-colors hover:border-laku-blue hover:text-laku-blue"
        >
          {t("nav.allProducts")}
        </Link>
      </div>
    </div>
  );
}
