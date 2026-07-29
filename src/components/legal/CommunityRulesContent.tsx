"use client";

import Link from "next/link";

import LegalTabs, { LegalBody, LegalSection } from "@/components/legal/LegalTabs";
import { useTranslations } from "@/i18n/client";

export default function CommunityRulesContent() {
  const t = useTranslations();

  const tabs = [
    { id: "overview", label: t("communityRules.tabs.overview") },
    { id: "dos", label: t("communityRules.tabs.dos") },
    { id: "donts", label: t("communityRules.tabs.donts") },
    { id: "summary", label: t("communityRules.tabs.summary") },
  ];

  const dosKeys = ["respect", "accurate", "quality", "report"] as const;
  const dontsKeys = ["prohibited", "misleading", "privacy", "abuse"] as const;

  return (
    <div className="rounded-2xl bg-white p-5 md:p-6">
      <LegalTabs
        tabs={tabs}
        panels={{
          overview: (
            <div className="space-y-4">
              {(["p1", "p2", "p3", "p4"] as const).map((key) => (
                <p key={key} className="text-sm/6 text-laku-ink">
                  {t(`communityRules.overview.${key}`)}
                </p>
              ))}
            </div>
          ),
          dos: (
            <div>
              <h2 className="mb-4 text-base font-bold text-laku-ink">
                {t("communityRules.dos.title")}
              </h2>
              {dosKeys.map((key) => (
                <LegalSection
                  key={key}
                  title={t(`communityRules.dos.sections.${key}.title`)}
                  body={t(`communityRules.dos.sections.${key}.body`)}
                />
              ))}
            </div>
          ),
          donts: (
            <div>
              <h2 className="mb-4 text-base font-bold text-laku-ink">
                {t("communityRules.donts.title")}
              </h2>
              {dontsKeys.map((key) => (
                <LegalSection
                  key={key}
                  title={t(`communityRules.donts.sections.${key}.title`)}
                  body={t(`communityRules.donts.sections.${key}.body`)}
                />
              ))}
            </div>
          ),
          summary: (
            <div>
              <h2 className="mb-4 text-base font-bold text-laku-ink">
                {t("communityRules.summary.title")}
              </h2>

              <div className="mb-4 rounded-xl bg-[#F0F9FF] p-4">
                <h3 className="mb-1.5 text-sm font-bold text-[#0C4A6E]">
                  {t("communityRules.summary.coreTitle")}
                </h3>
                <p className="text-sm/6 text-[#075985]">
                  {t("communityRules.summary.coreBody")}
                </p>
              </div>

              <div className="mb-4">
                <h3 className="mb-2 text-sm font-bold text-laku-ink">
                  {t("communityRules.summary.takeawaysTitle")}
                </h3>
                <LegalBody>{t("communityRules.summary.takeaways")}</LegalBody>
              </div>

              <div className="mb-4 rounded-xl bg-[#FEF3C7] p-4">
                <h3 className="mb-1.5 text-sm font-bold text-[#92400E]">
                  {t("communityRules.summary.enforcementTitle")}
                </h3>
                <p className="text-sm/6 text-[#B45309]">
                  {t("communityRules.summary.enforcementBody")}
                </p>
              </div>

              <div className="rounded-xl bg-[#ECFDF5] p-4">
                <h3 className="mb-1.5 text-sm font-bold text-[#065F46]">
                  {t("communityRules.summary.questionsTitle")}
                </h3>
                <p className="text-sm/6 text-[#047857]">
                  {t("communityRules.summary.questionsBody")}{" "}
                  <Link
                    href="/help"
                    className="font-semibold underline underline-offset-2"
                  >
                    {t("settings.rows.helpCenter")}
                  </Link>
                </p>
              </div>
            </div>
          ),
        }}
      />
    </div>
  );
}
