import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getTranslations } from "@/i18n/server";
import { getLatestUpdate } from "@/lib/api/marketplace";
import { formatDate } from "@/lib/format";

export const revalidate = 300;

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const t = await getTranslations();
  const { id } = await params;
  const promo = await getLatestUpdate(Number(id));

  if (!promo) return { title: t("promo.notFound") };

  return {
    title: promo.title,
    description: promo.body?.slice(0, 160),
    alternates: { canonical: `/promo/${id}` },
    openGraph: {
      title: promo.title,
      description: promo.body?.slice(0, 160),
      images: promo.imageUrl ? [{ url: promo.imageUrl }] : undefined,
    },
  };
}

export default async function PromoPage({ params }: { params: Params }) {
  const t = await getTranslations();
  const { id } = await params;
  const promo = await getLatestUpdate(Number(id));

  if (!promo) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <Link href="/" className="text-sm font-semibold text-laku-blue hover:underline">
        ← {t("promo.back")}
      </Link>

      <h1 className="mt-6 text-3xl font-bold text-balance text-laku-ink">
        {promo.title}
      </h1>
      {promo.publishedAt ? (
        <p className="mt-2 text-sm text-laku-muted">
          {formatDate(promo.publishedAt, t.locale)}
        </p>
      ) : null}

      {promo.imageUrl ? (
        <div className="relative mt-8 aspect-2/1 overflow-hidden rounded-2xl bg-laku-chip">
          <Image
            src={promo.imageUrl}
            alt=""
            fill
            priority
            sizes="(min-width: 768px) 48rem, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}

      <p className="mt-8 text-base/7 whitespace-pre-line text-laku-muted">
        {promo.body}
      </p>

      <Link
        href="/search"
        className="mt-10 inline-flex rounded-lg bg-laku-blue px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
      >
        {t("promo.browse")}
      </Link>
    </article>
  );
}
