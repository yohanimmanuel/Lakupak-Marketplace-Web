import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import ProfileForm from "@/components/account/ProfileForm";
import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { getProfile } from "@/lib/api/profile";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return { title: t("profile.metaTitle"), robots: { index: false, follow: false } };
}

export default async function ProfilePage() {
  const [session, t] = await Promise.all([getSession(), getTranslations()]);

  if (!session) {
    return (
      <SignedOutPrompt
        title={t("profile.signedOutTitle")}
        body={t("profile.signedOutBody")}
      />
    );
  }

  const profile = await getProfile({
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

      <h1 className="text-2xl font-bold text-laku-ink">{t("profile.title")}</h1>
      <p className="mt-1 text-sm text-laku-muted">{t("profile.subtitle")}</p>

      <ProfileForm
        profile={{
          username: profile?.username ?? "",
          name: profile?.name ?? session.user.name ?? "",
          storeName: profile?.storeName ?? "",
          email: profile?.email ?? session.user.email ?? "",
          phone: profile?.phone ?? "",
          bio: profile?.bio ?? "",
          chosenAddress: profile?.chosenAddress ?? "",
          country: profile?.country ?? "",
          image: profile?.image ?? "",
        }}
      />
    </div>
  );
}
