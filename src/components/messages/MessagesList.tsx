"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ChevronRight, MessageCircle, Store } from "lucide-react";

import { useTranslations } from "@/i18n/client";
import {
  listConversations,
  type MessageConversation,
} from "@/lib/messages";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export default function MessagesList({ userId }: { userId: number }) {
  const t = useTranslations();
  const [items, setItems] = useState<MessageConversation[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(listConversations(userId));
  }, [userId]);

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-white px-5 py-12 text-center">
        <MessageCircle className="mx-auto size-8 text-laku-faint" aria-hidden />
        <p className="mt-3 text-sm font-semibold text-laku-ink">
          {t("messages.list.emptyTitle")}
        </p>
        <p className="mt-1 text-sm text-laku-muted">
          {t("messages.list.emptyBody")}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white">
      {error ? (
        <p role="alert" className="border-b border-laku-line px-5 py-3 text-sm text-laku-alert">
          {error}
        </p>
      ) : null}
      <ul>
        {items.map((item) => (
          <li key={item.distributorId}>
            <button
              type="button"
              aria-label={t("messages.a11y.openChatWith", { name: item.name })}
              onClick={() => {
                setError(null);
                if (!item.phone?.trim()) {
                  setError(t("messages.errors.businessPhoneUnavailable"));
                  return;
                }
                const url = buildWhatsAppUrl({ phone: item.phone });
                if (!url) {
                  setError(t("messages.errors.businessPhoneUnavailable"));
                  return;
                }
                window.open(url, "_blank", "noopener,noreferrer");
              }}
              className="flex w-full items-center gap-3 border-t border-[#f3f4f6] px-5 py-4 text-left transition-colors first:border-t-0 hover:bg-laku-blue/5"
            >
              <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-laku-chip">
                {item.logoUrl ? (
                  <Image
                    src={item.logoUrl}
                    alt=""
                    fill
                    sizes="44px"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <Store className="size-5 text-laku-faint" aria-hidden />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-laku-ink">
                  {item.name}
                </span>
                <span className="block truncate text-xs text-laku-muted">
                  {item.phone?.trim() || t("messages.list.noBusinessPhone")}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-laku-faint" aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
