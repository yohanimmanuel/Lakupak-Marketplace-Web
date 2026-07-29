import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

import LogoutButton from "@/components/auth/LogoutButton";
import { LANGUAGE_LABELS } from "@/i18n/config";
import { getLocale, getTranslations } from "@/i18n/server";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("settings.title"), robots: { index: false, follow: false } };
}

export default async function SettingsPage() {
  const [session, t, locale] = await Promise.all([
    getSession(),
    getTranslations(),
    getLocale(),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <Link
        href={session ? "/account" : "/"}
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {session ? t("profile.backToAccount") : t("nav.home")}
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-laku-ink">{t("settings.title")}</h1>

      {session ? (
        <Section title={t("settings.sections.myAccount")}>
          <Row
            title={t("settings.rows.accountSecurity")}
            href="/account/profile"
          />
          <Row title={t("settings.rows.myAddresses")} href="/account/addresses" />
          {/* Linked Payment Methods — not available on web yet (same as mobile dead row).
          <Row title={t("settings.rows.linkedPayments")} />
          */}
        </Section>
      ) : null}

      <Section title={t("settings.sections.settings")}>
        {session ? (
          <Row
            title={t("settings.rows.notificationSettings")}
            href="/notifications"
          />
        ) : null}
        <Row
          title={t("settings.rows.languageSettings")}
          href="/settings/language"
          note={LANGUAGE_LABELS[locale]}
        />
      </Section>

      <Section title={t("settings.sections.support")}>
        <Row title={t("settings.rows.helpCenter")} href="/help" />
        <Row title={t("settings.rows.communityRules")} href="/community-rules" />
        <Row title={t("settings.rows.policies")} href="/policies" />
      </Section>

      {session ? (
        <div className="mt-6">
          <LogoutButton />
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-4">
      <h2 className="px-1 pb-2 text-sm font-semibold text-laku-muted">{title}</h2>
      <div className="overflow-hidden rounded-2xl bg-white">{children}</div>
    </section>
  );
}

function Row({
  title,
  href,
  note,
}: {
  title: string;
  href?: string;
  note?: string;
}) {
  const content = (
    <>
      <span className="flex-1 text-sm font-medium text-laku-ink">{title}</span>
      {note ? <span className="text-sm text-laku-muted">{note}</span> : null}
      <ChevronRight className="size-4 shrink-0 text-laku-muted" aria-hidden />
    </>
  );

  const className =
    "flex items-center gap-3 border-b border-[#f3f4f6] px-5 py-4 last:border-b-0";

  if (!href) {
    return <div className={`${className} cursor-default opacity-60`}>{content}</div>;
  }

  return (
    <Link href={href} className={`${className} transition-colors hover:bg-laku-blue/5`}>
      {content}
    </Link>
  );
}
