import Link from "next/link";
import { UserRound } from "lucide-react";

import { getTranslations } from "@/i18n/server";

type Props = {
  title: string;
  body: string;
};

export default async function SignedOutPrompt({ title, body }: Props) {
  const t = await getTranslations();

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center md:px-6">
      <UserRound className="mx-auto size-10 text-laku-blue" aria-hidden />
      <h1 className="mt-4 text-xl font-bold text-laku-ink">{title}</h1>
      <p className="mt-2 text-sm/6 text-laku-muted">{body}</p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-laku-blue px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
        >
          {t("nav.login")}
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-laku-line bg-white px-5 py-3 text-sm font-bold text-laku-ink transition-colors hover:border-laku-blue hover:text-laku-blue"
        >
          {t("nav.registerFree")}
        </Link>
      </div>
    </div>
  );
}
