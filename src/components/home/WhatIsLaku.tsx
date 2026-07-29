import Link from "next/link";
import { PackageCheck, ShieldCheck, Truck } from "lucide-react";

import { getTranslations } from "@/i18n/server";

const POINTS = [
  {
    icon: ShieldCheck,
    titleKey: "whatIsLaku.verifiedTitle",
    bodyKey: "whatIsLaku.verifiedBody",
  },
  {
    icon: PackageCheck,
    titleKey: "whatIsLaku.wholesaleTitle",
    bodyKey: "whatIsLaku.wholesaleBody",
  },
  {
    icon: Truck,
    titleKey: "whatIsLaku.deliveryTitle",
    bodyKey: "whatIsLaku.deliveryBody",
  },
];

/** First-visit context for people who have never heard of Laku. */
export default async function WhatIsLaku() {
  const t = await getTranslations();

  return (
    <section className="px-4 md:px-0">
      <div className="rounded-2xl bg-white p-8 md:p-12">
        <h2 className="text-xl font-bold text-laku-ink md:text-2xl">
          {t("whatIsLaku.title")}
        </h2>
        <p className="mt-2 max-w-2xl text-sm/6 text-laku-muted">
          {t("whatIsLaku.body")}
        </p>

        <div className="mt-8 grid gap-8 md:grid-cols-3">
          {POINTS.map((point) => (
            <div key={point.titleKey}>
              <point.icon className="size-6 text-laku-blue" aria-hidden />
              <h3 className="mt-3 text-base font-bold text-laku-ink">
                {t(point.titleKey)}
              </h3>
              <p className="mt-1 text-sm/6 text-laku-muted">{t(point.bodyKey)}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="rounded-lg bg-laku-blue px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
          >
            {t("nav.registerFree")}
          </Link>
          <Link
            href="/categories"
            className="rounded-lg border border-laku-line px-5 py-3 text-sm font-bold text-laku-ink transition-colors hover:bg-laku-surface"
          >
            {t("whatIsLaku.browseCategories")}
          </Link>
        </div>
      </div>
    </section>
  );
}
