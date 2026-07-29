import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { getHomeOfferById } from "@/lib/api/offers";
import { getSession } from "@/lib/auth/session";

type Params = Promise<{ id: string }>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("offers.title"),
    robots: { index: false, follow: false },
  };
}

export default async function OfferDetailPage({ params }: { params: Params }) {
  const t = await getTranslations();
  const session = await getSession();
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);

  if (!session) {
    return (
      <SignedOutPrompt
        title={t("offers.states.signInToView")}
        body={t("offers.intro")}
      />
    );
  }

  if (!Number.isFinite(id)) notFound();

  const offer = await getHomeOfferById(session.token, id);
  if (!offer) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
        <Link
          href="/offers"
          className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("offers.title")}
        </Link>
        <p className="rounded-2xl bg-white p-6 text-sm text-laku-muted">
          {t("offers.states.noLongerAvailable")}
        </p>
      </div>
    );
  }

  const hero = offer.customBannerImageUrl || offer.bannerImageUrl || null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <Link
        href="/offers"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("offers.title")}
      </Link>

      <div
        className="relative min-h-52 overflow-hidden rounded-2xl"
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
            priority
          />
        ) : null}
        <div
          className={`relative z-10 flex min-h-52 flex-col justify-end p-6 ${
            hero ? "bg-linear-to-t from-black/60 to-transparent" : ""
          }`}
        >
          {offer.discountText ? (
            <span className="mb-2 inline-flex w-fit rounded bg-white/20 px-2 py-0.5 text-xs font-bold">
              {offer.discountText}
            </span>
          ) : null}
          <h1 className="text-2xl font-bold">{offer.title}</h1>
          {offer.subtitle ? (
            <p className="mt-1 text-sm opacity-90">{offer.subtitle}</p>
          ) : null}
          {offer.endDateText ? (
            <p className="mt-2 text-xs opacity-80">{offer.endDateText}</p>
          ) : null}
        </div>
      </div>

      <section className="mt-6 rounded-2xl bg-white p-6">
        {offer.detailsBody?.trim() ? (
          <p className="whitespace-pre-line text-sm/7 text-laku-ink">
            {offer.detailsBody}
          </p>
        ) : (
          <p className="text-sm text-laku-muted">{t("offers.states.noDetails")}</p>
        )}
      </section>
    </div>
  );
}
