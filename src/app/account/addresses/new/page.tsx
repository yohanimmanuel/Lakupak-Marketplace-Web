import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import AddressForm from "@/components/account/AddressForm";
import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("addresses.addNew"),
    robots: { index: false, follow: false },
  };
}

export default async function NewAddressPage() {
  const t = await getTranslations();
  const session = await getSession();

  if (!session) {
    return (
      <SignedOutPrompt
        title={t("account.signedOutTitle")}
        body={t("account.signedOutBody")}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <Link
        href="/account/addresses"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("addresses.title")}
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-laku-ink">
        {t("addresses.addNew")}
      </h1>
      <AddressForm />
    </div>
  );
}
