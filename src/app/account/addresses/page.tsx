import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MapPin, Plus } from "lucide-react";

import DeleteAddressButton from "@/components/account/DeleteAddressButton";
import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { listAddresses } from "@/lib/api/addresses";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("addresses.title"),
    robots: { index: false, follow: false },
  };
}

export default async function AddressesPage() {
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

  const addresses = await listAddresses({
    userId: session.user.id,
    token: session.token,
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 md:px-6">
      <Link
        href="/account"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("profile.backToAccount")}
      </Link>

      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-laku-ink">{t("addresses.title")}</h1>
        <Link
          href="/account/addresses/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-laku-blue px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
        >
          <Plus className="size-4" aria-hidden />
          {t("addresses.addNew")}
        </Link>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-2xl bg-white px-5 py-12 text-center">
          <MapPin className="mx-auto size-8 text-laku-faint" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-laku-ink">
            {t("addresses.emptyTitle")}
          </p>
          <p className="mt-1 text-sm text-laku-muted">{t("addresses.emptyBody")}</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {addresses.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl bg-white p-4 transition-colors hover:bg-laku-blue/5"
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/account/addresses/${item.id}`}
                  className="min-w-0 flex-1"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-laku-ink">
                      {item.fullName}
                    </p>
                    {item.label ? (
                      <span className="rounded bg-laku-chip px-1.5 py-0.5 text-[10px] font-semibold uppercase text-laku-muted">
                        {item.label === "home" ||
                        item.label === "work" ||
                        item.label === "store"
                          ? t(`addresses.labels.${item.label}`)
                          : item.label}
                      </span>
                    ) : null}
                    {item.isDefault ? (
                      <span className="rounded bg-laku-blue/10 px-1.5 py-0.5 text-[10px] font-bold text-laku-blue">
                        {t("addresses.defaultBadge")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-laku-muted">{item.phone}</p>
                  <p className="mt-1 text-sm text-laku-ink">{item.address}</p>
                </Link>
                <DeleteAddressButton addressId={item.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
