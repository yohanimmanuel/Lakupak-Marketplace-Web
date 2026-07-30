import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  MapPin,
  Star,
  Store,
} from "lucide-react";

import DistributorProductShelf from "@/components/distributor/DistributorProductShelf";
import FollowDistributorButton from "@/components/distributor/FollowDistributorButton";
import { getTranslations } from "@/i18n/server";
import { isFollowingDistributor } from "@/lib/api/following";
import {
  getDistributor,
  getDistributorReviews,
  getProductsBySeller,
} from "@/lib/api/marketplace";
import { getSession } from "@/lib/auth/session";
import { formatNumber } from "@/lib/format";

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const distributorId = Number(id);
  const t = await getTranslations();
  if (!Number.isFinite(distributorId) || distributorId <= 0) {
    return { title: t("distributor.metaTitle") };
  }

  const distributor = await getDistributor(distributorId);
  const name =
    distributor?.companyName?.trim() ||
    distributor?.name?.trim() ||
    t("product.distributorFallback");

  return {
    title: t("distributor.metaTitleNamed", { name }),
  };
}

export default async function DistributorShopPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const distributorId = Number(id);
  const t = await getTranslations();

  if (!Number.isFinite(distributorId) || distributorId <= 0) notFound();

  const [distributor, reviews, products, session] = await Promise.all([
    getDistributor(distributorId),
    getDistributorReviews(distributorId, { page: 1, limit: 1 }),
    getProductsBySeller(distributorId),
    getSession(),
  ]);

  if (!distributor) notFound();

  const isFollowing = session
    ? await isFollowingDistributor({
        distributorId,
        token: session.token,
      })
    : false;

  const displayName =
    distributor.companyName?.trim() ||
    distributor.name?.trim() ||
    t("product.distributorFallback");
  const logo = distributor.logo?.trim() || null;
  const banner = distributor.bannerImage?.trim() || null;
  const rating = reviews?.overallRating ?? 0;
  const reviewCount = reviews?.totalReviews ?? 0;
  const followers = distributor.followersCount ?? 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
      {/* Same stack as account profile: banner → avatar → name/actions row */}
      <section className="overflow-hidden rounded-2xl bg-white">
        <div className="relative h-36 bg-laku-blue/10 md:h-44">
          {banner ? (
            <Image
              src={banner}
              alt=""
              fill
              priority
              sizes="(min-width: 768px) 1152px, 100vw"
              className="object-cover"
            />
          ) : null}
        </div>

        <div className="px-5 pb-5 md:px-6">
          <div className="-mt-9">
            <span className="relative flex size-18 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-laku-blue/10 text-laku-blue shadow-sm">
              {logo ? (
                <Image src={logo} alt="" fill sizes="72px" className="object-cover" />
              ) : (
                <Store className="size-7" aria-hidden />
              )}
            </span>
          </div>

          <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-laku-ink md:text-2xl">
                {displayName}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-laku-muted sm:text-sm">
                {rating > 0 ? (
                  <Link
                    href={`/distributor/${distributorId}/reviews`}
                    className="inline-flex items-center gap-1 font-semibold text-laku-ink transition-colors hover:text-laku-blue"
                    aria-label={t("distributor.viewRatingsA11y")}
                  >
                    <Star
                      className="size-3.5 fill-laku-rating-star text-laku-rating-star"
                      aria-hidden
                    />
                    {rating.toFixed(1)}
                    <span className="font-normal text-laku-muted">
                      ({formatNumber(reviewCount, t.locale)})
                    </span>
                  </Link>
                ) : null}
                {followers > 0 ? (
                  <span>
                    {t("distributor.followers", {
                      count: formatNumber(followers, t.locale),
                    })}
                  </span>
                ) : null}
              </div>
              {distributor.businessAddress ? (
                <p className="mt-1.5 flex items-start gap-1.5 text-sm text-laku-muted">
                  <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span className="min-w-0">{distributor.businessAddress}</span>
                </p>
              ) : null}
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <FollowDistributorButton
                distributorId={distributorId}
                initiallyFollowing={isFollowing}
                signedIn={Boolean(session)}
              />
              <Link
                href={`/seller/${distributorId}`}
                className="inline-flex items-center gap-1 rounded-lg border border-laku-line px-3.5 py-2 text-sm font-semibold text-laku-ink transition-colors hover:border-laku-blue/20 hover:bg-laku-blue/5"
              >
                {t("distributor.sellerInfo")}
                <ChevronRight className="size-4" aria-hidden />
              </Link>
              <Link
                href={`/distributor/${distributorId}/details`}
                className="inline-flex items-center gap-1 rounded-lg border border-laku-line px-3.5 py-2 text-sm font-semibold text-laku-ink transition-colors hover:border-laku-blue/20 hover:bg-laku-blue/5"
              >
                {t("distributor.viewDetails")}
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <DistributorProductShelf products={products} />
    </div>
  );
}
