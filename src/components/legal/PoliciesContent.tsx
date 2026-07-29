"use client";

import LegalTabs, { LegalSection } from "@/components/legal/LegalTabs";
import { useTranslations } from "@/i18n/client";

const PRIVACY_SECTIONS = [
  "collect",
  "use",
  "share",
  "retention",
  "rights",
  "security",
  "children",
  "changes",
] as const;

const TERMS_SECTIONS = [
  "accounts",
  "orders",
  "wallet",
  "use",
  "ip",
  "liability",
  "termination",
  "law",
] as const;

export default function PoliciesContent() {
  const t = useTranslations();

  return (
    <div className="rounded-2xl bg-white p-5 md:p-6">
      <LegalTabs
        tabs={[
          { id: "privacy", label: t("policies.tabs.privacy") },
          { id: "terms", label: t("policies.tabs.terms") },
        ]}
        panels={{
          privacy: (
            <div>
              <h2 className="mb-3 text-lg font-bold text-laku-ink">
                {t("policies.privacy.title")}
              </h2>
              <p className="mb-5 text-sm/6 text-laku-muted">
                {t("policies.privacy.intro")}
              </p>
              {PRIVACY_SECTIONS.map((key) => (
                <LegalSection
                  key={key}
                  title={t(`policies.privacy.sections.${key}Title`)}
                  body={t(`policies.privacy.sections.${key}Body`)}
                />
              ))}
            </div>
          ),
          terms: (
            <div>
              <h2 className="mb-3 text-lg font-bold text-laku-ink">
                {t("policies.terms.title")}
              </h2>
              <p className="mb-5 text-sm/6 text-laku-muted">
                {t("policies.terms.intro")}
              </p>
              {TERMS_SECTIONS.map((key) => (
                <LegalSection
                  key={key}
                  title={t(`policies.terms.sections.${key}Title`)}
                  body={t(`policies.terms.sections.${key}Body`)}
                />
              ))}
            </div>
          ),
        }}
      />
    </div>
  );
}
