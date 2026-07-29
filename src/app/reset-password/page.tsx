import type { Metadata } from "next";
import { redirect } from "next/navigation";

import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import { getTranslations } from "@/i18n/server";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("auth.forgotPassword.title"),
    robots: { index: false, follow: false },
  };
}

type SearchParams = Promise<{ email?: string; code?: string }>;

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations();
  const session = await getSession();
  if (session) redirect("/");

  const { email: emailParam, code: codeParam } = await searchParams;
  const email =
    typeof emailParam === "string" ? emailParam.trim().toLowerCase() : "";
  const code =
    typeof codeParam === "string"
      ? codeParam.replace(/\D/g, "").slice(0, 6)
      : "";

  const initialStep = email && code ? 2 : email ? 1 : 1;

  return (
    <div className="mx-auto max-w-md px-4 py-16 md:px-6">
      <h1 className="text-2xl font-bold text-laku-ink">
        {t("auth.forgotPassword.title")}
      </h1>

      <div className="mt-8 rounded-2xl bg-white p-6">
        <ForgotPasswordForm
          initialEmail={email}
          initialCode={code}
          initialStep={initialStep}
        />
      </div>
    </div>
  );
}
