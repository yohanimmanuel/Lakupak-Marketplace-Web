import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import CartView from "@/components/cart/CartView";
import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { getCart } from "@/lib/api/cart";
import { getSession } from "@/lib/auth/session";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("cart.title"),
    description: t("cart.metaDescription"),
    robots: { index: false, follow: false },
  };
}

export default async function CartPage() {
  const t = await getTranslations();
  const session = await getSession();

  if (!session) {
    return (
      <SignedOutPrompt
        title={t("cart.signedOutTitle")}
        body={t("cart.signedOutBody")}
      />
    );
  }

  const items = await getCart({ userId: session.user.id, token: session.token });

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
        <div className="rounded-2xl bg-white p-12 text-center">
          <ShoppingCart className="mx-auto size-10 text-[#d1d5db]" aria-hidden />
          <h1 className="mt-4 text-lg font-bold text-laku-ink">
            {t("cart.emptyTitle")}
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm/6 text-laku-muted">
            {t("cart.emptyBody")}
          </p>
          <Link
            href="/search"
            className="mt-6 inline-flex rounded-lg bg-laku-blue px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
          >
            {t("cart.startShopping")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
      <h1 className="mb-6 text-2xl font-bold text-laku-ink">{t("cart.title")}</h1>
      <CartView items={items} />
    </div>
  );
}
