import type { Metadata } from "next";
import { redirect } from "next/navigation";

import RegisterForm from "@/components/auth/RegisterForm";
import { getTranslations } from "@/i18n/server";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("auth.signup.title"),
    description: t("auth.registerMetaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function RegisterPage() {
  const session = await getSession();
  if (session) redirect("/");

  return (
    <div className="mx-auto max-w-md px-4 py-10 md:px-6 md:py-16">
      <RegisterForm />
    </div>
  );
}
