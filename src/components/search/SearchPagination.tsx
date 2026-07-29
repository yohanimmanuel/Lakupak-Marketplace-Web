import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { getTranslations } from "@/i18n/server";

type Props = {
  page: number;
  totalPages: number;
  q?: string;
  category?: string;
};

function buildHref(page: number, q?: string, category?: string): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}

export default async function SearchPagination({
  page,
  totalPages,
  q,
  category,
}: Props) {
  if (totalPages <= 1) return null;

  const t = await getTranslations();

  const linkClass =
    "inline-flex items-center gap-1 rounded-lg border border-laku-line bg-white px-4 py-2.5 text-sm font-semibold text-laku-ink transition-colors hover:border-laku-blue hover:text-laku-blue";
  const disabledClass =
    "inline-flex items-center gap-1 rounded-lg border border-laku-line bg-white px-4 py-2.5 text-sm font-semibold text-laku-faint";

  return (
    <nav
      aria-label={t("search.paginationAria")}
      className="mt-10 flex items-center justify-center gap-4"
    >
      {page > 1 ? (
        <Link href={buildHref(page - 1, q, category)} className={linkClass} rel="prev">
          <ChevronLeft className="size-4" aria-hidden />
          {t("search.previous")}
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled>
          <ChevronLeft className="size-4" aria-hidden />
          {t("search.previous")}
        </span>
      )}

      <span className="text-sm text-laku-muted">
        {t("search.pageOf", { page, total: totalPages })}
      </span>

      {page < totalPages ? (
        <Link href={buildHref(page + 1, q, category)} className={linkClass} rel="next">
          {t("search.next")}
          <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={disabledClass} aria-disabled>
          {t("search.next")}
          <ChevronRight className="size-4" aria-hidden />
        </span>
      )}
    </nav>
  );
}
