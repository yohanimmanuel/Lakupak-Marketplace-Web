import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import LoginForm from "@/components/auth/LoginForm";
import { getTranslations } from "@/i18n/server";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("nav.login"),
    description: t("auth.loginMetaDescription"),
    robots: { index: false, follow: false },
  };
}

type SearchParams = Promise<{ next?: string }>;

/** Only same-site paths are honoured, so `next` cannot be used as an open redirect. */
function safeRedirect(next?: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations();
  const { next } = await searchParams;
  const destination = safeRedirect(next);
  const session = await getSession();
  if (session) redirect(destination);

  return (
    <div className="mx-auto max-w-md px-4 py-16 md:px-6">
      <h1 className="text-2xl font-bold text-laku-ink">{t("auth.loginTitle")}</h1>
      <p className="mt-2 text-sm/6 text-laku-muted">{t("auth.loginSubtitle")}</p>

      <div className="mt-8 rounded-2xl bg-white p-6">
        <LoginForm redirectTo={destination} />
      </div>

      <p className="mt-6 text-center text-sm text-laku-muted">
        {t("auth.noAccount")}{" "}
        <Link href="/register" className="font-semibold text-laku-blue hover:underline">
          {t("nav.registerFree")}
        </Link>
      </p>
    </div>
  );
}
