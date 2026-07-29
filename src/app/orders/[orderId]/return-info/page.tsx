import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowLeft, HelpCircle, RotateCcw } from "lucide-react";

import { getTranslations } from "@/i18n/server";

type Params = Promise<{ orderId: string }>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("returnRefundInfo.metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function ReturnRefundInfoPage({
  params,
}: {
  params: Params;
}) {
  const { orderId: rawId } = await params;
  const orderId = decodeURIComponent(rawId);
  const t = await getTranslations();
  const backHref = `/orders/${encodeURIComponent(orderId)}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <Link
        href={backHref}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("returnRefundInfo.backToOrder")}
      </Link>

      <h1 className="text-2xl font-bold text-laku-ink">
        {t("returnRefundInfo.title")}
      </h1>

      <section className="mt-6 rounded-2xl bg-white p-5">
        <div className="mb-2 flex items-center gap-2">
          <RotateCcw className="size-4 text-laku-blue" aria-hidden />
          <h2 className="text-sm font-bold text-laku-ink">
            {t("returnRefundInfo.cards.basicsTitle")}
          </h2>
        </div>
        <p className="text-sm/6 text-laku-muted">
          {t("returnRefundInfo.cards.basicsBody")}
        </p>
      </section>

      <section className="mt-3 rounded-2xl bg-white p-5">
        <div className="mb-2 flex items-center gap-2">
          <AlertCircle className="size-4 text-amber-500" aria-hidden />
          <h2 className="text-sm font-bold text-laku-ink">
            {t("returnRefundInfo.cards.policyTitle")}
          </h2>
        </div>
        <p className="text-sm/6 text-laku-muted">
          {t("returnRefundInfo.cards.policyBody1")}
        </p>
        <p className="mt-2 text-sm/6 text-laku-muted">
          {t("returnRefundInfo.cards.policyBody2")}
        </p>
        <p className="mt-3 text-sm font-semibold text-laku-ink">
          {t("returnRefundInfo.cards.policyStrong")}
        </p>
      </section>

      <section className="mt-3 rounded-2xl bg-white p-5">
        <div className="mb-2 flex items-center gap-2">
          <HelpCircle className="size-4 text-laku-blue" aria-hidden />
          <h2 className="text-sm font-bold text-laku-ink">
            {t("returnRefundInfo.cards.quickFlowTitle")}
          </h2>
        </div>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm/6 text-laku-muted">
          <li>{t("returnRefundInfo.cards.steps.1")}</li>
          <li>{t("returnRefundInfo.cards.steps.2")}</li>
          <li>{t("returnRefundInfo.cards.steps.3")}</li>
          <li>{t("returnRefundInfo.cards.steps.4")}</li>
          <li>{t("returnRefundInfo.cards.steps.5")}</li>
        </ol>
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={`${backHref}/return`}
          className="inline-flex rounded-lg bg-laku-blue px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
        >
          {t("returnRefundInfo.requestReturn")}
        </Link>
        <Link
          href={backHref}
          className="inline-flex rounded-lg border border-laku-line px-5 py-3 text-sm font-semibold text-laku-ink transition-colors hover:bg-laku-surface"
        >
          {t("returnRefundInfo.backToOrder")}
        </Link>
      </div>
    </div>
  );
}
