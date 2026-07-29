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

export default async function ForgotPasswordPage() {
  const t = await getTranslations();
  const session = await getSession();
  if (session) redirect("/");

  return (
    <div className="mx-auto max-w-md px-4 py-16 md:px-6">
      <h1 className="text-2xl font-bold text-laku-ink">
        {t("auth.forgotPassword.title")}
      </h1>

      <div className="mt-8 rounded-2xl bg-white p-6">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
