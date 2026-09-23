import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  Building2,
  Check,
  MapPin,
  Store,
  Truck,
} from "lucide-react";

import DistributorReviews from "@/components/distributor/DistributorReviews";
import { getTranslations } from "@/i18n/server";
import {
  getDistributor,
  getDistributorReviews,
} from "@/lib/api/marketplace";

type Params = Promise<{ id: string }>;

const SHIPPING_OPTION_KEYS = [
  { key: "Self Pickup", labelKey: "sellerInfo.shipping.selfPickup" },
  {
    key: "Seller/Distributor Delivery",
    labelKey: "sellerInfo.shipping.sellerDelivery",
  },
  {
    key: "Buyer-arranged Courier",
    labelKey: "sellerInfo.shipping.buyerCourier",
  },
] as const;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const sellerId = Number(id);
  const t = await getTranslations();
  if (!Number.isFinite(sellerId) || sellerId <= 0) {
    return { title: t("sellerInfo.metaTitle") };
  }

  const distributor = await getDistributor(sellerId);
  const name =
    distributor?.companyName?.trim() ||
    distributor?.name?.trim() ||
    t("product.distributorFallback");

  return {
    title: t("sellerInfo.metaTitleNamed", { name }),
  };
}

export default async function SellerInformationPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const sellerId = Number(id);
  const t = await getTranslations();

  if (!Number.isFinite(sellerId) || sellerId <= 0) notFound();

  const [profile, reviewsData] = await Promise.all([
    getDistributor(sellerId),
    getDistributorReviews(sellerId, { page: 1, limit: 10 }),
  ]);

  if (!profile) notFound();

  const displayName =
    profile.companyName?.trim() ||
    profile.name?.trim() ||
    t("product.distributorFallback");
  const logo = profile.logo?.trim() || null;
  const banner = profile.bannerImage?.trim() || null;
  const prefs = profile.shippingPreferences ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Link
        href={`/distributor/${sellerId}`}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("sellerInfo.backToShop")}
      </Link>

      <h1 className="text-2xl font-bold text-laku-ink">{t("sellerInfo.title")}</h1>

      <section className="mt-5 rounded-2xl bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Building2 className="size-5 text-laku-muted" aria-hidden />
          <h2 className="text-sm font-bold text-laku-ink">
            {t("sellerInfo.companyTitle")}
          </h2>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <span className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-laku-blue/10 text-laku-blue">
            {logo ? (
              <Image src={logo} alt="" fill sizes="56px" className="object-cover" />
            ) : (
              <span className="text-lg font-bold">{displayName.charAt(0).toUpperCase()}</span>
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-laku-ink">{displayName}</p>
            {profile.industryType ? (
              <p className="truncate text-xs text-laku-muted">{profile.industryType}</p>
            ) : null}
          </div>
        </div>

        <div className="relative mb-4 h-36 overflow-hidden rounded-xl bg-laku-chip">
          {banner ? (
            <Image
              src={banner}
              alt=""
              fill
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
            />
          ) : (
            <span className="flex h-full items-center justify-center text-laku-faint">
              <Store className="size-10" aria-hidden />
            </span>
          )}
        </div>

        <InfoField
          label={t("sellerInfo.companyName")}
          value={displayName}
        />
        <InfoField
          label={t("sellerInfo.registration")}
          value={profile.businessRegistrationNumber || "—"}
        />
        {profile.industryType ? (
          <InfoField label={t("sellerInfo.industry")} value={profile.industryType} />
        ) : null}
        {profile.yearsInOperation ? (
          <InfoField label={t("sellerInfo.years")} value={profile.yearsInOperation} />
        ) : null}
        {profile.deliveryCoverageArea ? (
          <InfoField
            label={t("sellerInfo.coverage")}
            value={profile.deliveryCoverageArea}
          />
        ) : null}
        {profile.fulfillmentNotes ? (
          <InfoField
            label={t("sellerInfo.fulfillment")}
            value={profile.fulfillmentNotes}
          />
        ) : null}
        {profile.businessDescription ? (
          <InfoField
            label={t("sellerInfo.description")}
            value={profile.businessDescription}
          />
        ) : null}
        {profile.businessAddress ? (
          <InfoField
            label={t("sellerInfo.address")}
            value={profile.businessAddress}
            icon={<MapPin className="size-3.5" aria-hidden />}
          />
        ) : null}
      </section>

      <section className="mt-4 rounded-2xl bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Truck className="size-5 text-laku-muted" aria-hidden />
          <h2 className="text-sm font-bold text-laku-ink">
            {t("sellerInfo.shippingTitle")}
          </h2>
        </div>

        <p className="mb-2 text-xs font-semibold text-laku-muted">
          {t("sellerInfo.shippingOptions")}
        </p>
        <ul className="space-y-2">
          {SHIPPING_OPTION_KEYS.map(({ key, labelKey }) => {
            const enabled = prefs.includes(key);
            return (
              <li key={key} className="flex items-center gap-2 text-sm">
                {enabled ? (
                  <Check className="size-4 text-laku-blue" strokeWidth={2.5} aria-hidden />
                ) : (
                  <span className="size-4 rounded border border-laku-line" aria-hidden />
                )}
                <span className={enabled ? "text-laku-ink" : "text-laku-faint"}>
                  {t(labelKey)}
                </span>
              </li>
            );
          })}
        </ul>

        {profile.deliveryTimeSlots && profile.deliveryTimeSlots.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-laku-muted">
              {t("sellerInfo.timeSlots")}
            </p>
            <p className="text-sm text-laku-ink">
              {profile.deliveryTimeSlots.join(", ")}
            </p>
          </div>
        ) : null}

        {profile.preferredDeliveryDays && profile.preferredDeliveryDays.length > 0 ? (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-laku-muted">
              {t("sellerInfo.deliveryDays")}
            </p>
            <p className="text-sm text-laku-ink">
              {profile.preferredDeliveryDays.join(", ")}
            </p>
          </div>
        ) : null}

        {profile.pickupAddress ? (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-laku-muted">
              {t("sellerInfo.pickupAddress")}
            </p>
            <p className="text-sm text-laku-ink">{profile.pickupAddress}</p>
          </div>
        ) : null}
      </section>

      <section className="mt-4">
        <DistributorReviews
          distributorId={sellerId}
          reviews={reviewsData}
          variant="panel"
        />
      </section>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={`/distributor/${sellerId}`}
          className="inline-flex rounded-lg bg-laku-blue px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
        >
          {t("sellerInfo.browseShop")}
        </Link>
        <Link
          href={`/seller/${sellerId}/report`}
          className="inline-flex rounded-lg border border-laku-line px-5 py-3 text-sm font-semibold text-laku-alert transition-colors hover:bg-laku-alert/5"
        >
          {t("sellerInfo.reportDistributor")}
        </Link>
      </div>
    </div>
  );
}

function InfoField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-xs font-semibold text-laku-muted">{label}</p>
      <p className="mt-0.5 flex items-start gap-1.5 text-sm font-medium text-laku-ink">
        {icon}
        <span className="whitespace-pre-line">{value}</span>
      </p>
    </div>
  );
}
