import Link from "next/link";
import { Apple, Play } from "lucide-react";

import LakuLogo from "@/components/brand/LakuLogo";
import { getTranslations } from "@/i18n/server";
import { ANDROID_STORE_URL, dashboardLandingUrl, IOS_STORE_URL } from "@/lib/config";

export default async function SiteFooter() {
  const t = await getTranslations();

  return (
    <footer className="border-t border-laku-line bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-3 md:px-6">
        <div>
          <div className="mb-3">
            <LakuLogo variant="onLight" className="h-8 w-auto md:h-9" />
          </div>
          <p className="max-w-sm text-sm/6 text-laku-muted">{t("footer.about")}</p>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold text-laku-ink">
            {t("footer.exploreTitle")}
          </h2>
          <ul className="space-y-2 text-sm text-laku-muted">
            <li>
              <Link href="/" className="hover:text-laku-blue">
                {t("nav.home")}
              </Link>
            </li>
            <li>
              <Link href="/categories" className="hover:text-laku-blue">
                {t("nav.categories")}
              </Link>
            </li>
            <li>
              <Link href="/search" className="hover:text-laku-blue">
                {t("nav.allProducts")}
              </Link>
            </li>
            <li>
              <a
                href={dashboardLandingUrl(t.locale)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-laku-blue"
              >
                {t("nav.iAmDistributor")}
              </a>
            </li>
            <li>
              <Link href="/help" className="hover:text-laku-blue">
                {t("settings.rows.helpCenter")}
              </Link>
            </li>
            <li>
              <Link href="/policies" className="hover:text-laku-blue">
                {t("settings.rows.policies")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-bold text-laku-ink">
            {t("footer.appTitle")}
          </h2>
          <p className="mb-4 text-sm/6 text-laku-muted">{t("footer.appBody")}</p>
          <div className="flex flex-wrap gap-3">
            <a
              href={ANDROID_STORE_URL}
              className="inline-flex items-center gap-2 rounded-lg bg-laku-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-laku-ink/90"
            >
              <Play className="size-4" aria-hidden />
              Google Play
            </a>
            <a
              href={IOS_STORE_URL}
              className="inline-flex items-center gap-2 rounded-lg border border-laku-line px-4 py-2.5 text-sm font-semibold text-laku-ink transition-colors hover:bg-laku-surface"
            >
              <Apple className="size-4" aria-hidden />
              App Store
            </a>
          </div>
        </div>
      </div>

      <div className="border-t border-laku-line">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs text-laku-muted md:px-6">
          {t("footer.copyright", { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
}
