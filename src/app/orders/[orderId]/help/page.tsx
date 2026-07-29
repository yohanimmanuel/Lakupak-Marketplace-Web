import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  HelpCircle,
  MessageCircle,
  Truck,
} from "lucide-react";

import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { getOrderById } from "@/lib/api/orders";
import { getSession } from "@/lib/auth/session";

type Params = Promise<{ orderId: string }>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("orderHelpCenter.metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function OrderHelpCenterPage({
  params,
}: {
  params: Params;
}) {
  const { orderId: rawId } = await params;
  const orderId = decodeURIComponent(rawId);
  const [session, t] = await Promise.all([getSession(), getTranslations()]);

  if (!session) {
    return (
      <SignedOutPrompt
        title={t("orderDetails.signedOutTitle")}
        body={t("orderDetails.signedOutBody")}
      />
    );
  }

  const order = await getOrderById({
    orderId,
    userId: session.user.id,
    token: session.token,
  });

  const backHref = `/orders/${encodeURIComponent(orderId)}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <Link
        href={backHref}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("orderHelpCenter.backToOrder")}
      </Link>

      <h1 className="text-2xl font-bold text-laku-ink">{t("orderHelpCenter.title")}</h1>

      <section className="mt-6 rounded-2xl bg-white p-5">
        <div className="mb-3 flex items-center gap-2">
          <HelpCircle className="size-5 text-laku-blue" aria-hidden />
          <h2 className="text-sm font-bold text-laku-ink">
            {t("orderHelpCenter.overviewTitle")}
          </h2>
        </div>
        <p className="text-sm/6 text-laku-muted">{t("orderHelpCenter.overviewBody")}</p>
        {order ? (
          <div className="mt-4 rounded-lg bg-laku-blue/5 px-3 py-2">
            <p className="text-xs text-laku-muted">{t("orderHelpCenter.orderId")}</p>
            <p className="font-mono text-sm font-semibold text-laku-ink">
              {order.orderId}
            </p>
          </div>
        ) : null}
      </section>

      <section className="mt-3 rounded-2xl bg-white p-5">
        <div className="mb-2 flex items-center gap-2">
          <Truck className="size-4 text-laku-blue" aria-hidden />
          <h2 className="text-sm font-bold text-laku-ink">
            {t("orderHelpCenter.sections.deliveryStatusTitle")}
          </h2>
        </div>
        <p className="text-sm/6 text-laku-muted">
          {t("orderHelpCenter.sections.deliveryStatusBody")}
        </p>
      </section>

      <section className="mt-3 rounded-2xl bg-white p-5">
        <div className="mb-2 flex items-center gap-2">
          <FileText className="size-4 text-laku-blue" aria-hidden />
          <h2 className="text-sm font-bold text-laku-ink">
            {t("orderHelpCenter.sections.statusBasicsTitle")}
          </h2>
        </div>
        <ul className="mt-2 space-y-2 text-sm text-laku-muted">
          {(
            [
              "pendingConfirmed",
              "packedShipped",
              "delivered",
              "received",
            ] as const
          ).map((key) => (
            <li key={key}>
              <span className="font-semibold text-laku-ink">
                {t(`orderHelpCenter.statusBullets.${key}Title`)}
              </span>
              {" – "}
              {t(`orderHelpCenter.statusBullets.${key}Desc`)}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm/6 text-laku-muted">
          {t("orderHelpCenter.sections.statusBasicsNote")}
        </p>
      </section>

      <section className="mt-3 rounded-2xl bg-white p-5">
        <div className="mb-2 flex items-center gap-2">
          <MessageCircle className="size-4 text-laku-blue" aria-hidden />
          <h2 className="text-sm font-bold text-laku-ink">
            {t("orderHelpCenter.sections.contactSellerTitle")}
          </h2>
        </div>
        <p className="text-sm/6 text-laku-muted">
          {t("orderHelpCenter.sections.contactSellerBody")}
        </p>
      </section>

      <section className="mt-3 rounded-2xl bg-white p-5">
        <div className="mb-2 flex items-center gap-2">
          <HelpCircle className="size-4 text-laku-blue" aria-hidden />
          <h2 className="text-sm font-bold text-laku-ink">
            {t("orderHelpCenter.sections.contactSupportTitle")}
          </h2>
        </div>
        <p className="text-sm/6 text-laku-muted">
          {t("orderHelpCenter.sections.contactSupportBody")}
        </p>
        <Link
          href="/help"
          className="mt-3 inline-flex text-sm font-semibold text-laku-blue hover:underline"
        >
          {t("orderHelpCenter.openHelpCenter")}
        </Link>
      </section>
    </div>
  );
}
