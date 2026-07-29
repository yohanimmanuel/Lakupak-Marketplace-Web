"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import { submitDistributorReportAction } from "@/app/actions/reports";
import PhotoUploadGrid from "@/components/orders/PhotoUploadGrid";
import { useTranslations } from "@/i18n/client";

const REASON_IDS = ["fraud", "poor_service", "quality", "policy", "other"] as const;
const INITIAL = { ok: false } as const;

export default function ReportDistributorForm({
  distributorId,
  distributorName,
}: {
  distributorId: number;
  distributorName: string;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    submitDistributorReportAction,
    INITIAL,
  );
  const [reasonCode, setReasonCode] = useState("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (state.ok) {
      const timer = window.setTimeout(() => {
        router.push(`/seller/${distributorId}`);
        router.refresh();
      }, 1200);
      return () => window.clearTimeout(timer);
    }
  }, [state.ok, distributorId, router]);

  const canSubmit =
    Boolean(reasonCode) &&
    (reasonCode !== "other" || reasonDetail.trim()) &&
    imageUrls.length > 0 &&
    !pending &&
    !uploading;

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <input type="hidden" name="distributorId" value={distributorId} />
      <input type="hidden" name="reasonCode" value={reasonCode} />
      <input type="hidden" name="reasonDetail" value={reasonDetail} />
      {imageUrls.map((url) => (
        <input key={url} type="hidden" name="imageUrls" value={url} />
      ))}

      <div className="rounded-2xl bg-white p-5">
        <p className="text-xs font-semibold text-laku-muted">
          {t("reportDistributor.distributorLabel")}
        </p>
        <p className="mt-1 text-sm font-semibold text-laku-ink">{distributorName}</p>
        <p className="mt-3 text-sm text-laku-muted">{t("reportDistributor.warning")}</p>
      </div>

      <div className="rounded-2xl bg-white p-5">
        <h2 className="text-sm font-bold text-laku-ink">
          {t("reportDistributor.whyTitle")}
        </h2>
        <div className="mt-3 space-y-2">
          {REASON_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setReasonCode(id)}
              className={`block w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                reasonCode === id
                  ? "border-laku-blue bg-laku-blue/5"
                  : "border-laku-line hover:bg-laku-surface"
              }`}
            >
              <p className="text-sm font-semibold text-laku-ink">
                {t(`reportDistributor.reasons.${id}.label`)}
              </p>
              <p className="mt-0.5 text-xs text-laku-muted">
                {t(`reportDistributor.reasons.${id}.description`)}
              </p>
            </button>
          ))}
        </div>

        {reasonCode === "other" ? (
          <label className="mt-4 block text-xs font-semibold text-laku-muted">
            {t("reportDistributor.customReasonLabel")}
            <textarea
              value={reasonDetail}
              onChange={(event) => setReasonDetail(event.target.value)}
              rows={3}
              placeholder={t("reportDistributor.customReasonPlaceholder")}
              className="mt-1.5 w-full rounded-lg border border-laku-line px-3.5 py-2.5 text-sm text-laku-ink outline-none focus:border-laku-blue"
            />
          </label>
        ) : null}
      </div>

      <div className="rounded-2xl bg-white p-5">
        <PhotoUploadGrid
          folder="distributor_reports"
          urls={imageUrls}
          onUrlsChange={setImageUrls}
          onBusyChange={setUploading}
          label={t("reportDistributor.photosLabel", { max: 5 })}
          hint={t("reportDistributor.photosHint")}
          addLabel={t("reportDistributor.addPhotos")}
          uploadingLabel={t("photoUpload.uploading")}
          removeLabel={t("photoUpload.remove")}
          uploadErrorLabel={t("photoUpload.errors.upload")}
          disabled={pending}
        />
      </div>

      {state.error ? (
        <p className="rounded-lg bg-laku-discount-bg px-4 py-3 text-sm font-medium text-laku-discount-ink">
          {state.error}
        </p>
      ) : null}
      {state.ok && state.message ? (
        <p className="flex items-center gap-2 rounded-lg bg-laku-ship/10 px-4 py-3 text-sm font-medium text-laku-buy">
          <CheckCircle2 className="size-4" aria-hidden />
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-lg bg-laku-blue px-5 py-3.5 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? t("reportDistributor.submitting") : t("reportDistributor.submit")}
      </button>
    </form>
  );
}
