"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft } from "lucide-react";

import {
  cancelOrderAction,
  requestReturnAction,
} from "@/app/actions/orders";
import PhotoUploadGrid from "@/components/orders/PhotoUploadGrid";
import { useTranslations } from "@/i18n/client";
import {
  CANCEL_REASON_CODES,
  RETURN_REASON_CODES,
  type CancelReasonCode,
  type ReturnReasonCode,
} from "@/lib/orders";

type Mode = "cancel" | "return";

export default function OrderReasonForm({
  mode,
  orderId,
}: {
  mode: Mode;
  orderId: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const codes = mode === "cancel" ? CANCEL_REASON_CODES : RETURN_REASON_CODES;
  const [reason, setReason] = useState<string>(codes[0]);
  const [detail, setDetail] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [photosBusy, setPhotosBusy] = useState(false);

  const namespace = mode === "cancel" ? "cancelReasons" : "returnReasons";
  const backHref = `/orders/${encodeURIComponent(orderId)}`;
  const actionsDisabled = pending || photosBusy;

  const submit = () => {
    if (actionsDisabled) return;
    if (reason === "other" && !detail.trim()) {
      setError(t("orderReason.errors.detailRequired"));
      return;
    }

    setError(null);
    startTransition(async () => {
      const result =
        mode === "cancel"
          ? await cancelOrderAction({
              orderId,
              reasonCode: reason as CancelReasonCode,
              reasonDetail: detail,
            })
          : await requestReturnAction({
              orderId,
              reason: reason as ReturnReasonCode,
              reasonDetail: detail,
              imageUrls,
            });

      if (!result.ok) {
        setError(result.error ?? t("orderDetails.actionError"));
        return;
      }

      router.push(backHref);
      router.refresh();
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6">
      <Link
        href={backHref}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("orderReason.backToOrder")}
      </Link>

      <h1 className="text-2xl font-bold text-laku-ink">
        {mode === "cancel" ? t("orderReason.cancelTitle") : t("orderReason.returnTitle")}
      </h1>
      <p className="mt-1 text-sm text-laku-muted">
        {mode === "cancel" ? t("orderReason.cancelBody") : t("orderReason.returnBody")}
      </p>
      <p className="mt-1 font-mono text-sm text-laku-muted">#{orderId}</p>

      <section className="mt-6 rounded-2xl bg-white p-5">
        <h2 className="text-sm font-bold text-laku-ink">{t("orderReason.selectReason")}</h2>
        <div className="mt-3 space-y-2">
          {codes.map((code) => (
            <label
              key={code}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 text-sm transition-colors ${
                reason === code
                  ? "border-laku-blue bg-laku-blue/5 text-laku-ink"
                  : "border-laku-line bg-white text-laku-ink hover:border-laku-blue/40"
              }`}
            >
              <input
                type="radio"
                name="reason"
                value={code}
                checked={reason === code}
                onChange={() => setReason(code)}
                className="mt-0.5 size-4 accent-laku-blue"
              />
              <span className="font-medium">{t(`${namespace}.${code}`)}</span>
            </label>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-semibold text-laku-muted">
            {t("orderReason.detailLabel")}
          </span>
          <textarea
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            rows={4}
            maxLength={1000}
            placeholder={t("orderDetails.detailPlaceholder")}
            className="mt-1.5 w-full rounded-lg border border-laku-line bg-white px-3 py-2.5 text-sm text-laku-ink outline-none focus:border-laku-blue"
          />
        </label>

        {mode === "return" ? (
          <PhotoUploadGrid
            folder="returns"
            urls={imageUrls}
            onUrlsChange={setImageUrls}
            onBusyChange={setPhotosBusy}
            disabled={pending}
            label={t("orderReason.photosLabel", { max: 5 })}
            hint={t("orderReason.photosHint")}
            addLabel={t("photoUpload.add")}
            uploadingLabel={t("photoUpload.uploading")}
            removeLabel={t("photoUpload.remove")}
            uploadErrorLabel={t("photoUpload.errors.upload")}
          />
        ) : null}

        {error ? (
          <p className="mt-3 text-sm font-medium text-laku-alert">{error}</p>
        ) : null}

        {photosBusy ? (
          <p className="mt-3 text-sm text-laku-muted">{t("photoUpload.waitToSubmit")}</p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={actionsDisabled}
            onClick={submit}
            className={`rounded-lg px-5 py-3 text-sm font-bold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              mode === "cancel"
                ? "bg-laku-alert hover:brightness-95"
                : "bg-laku-blue hover:bg-laku-blue-dark"
            }`}
          >
            {pending
              ? t("common.processing")
              : photosBusy
                ? t("photoUpload.uploading")
                : mode === "cancel"
                  ? t("orderReason.submitCancel")
                  : t("orderReason.submitReturn")}
          </button>
          {actionsDisabled ? (
            <span
              aria-disabled="true"
              className="rounded-lg border border-laku-line bg-white px-5 py-3 text-sm font-semibold text-laku-ink opacity-60"
            >
              {t("common.cancel")}
            </span>
          ) : (
            <Link
              href={backHref}
              className="rounded-lg border border-laku-line bg-white px-5 py-3 text-sm font-semibold text-laku-ink transition-colors hover:bg-laku-surface"
            >
              {t("common.cancel")}
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
