import { BadgeCheck, Lock, ShieldCheck } from "lucide-react";

import { getTranslations } from "@/i18n/server";
import type { Assurance } from "@/lib/api/types";

/** Same Halal / BPOM / return-days chips the mobile product page shows. */
export default async function ProductAssuranceBadges({
  assurance,
}: {
  assurance?: Assurance | null;
}) {
  const t = await getTranslations();
  const returnDays = Number(assurance?.returnPolicyDays);
  const days = Number.isFinite(returnDays) && returnDays > 0 ? returnDays : 7;

  return (
    <div className="mt-6">
      <h2 className="mb-3 text-sm font-bold text-laku-ink">
        {t("product.assuranceTitle")}
      </h2>
      <div className="flex flex-wrap gap-2">
        {assurance?.halalCertified ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#ecfdf5] px-3 py-1.5 text-xs font-semibold text-[#059669]">
            <BadgeCheck className="size-3.5" aria-hidden />
            {t("product.assurance.halalCertified")}
          </span>
        ) : null}

        {assurance?.bpomApproved ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#eff6ff] px-3 py-1.5 text-xs font-semibold text-[#2563eb]">
            <ShieldCheck className="size-3.5" aria-hidden />
            {t("product.assurance.bpomApproved")}
          </span>
        ) : null}

        <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f5f3ff] px-3 py-1.5 text-xs font-semibold text-[#7c3aed]">
          <Lock className="size-3.5" aria-hidden />
          {t("product.assurance.returnDays", { count: days })}
        </span>

        {assurance?.originalProduct ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#fffbeb] px-3 py-1.5 text-xs font-semibold text-[#d97706]">
            <ShieldCheck className="size-3.5" aria-hidden />
            {t("product.assurance.originalProduct")}
          </span>
        ) : null}
      </div>
    </div>
  );
}
