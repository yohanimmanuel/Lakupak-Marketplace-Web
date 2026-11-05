"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import CheckoutForm from "@/components/checkout/CheckoutForm";
import type { CheckoutLine } from "@/app/checkout/page";
import { useTranslations } from "@/i18n/client";
import type { MarketplaceAddress } from "@/lib/api/addresses";
import { getAvailableDeliveryOptions, type DeliveryOptionId, type PaymentMethodId } from "@/lib/checkout";
import { readEditCart } from "@/lib/editCart";

type Buyer = {
  name: string;
  phone: string;
  storeName: string;
  address: string;
  email: string;
};

export default function EditCartCheckout({
  appendOrderId,
  existingLines,
  initialDelivery,
  initialPayment,
  addresses,
  buyer,
}: {
  appendOrderId: string;
  existingLines: CheckoutLine[];
  initialDelivery: DeliveryOptionId | null;
  initialPayment: PaymentMethodId | null;
  addresses: MarketplaceAddress[];
  buyer: Buyer;
}) {
  const t = useTranslations();
  const router = useRouter();
  const [addedLines, setAddedLines] = useState<CheckoutLine[] | null>(null);

  useEffect(() => {
    const session = readEditCart();
    if (!session || session.orderId !== appendOrderId) {
      router.replace("/orders");
      return;
    }
    const items = session.items;
    setAddedLines(
      items.map((item) => ({
        product: item.product,
        quantity: Math.max(1, item.quantity),
        variant: item.variant || "Default",
      })),
    );
  }, [appendOrderId, router]);

  if (!addedLines) return null;

  if (addedLines.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center md:px-6">
        <h1 className="text-lg font-bold text-laku-ink">{t("checkout.emptyTitle")}</h1>
        <p className="mt-2 text-sm text-laku-muted">{t("checkout.emptyBody")}</p>
        <Link
          href={`/search?appendOrderId=${encodeURIComponent(appendOrderId)}`}
          className="mt-6 inline-flex rounded-lg bg-laku-blue px-5 py-3 text-sm font-bold text-white"
        >
          {t("checkout.findProducts")}
        </Link>
      </div>
    );
  }

  const lines = [...existingLines, ...addedLines];
  const deliveryOptions = getAvailableDeliveryOptions(lines.map((line) => line.product));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="mb-6 text-2xl font-bold text-laku-ink">{t("checkout.title")}</h1>
      <CheckoutForm
        lines={lines}
        deliveryOptions={deliveryOptions}
        source="editCart"
        productId={null}
        appendOrderId={appendOrderId}
        initialDelivery={initialDelivery}
        initialPayment={initialPayment}
        addresses={addresses}
        buyer={buyer}
      />
    </div>
  );
}
