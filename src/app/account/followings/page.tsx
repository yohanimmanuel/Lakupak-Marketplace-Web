import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Store, Users } from "lucide-react";

import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { listFollowedDistributors } from "@/lib/api/following";
import { getSession } from "@/lib/auth/session";
import { formatDate } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("followingsPage.title"),
    robots: { index: false, follow: false },
  };
}

export default async function FollowingsPage() {
  const t = await getTranslations();
  const session = await getSession();

  if (!session) {
    return (
      <SignedOutPrompt
        title={t("followingsPage.states.loginRequiredTitle")}
        body={t("followingsPage.states.loginRequiredBody")}
      />
    );
  }

  const items = await listFollowedDistributors({ token: session.token });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <Link
        href="/account"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-laku-blue transition-colors hover:text-laku-blue-dark"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("common.back")}
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-laku-ink">
        {t("followingsPage.title")}
      </h1>

      {items.length === 0 ? (
        <div className="rounded-2xl bg-white px-5 py-12 text-center">
          <Users className="mx-auto size-8 text-laku-faint" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-laku-ink">
            {t("followingsPage.states.emptyTitle")}
          </p>
          <p className="mt-1 text-sm text-laku-muted">
            {t("followingsPage.states.emptyBody")}
          </p>
        </div>
      ) : (
        <ul className="overflow-hidden rounded-2xl bg-white">
          {items.map((item) => (
            <li key={item.distributorId}>
              <Link
                href={`/distributor/${item.distributorId}`}
                aria-label={t("followingsPage.a11y.openStore", {
                  name: item.name,
                })}
                className="flex items-center gap-3 border-t border-[#f3f4f6] px-5 py-4 transition-colors first:border-t-0 hover:bg-laku-blue/5"
              >
                <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-laku-chip">
                  {item.logo ? (
                    <Image
                      src={item.logo}
                      alt=""
                      fill
                      sizes="44px"
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <Store className="size-5 text-laku-faint" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-laku-ink">
                    {item.name}
                  </span>
                  <span className="block text-xs text-laku-muted">
                    {t("followingsPage.row.followed")}
                    {item.followedAt
                      ? ` · ${formatDate(item.followedAt, t.locale)}`
                      : null}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-laku-faint" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
