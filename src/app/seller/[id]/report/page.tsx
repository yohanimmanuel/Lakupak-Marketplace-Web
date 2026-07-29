import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import ReportDistributorForm from "@/components/orders/ReportDistributorForm";
import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { getDistributor } from "@/lib/api/marketplace";
import { getSession } from "@/lib/auth/session";

type Params = Promise<{ id: string }>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("reportDistributor.metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function ReportDistributorPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const sellerId = Number.parseInt(id, 10);
  if (!Number.isFinite(sellerId) || sellerId < 1) notFound();

  const [session, t] = await Promise.all([getSession(), getTranslations()]);

  if (!session) {
    return (
      <SignedOutPrompt
        title={t("reportDistributor.signedOutTitle")}
        body={t("reportDistributor.signedOutBody")}
      />
    );
  }

  const distributor = await getDistributor(sellerId);
  const name =
    distributor?.companyName?.trim() ||
    distributor?.name?.trim() ||
    t("product.distributorFallback");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <Link
        href={`/seller/${sellerId}`}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("reportDistributor.backToSeller")}
      </Link>

      <h1 className="text-2xl font-bold text-laku-ink">
        {t("reportDistributor.title")}
      </h1>

      <ReportDistributorForm distributorId={sellerId} distributorName={name} />
    </div>
  );
}
