"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";

import { useTranslations } from "@/i18n/client";
import { upsertConversation } from "@/lib/messages";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

type Props = {
  userId: number | null;
  distributorId: number;
  name: string;
  phone: string | null;
  logoUrl?: string | null;
  productId?: string | null;
  productName?: string | null;
  orderId?: string | null;
  className?: string;
  label?: string;
};

export default function ContactSellerButton({
  userId,
  distributorId,
  name,
  phone,
  logoUrl,
  productId,
  productName,
  orderId,
  className,
  label,
}: Props) {
  const t = useTranslations();
  const [error, setError] = useState<string | null>(null);

  const openChat = () => {
    setError(null);
    if (!phone?.trim()) {
      setError(
        orderId
          ? t("messages.errors.sellerPhoneUnavailableForOrder", {
              orderId,
            })
          : productName
            ? t("messages.errors.sellerPhoneUnavailable")
            : t("messages.errors.businessPhoneUnavailable"),
      );
      return;
    }

    let text: string | undefined;
    if (orderId) {
      text = t("messages.whatsapp.orderUpdate", { orderId });
    } else if (productName) {
      text = t("messages.whatsapp.productInquiry", { productName });
    } else {
      text = t("messages.whatsapp.distributorMessage", { name });
    }

    const url = buildWhatsAppUrl({ phone, text });
    if (!url) {
      setError(t("messages.errors.businessPhoneUnavailable"));
      return;
    }

    if (userId != null) {
      upsertConversation(userId, {
        distributorId,
        name,
        phone,
        logoUrl: logoUrl ?? null,
        lastProductId: productId ?? null,
        lastProductName: productName ?? null,
      });
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="contents">
      <button
        type="button"
        onClick={openChat}
        className={
          className ??
          "inline-flex items-center gap-2 rounded-lg border border-laku-line bg-white px-3 py-2 text-sm font-semibold text-laku-ink transition-colors hover:bg-laku-surface"
        }
      >
        <MessageCircle className="size-4" aria-hidden />
        {label ?? t("messages.contactSeller")}
      </button>
      {error ? (
        <p role="alert" className="basis-full text-xs font-medium text-laku-alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
