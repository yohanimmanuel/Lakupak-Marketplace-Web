"use client";

import { Printer } from "lucide-react";

import { useTranslations } from "@/i18n/client";
import type { OrderInvoiceSnapshot } from "@/lib/orderInvoice";

export default function OrderInvoiceView({
  snapshot,
  legalFooter,
}: {
  snapshot: OrderInvoiceSnapshot;
  legalFooter: string;
}) {
  const t = useTranslations();

  return (
    <div>
      <div className="mb-4 flex justify-end print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-lg bg-laku-blue px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
        >
          <Printer className="size-4" aria-hidden />
          {t("orderInvoice.print")}
        </button>
      </div>

      <article className="rounded-2xl bg-white p-6 shadow-sm md:p-8 print:shadow-none">
        <p className="text-xl font-extrabold text-laku-blue">{snapshot.storeName}</p>
        <p className="mt-1 text-sm text-laku-muted">{t("orderInvoice.subtitle")}</p>

        <dl className="mt-5 space-y-1.5 text-sm text-laku-ink">
          <div>
            <dt className="inline font-semibold">{t("orderInvoice.orderId")}</dt>
            <dd className="inline"> · {snapshot.orderId}</dd>
          </div>
          <div>
            <dt className="inline font-semibold">{t("orderInvoice.date")}</dt>
            <dd className="inline"> · {snapshot.issuedAt}</dd>
          </div>
          <div>
            <dt className="inline font-semibold">{t("orderInvoice.status")}</dt>
            <dd className="inline"> · {snapshot.orderStatus}</dd>
          </div>
          <div>
            <dt className="inline font-semibold">{t("orderInvoice.payment")}</dt>
            <dd className="inline"> · {snapshot.paymentStatus}</dd>
          </div>
          <div>
            <dt className="inline font-semibold">{t("orderInvoice.terms")}</dt>
            <dd className="inline"> · {snapshot.paymentTerms}</dd>
          </div>
        </dl>

        <div className="mt-5 rounded-xl bg-laku-surface p-4 text-sm">
          <p>
            <span className="font-semibold">{t("orderInvoice.billTo")}</span>
            {" · "}
            {snapshot.billToName} · {snapshot.billToPhone}
          </p>
          <p className="mt-2 font-semibold">{t("orderInvoice.shipTo")}</p>
          <p className="mt-1 text-laku-muted">{snapshot.shipTo}</p>
        </div>

        <table className="mt-5 w-full text-sm">
          <thead>
            <tr className="border-b border-laku-line text-left text-xs text-laku-muted">
              <th className="py-2 pr-3 font-semibold">{t("orderInvoice.item")}</th>
              <th className="py-2 text-right font-semibold">
                {t("orderInvoice.amount")}
              </th>
            </tr>
          </thead>
          <tbody>
            {snapshot.lines.length > 0 ? (
              snapshot.lines.map((line, index) => (
                <tr key={`${line.title}-${index}`} className="border-b border-laku-line/70">
                  <td className="py-3 pr-3 align-top">
                    <p className="font-semibold text-laku-ink">{line.title}</p>
                    {line.subtitle ? (
                      <p className="mt-1 text-xs text-laku-muted">{line.subtitle}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-laku-muted">{line.qtyLine}</p>
                  </td>
                  <td className="py-3 text-right align-top font-semibold text-laku-ink">
                    {line.amount}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="py-4 text-laku-muted">
                  {t("orderInvoice.noItems")}
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span>{t("orderInvoice.subtotal")}</span>
            <span>{snapshot.subtotal}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>{t("orderInvoice.discounts")}</span>
            <span>− {snapshot.discounts}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>{t("orderInvoice.shipping")}</span>
            <span>{snapshot.shipping}</span>
          </div>
          <div className="flex justify-between gap-4 border-t-2 border-laku-line pt-3 text-lg font-extrabold text-laku-blue">
            <span>{t("orderInvoice.total")}</span>
            <span>{snapshot.total}</span>
          </div>
        </div>

        <p className="mt-5 text-xs text-laku-muted">{t("orderInvoice.supportNote")}</p>
        <p className="mt-4 border-t border-laku-line pt-4 text-[10px]/1.5 text-laku-muted">
          {legalFooter}
        </p>
      </article>
    </div>
  );
}
