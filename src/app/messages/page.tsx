import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import MessagesList from "@/components/messages/MessagesList";
import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("messages.title"),
    robots: { index: false, follow: false },
  };
}

export default async function MessagesPage() {
  const t = await getTranslations();
  const session = await getSession();

  if (!session) {
    return (
      <SignedOutPrompt
        title={t("messages.signedOutTitle")}
        body={t("messages.signedOutBody")}
      />
    );
  }

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
        {t("messages.title")}
      </h1>
      <MessagesList userId={session.user.id} />
    </div>
  );
}
