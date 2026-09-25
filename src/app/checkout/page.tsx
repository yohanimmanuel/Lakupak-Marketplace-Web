import type { Metadata } from "next";
import Link from "next/link";

import CheckoutForm from "@/components/checkout/CheckoutForm";
import SignedOutPrompt from "@/components/auth/SignedOutPrompt";
import { getTranslations } from "@/i18n/server";
import { listAddresses } from "@/lib/api/addresses";
import { getCart, getCartQuantity } from "@/lib/api/cart";
import { getProductById } from "@/lib/api/marketplace";
import { getProfile } from "@/lib/api/profile";
import { getSession } from "@/lib/auth/session";
import type { MarketplaceProduct } from "@/lib/api/types";
import { getAvailableDeliveryOptions, getMinPackageQuantity } from "@/lib/checkout";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();

  return {
    title: t("checkout.title"),
    description: t("checkout.metaDescription"),
    robots: { index: false, follow: false },
  };
}

type SearchParams = Promise<{
  productId?: string;
  quantity?: string;
  variant?: string;
}>;

export type CheckoutLine = {
  product: MarketplaceProduct;
  quantity: number;
  variant?: string;
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const t = await getTranslations();
  const session = await getSession();

  if (!session) {
    return (
      <SignedOutPrompt
        title={t("checkout.signedOutTitle")}
        body={t("checkout.signedOutBody")}
      />
    );
  }

  const { productId, quantity, variant } = await searchParams;
  const isDirect = Boolean(productId);
  const variantName = variant?.trim() || "Default";

  const [lines, profile, addresses] = await Promise.all([
    isDirect
      ? getProductById(productId!).then((product) => {
          if (!product) return [] as CheckoutLine[];
          const requested = Math.max(1, Number(quantity) || 1);
          return [
            {
              product,
              quantity: Math.max(
                requested,
                getMinPackageQuantity(product, variantName),
              ),
              variant: variantName,
            },
          ];
        })
      : getCart({ userId: session.user.id, token: session.token }).then((items) =>
          items.map((item) => ({
            product: item.productData,
            quantity: getCartQuantity(item),
            variant: item.metadata?.variant?.trim() || "Default",
          })),
        ),
    getProfile({ userId: session.user.id, token: session.token }),
    listAddresses({ userId: session.user.id, token: session.token }),
  ]);

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center md:px-6">
        <h1 className="text-lg font-bold text-laku-ink">{t("checkout.emptyTitle")}</h1>
        <p className="mt-2 text-sm text-laku-muted">{t("checkout.emptyBody")}</p>
        <Link
          href="/search"
          className="mt-6 inline-flex rounded-lg bg-laku-blue px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-laku-blue-dark"
        >
          {t("checkout.findProducts")}
        </Link>
      </div>
    );
  }

  const deliveryOptions = getAvailableDeliveryOptions(lines.map((line) => line.product));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="mb-6 text-2xl font-bold text-laku-ink">{t("checkout.title")}</h1>
      <CheckoutForm
        lines={lines}
        deliveryOptions={deliveryOptions}
        source={isDirect ? "direct" : "cart"}
        productId={productId ?? null}
        addresses={addresses}
        buyer={{
          name: profile?.name ?? session.user.name ?? "",
          phone: profile?.phone ?? "",
          storeName: profile?.storeName ?? "",
          address: profile?.chosenAddress ?? session.user.address ?? "",
          email: profile?.email ?? session.user.email ?? "",
        }}
      />
    </div>
  );
}
