import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import OrderInvoiceView from "@/components/orders/OrderInvoiceView";
import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { getOrderById } from "@/lib/api/orders";
import { getSession } from "@/lib/auth/session";
import {
  buildInvoiceSnapshot,
  getInvoiceLegalFooter,
} from "@/lib/orderInvoice";

type Params = Promise<{ orderId: string }>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("orderInvoice.metaTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function OrderInvoicePage({
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

  if (!order) notFound();

  const snapshot = buildInvoiceSnapshot(order, t.locale);
  const backHref = `/orders/${encodeURIComponent(order.orderId)}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6 print:px-0 print:py-0">
      <Link
        href={backHref}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark print:hidden"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("orderInvoice.backToOrder")}
      </Link>

      <h1 className="mb-5 text-2xl font-bold text-laku-ink print:hidden">
        {t("orderInvoice.title")}
      </h1>

      <OrderInvoiceView
        snapshot={snapshot}
        legalFooter={getInvoiceLegalFooter()}
      />
    </div>
  );
}
