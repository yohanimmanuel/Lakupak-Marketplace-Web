import Link from "next/link";

import { getTranslations } from "@/i18n/server";

type Props = {
  title: string;
  href?: string;
  linkLabel?: string;
};

export default async function SectionHeader({ title, href, linkLabel }: Props) {
  const t = await getTranslations();

  return (
    <div className="mb-4 flex items-center justify-between gap-4 px-4 md:px-0">
      <h2 className="text-lg font-bold text-laku-ink">{title}</h2>
      {href ? (
        <Link
          href={href}
          className="text-sm font-semibold text-laku-blue hover:underline"
        >
          {linkLabel ?? t("common.viewAll")}
        </Link>
      ) : null}
    </div>
  );
}
