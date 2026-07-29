"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  Banknote,
  Check,
  CheckCircle2,
  Copy,
  FileCheck2,
  Landmark,
  Upload,
  Wallet,
} from "lucide-react";

import { submitPaymentAction } from "@/app/actions/orders";
import { useTranslations } from "@/i18n/client";
import type { SellerBank } from "@/lib/api/types";

type Props = {
  orderDbId: number;
  orderId: string;
  isCod: boolean;
  bank: SellerBank | null;
  alreadySubmitted: boolean;
  existingProofUrl: string | null;
};

export default function PayOrderForm({
  orderDbId,
  orderId,
  isCod,
  bank,
  alreadySubmitted,
  existingProofUrl,
}: Props) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(!alreadySubmitted);
  const [proofUrl, setProofUrl] = useState<string | null>(existingProofUrl);
  const [proofName, setProofName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const orderHref = `/orders/${encodeURIComponent(orderId)}`;

  function submitProof(formData: FormData) {
    setSubmitError(null);
    startTransition(async () => {
      const result = await submitPaymentAction({ ok: false }, formData);
      if (result.ok) {
        setEditing(false);
        setConfirmation(result.message ?? t("payOrder.successMessage"));
        router.refresh();
      } else {
        setSubmitError(result.error ?? t("payOrder.errors.submit"));
      }
    });
  }

  if (isCod) {
    return (
      <section className="mt-4 rounded-2xl bg-white p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold text-laku-ink">
          <Wallet className="size-4 text-laku-blue" aria-hidden />
          {t("payOrder.codTitle")}
        </h2>
        <p className="mt-2 text-sm/6 text-laku-muted">{t("payOrder.codBody")}</p>
        <Link
          href={orderHref}
          className="mt-4 inline-flex rounded-lg bg-laku-blue px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
        >
          {t("payOrder.backToOrder")}
        </Link>
      </section>
    );
  }

  async function uploadProof(file: File) {
    setUploading(true);
    setUploadError(null);

    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload/payment-proof", {
        method: "POST",
        body,
      });
      const payload = (await response.json()) as {
        url?: string;
        fileName?: string;
        error?: string;
      };

      if (!response.ok || !payload.url) {
        setUploadError(payload.error ?? t("payOrder.errors.upload"));
        return;
      }

      setProofUrl(payload.url);
      setProofName(payload.fileName ?? file.name);
    } catch {
      setUploadError(t("payOrder.errors.upload"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="mt-4 rounded-2xl bg-white p-5">
      <h2 className="flex items-center gap-2 text-sm font-bold text-laku-ink">
        <Landmark className="size-4 text-laku-blue" aria-hidden />
        {t("payOrder.bankTitle")}
      </h2>

      {bank ? (
        <dl className="mt-3 divide-y divide-laku-line rounded-xl border border-laku-line">
          <BankRow label={t("payOrder.bank")} value={bank.billingBankName} />
          <BankRow
            label={t("payOrder.accountName")}
            value={bank.billingBankAccountName}
          />
          <BankRow
            label={t("payOrder.accountNumber")}
            value={bank.billingBankAccountNumber}
            copyable
          />
          {bank.buyerPaymentTermDays ? (
            <BankRow
              label={t("payOrder.paymentTerm")}
              value={t("payOrder.days", { count: bank.buyerPaymentTermDays })}
            />
          ) : null}
        </dl>
      ) : (
        <p className="mt-3 rounded-xl bg-laku-surface px-4 py-3 text-sm text-laku-muted">
          {t("payOrder.bankMissing")}
        </p>
      )}

      <h3 className="mt-6 flex items-center gap-2 text-sm font-bold text-laku-ink">
        <Banknote className="size-4 text-laku-blue" aria-hidden />
        {t("payOrder.proofTitle")}
      </h3>

      {!editing ? (
        <div className="mt-3 rounded-xl border border-laku-ship/30 bg-laku-ship/5 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-laku-buy">
            <CheckCircle2 className="size-4" aria-hidden />
            {t("payOrder.submittedTitle")}
          </p>
          <p className="mt-1 text-sm text-laku-muted">{t("payOrder.submittedBody")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {proofUrl ? (
              <a
                href={proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-laku-line bg-white px-4 py-2 text-sm font-semibold text-laku-ink transition-colors hover:bg-laku-surface"
              >
                {t("payOrder.viewProof")}
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg border border-laku-line bg-white px-4 py-2 text-sm font-semibold text-laku-blue transition-colors hover:bg-laku-blue/5"
            >
              {t("payOrder.editProof")}
            </button>
            <Link
              href={orderHref}
              className="rounded-lg bg-laku-blue px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
            >
              {t("payOrder.viewOrder")}
            </Link>
          </div>
        </div>
      ) : (
        <form action={submitProof} className="mt-3">
          <input type="hidden" name="orderDbId" value={orderDbId} />
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="requiresProof" value="1" />
          <input type="hidden" name="update" value={alreadySubmitted ? "1" : "0"} />
          <input type="hidden" name="proofUrl" value={proofUrl ?? ""} />
          <input type="hidden" name="proofFileName" value={proofName ?? ""} />

          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadProof(file);
              // Allow selecting the same file again after cancel/change.
              event.target.value = "";
            }}
          />

          {proofUrl ? (
            <div className="flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-xl border-2 border-dashed border-laku-line px-4 py-6">
              <span className="inline-flex max-w-full items-center gap-2 text-sm font-semibold text-laku-ink">
                <FileCheck2 className="size-4 shrink-0 text-laku-buy" aria-hidden />
                <span className="truncate">
                  {proofName ?? t("payOrder.selectedFile")}
                </span>
              </span>
              <span className="text-laku-faint" aria-hidden>
                ·
              </span>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="text-sm font-semibold text-laku-muted transition-colors hover:text-laku-blue disabled:opacity-60"
              >
                {t("payOrder.changeFile")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadError(null);
                  setSubmitError(null);
                  if (fileInput.current) fileInput.current.value = "";

                  if (alreadySubmitted) {
                    setProofUrl(existingProofUrl);
                    setProofName(null);
                    setEditing(false);
                    return;
                  }

                  setProofUrl(null);
                  setProofName(null);
                }}
                disabled={uploading}
                className="text-sm font-semibold text-laku-alert transition-colors hover:brightness-95 disabled:opacity-60"
              >
                {t("common.cancel")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-laku-line px-4 py-6 text-sm font-semibold text-laku-muted transition-colors hover:border-laku-blue hover:text-laku-blue disabled:opacity-60"
            >
              {uploading ? (
                t("payOrder.uploading")
              ) : (
                <>
                  <Upload className="size-4" aria-hidden />
                  {t("payOrder.uploadCta")}
                </>
              )}
            </button>
          )}

          {uploadError ? (
            <p className="mt-2 text-sm font-medium text-laku-alert">{uploadError}</p>
          ) : null}
          {submitError ? (
            <p className="mt-2 text-sm font-medium text-laku-alert">{submitError}</p>
          ) : null}

          <button
            type="submit"
            disabled={pending || uploading || !proofUrl}
            className="mt-4 w-full rounded-lg bg-laku-blue px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending
              ? t("payOrder.sending")
              : alreadySubmitted
                ? t("payOrder.updatePayment")
                : t("payOrder.pay")}
          </button>
        </form>
      )}

      {confirmation ? (
        <p className="mt-3 text-sm font-medium text-laku-buy">{confirmation}</p>
      ) : null}
    </section>
  );
}

function BankRow({
  label,
  value,
  copyable,
}: {
  label: string;
  value?: string | null;
  copyable?: boolean;
}) {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);

  if (!value) return null;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <dt className="text-sm text-laku-muted">{label}</dt>
      <dd className="flex items-center gap-2 text-sm font-semibold text-laku-ink">
        {value}
        {copyable ? (
          <button
            type="button"
            aria-label={t("payOrder.copyAccount")}
            onClick={async () => {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            className="text-laku-blue transition-colors hover:text-laku-blue-dark"
          >
            {copied ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )}
          </button>
        ) : null}
      </dd>
    </div>
  );
}
