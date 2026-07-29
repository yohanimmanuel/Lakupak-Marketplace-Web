import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Tag } from "lucide-react";

import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { getHomeOffersList } from "@/lib/api/offers";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("offers.title"),
    robots: { index: false, follow: false },
  };
}

export default async function OffersPage() {
  const t = await getTranslations();
  const session = await getSession();

  if (!session) {
    return (
      <SignedOutPrompt
        title={t("offers.states.signInToView")}
        body={t("offers.intro")}
      />
    );
  }

  const offers = await getHomeOffersList(session.token);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("nav.home")}
      </Link>

      <h1 className="text-2xl font-bold text-laku-ink">{t("offers.title")}</h1>
      <p className="mt-1 text-sm text-laku-muted">{t("offers.intro")}</p>

      {offers.length === 0 ? (
        <div className="mt-8 rounded-2xl bg-white px-5 py-12 text-center">
          <Tag className="mx-auto size-8 text-laku-faint" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-laku-ink">
            {t("offers.states.emptyTitle")}
          </p>
          <p className="mt-1 text-sm text-laku-muted">
            {t("offers.states.emptyHint")}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {offers.map((offer) => {
            const hero =
              offer.customBannerImageUrl || offer.bannerImageUrl || null;
            return (
              <li key={offer.id}>
                <Link
                  href={`/offers/${offer.id}`}
                  className="relative block min-h-40 overflow-hidden rounded-2xl transition-transform hover:-translate-y-0.5"
                  style={{
                    backgroundColor: offer.backgroundColor,
                    color: offer.textColor,
                  }}
                >
                  {hero ? (
                    <Image
                      src={hero}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 768px, 100vw"
                      className="object-cover"
                      unoptimized
                    />
                  ) : null}
                  <div
                    className={`relative z-10 flex min-h-40 flex-col justify-end p-5 ${
                      hero ? "bg-linear-to-t from-black/55 to-transparent" : ""
                    }`}
                  >
                    {offer.discountText ? (
                      <span className="mb-2 inline-flex w-fit rounded bg-white/20 px-2 py-0.5 text-xs font-bold">
                        {offer.discountText}
                      </span>
                    ) : null}
                    <p className="text-lg font-bold">{offer.title}</p>
                    {offer.subtitle ? (
                      <p className="mt-1 text-sm opacity-90">{offer.subtitle}</p>
                    ) : null}
                    {offer.endDateText ? (
                      <p className="mt-2 text-xs opacity-80">{offer.endDateText}</p>
                    ) : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
