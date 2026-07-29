import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import AddressForm from "@/components/account/AddressForm";
import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { listAddresses } from "@/lib/api/addresses";
import { getSession } from "@/lib/auth/session";

type Params = Promise<{ id: string }>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("addresses.editTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function EditAddressPage({ params }: { params: Params }) {
  const t = await getTranslations();
  const session = await getSession();
  const { id: idParam } = await params;
  const id = Number.parseInt(idParam, 10);

  if (!session) {
    return (
      <SignedOutPrompt
        title={t("account.signedOutTitle")}
        body={t("account.signedOutBody")}
      />
    );
  }

  if (!Number.isFinite(id)) notFound();

  const addresses = await listAddresses({
    userId: session.user.id,
    token: session.token,
  });
  const address = addresses.find((item) => item.id === id);
  if (!address) notFound();

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
        {t("addresses.editTitle")}
      </h1>
      <AddressForm address={address} />
    </div>
  );
}
