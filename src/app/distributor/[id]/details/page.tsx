import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Mail,
  MapPin,
  Phone,
  Store,
  Truck,
} from "lucide-react";

import { getTranslations } from "@/i18n/server";
import { getDistributor } from "@/lib/api/marketplace";

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
    return { title: t("distributorDetails.metaTitle") };
  }

  const distributor = await getDistributor(distributorId);
  const name =
    distributor?.companyName?.trim() ||
    distributor?.name?.trim() ||
    t("product.distributorFallback");

  return {
    title: t("distributorDetails.metaTitleNamed", { name }),
  };
}

export default async function DistributorDetailsPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const distributorId = Number(id);
  const t = await getTranslations();

  if (!Number.isFinite(distributorId) || distributorId <= 0) notFound();

  const distributor = await getDistributor(distributorId);

  if (!distributor) notFound();

  const displayName =
    distributor.companyName?.trim() ||
    distributor.name?.trim() ||
    t("product.distributorFallback");
  const logo = distributor.logo?.trim() || null;
  const banner = distributor.bannerImage?.trim() || null;

  const facts = [
    distributor.industryType
      ? { icon: Building2, label: t("distributorDetails.industry"), value: distributor.industryType }
      : null,
    distributor.yearsInOperation
      ? {
          icon: Calendar,
          label: t("distributorDetails.years"),
          value: distributor.yearsInOperation,
        }
      : null,
    distributor.deliveryCoverageArea
      ? {
          icon: MapPin,
          label: t("distributorDetails.coverage"),
          value: distributor.deliveryCoverageArea,
        }
      : null,
    distributor.fulfillmentNotes
      ? {
          icon: Truck,
          label: t("distributorDetails.fulfillment"),
          value: distributor.fulfillmentNotes,
        }
      : null,
    distributor.businessAddress
      ? {
          icon: MapPin,
          label: t("distributorDetails.address"),
          value: distributor.businessAddress,
        }
      : null,
    distributor.businessPhone
      ? {
          icon: Phone,
          label: t("distributorDetails.phone"),
          value: distributor.businessPhone,
        }
      : null,
    distributor.businessEmail
      ? {
          icon: Mail,
          label: t("distributorDetails.email"),
          value: distributor.businessEmail,
        }
      : null,
  ].filter(Boolean) as Array<{
    icon: typeof Building2;
    label: string;
    value: string;
  }>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:px-6">
      <Link
        href={`/seller/${distributorId}`}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("distributor.sellerInfo")}
      </Link>

      <div className="overflow-hidden rounded-2xl bg-white">
        <div className="relative h-32 bg-laku-blue/10">
          {banner ? (
            <Image
              src={banner}
              alt=""
              fill
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="relative -mt-8 px-5 pb-5">
          <span className="relative mb-3 flex size-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-laku-blue/10 text-laku-blue shadow-sm">
            {logo ? (
              <Image src={logo} alt="" fill sizes="64px" className="object-cover" />
            ) : (
              <Store className="size-7" aria-hidden />
            )}
          </span>
          <h1 className="text-2xl font-bold text-laku-ink">{displayName}</h1>
        </div>
      </div>

      {distributor.businessDescription ? (
        <section className="mt-4 rounded-2xl bg-white p-5">
          <h2 className="text-sm font-bold text-laku-ink">
            {t("distributorDetails.about")}
          </h2>
          <p className="mt-2 whitespace-pre-line text-sm/6 text-laku-muted">
            {distributor.businessDescription}
          </p>
        </section>
      ) : null}

      <section className="mt-4 rounded-2xl bg-white p-5">
        <h2 className="mb-4 text-sm font-bold text-laku-ink">
          {t("distributorDetails.infoTitle")}
        </h2>
        {facts.length > 0 ? (
          <ul className="space-y-4">
            {facts.map((fact) => (
              <li key={fact.label} className="flex gap-3">
                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-laku-blue/10 text-laku-blue">
                  <fact.icon className="size-4" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-laku-muted">{fact.label}</p>
                  <p className="mt-0.5 text-sm font-medium text-laku-ink">{fact.value}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-laku-muted">{t("distributorDetails.noInfo")}</p>
        )}
      </section>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href={`/seller/${distributorId}`}
          className="rounded-lg border border-laku-line bg-white px-4 py-2.5 text-sm font-semibold text-laku-ink transition-colors hover:bg-laku-surface"
        >
          {t("distributor.sellerInfo")}
        </Link>
      </div>
    </div>
  );
}
