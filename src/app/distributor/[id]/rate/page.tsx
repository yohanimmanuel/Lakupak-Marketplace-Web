import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import DistributorRatingForm from "@/components/distributor/DistributorRatingForm";
import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { getDistributor } from "@/lib/api/marketplace";
import { getSession } from "@/lib/auth/session";

type Params = Promise<{ id: string }>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("distributorRating.metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function RateDistributorPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const rawId = id.trim();
  if (!/^\d+$/.test(rawId)) notFound();
  const distributorId = Number(rawId);
  if (!Number.isSafeInteger(distributorId) || distributorId < 1) notFound();

  const [session, t, distributor] = await Promise.all([
    getSession(),
    getTranslations(),
    getDistributor(distributorId),
  ]);

  if (!distributor) notFound();

  if (!session) {
    return (
      <SignedOutPrompt
        title={t("distributorRating.signedOutTitle")}
        body={t("distributorRating.signedOutBody")}
      />
    );
  }

  const name =
    distributor.companyName?.trim() ||
    distributor.name?.trim() ||
    t("product.distributorFallback");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <Link
        href={`/distributor/${distributorId}`}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("distributorRating.back")}
      </Link>

      <h1 className="text-2xl font-bold text-laku-ink">
        {t("distributorRating.title")}
      </h1>
      <p className="mt-1 text-sm text-laku-muted">
        {t("distributorRating.subtitle")}
      </p>

      <DistributorRatingForm
        distributorId={distributorId}
        distributorName={name}
      />
    </div>
  );
}
