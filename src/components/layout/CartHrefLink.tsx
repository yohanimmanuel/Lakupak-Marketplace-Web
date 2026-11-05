"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ComponentProps } from "react";

import { useVisibleCartCount } from "@/components/cart/useVisibleCartCount";
import { useTranslations } from "@/i18n/client";
import { keepAppendOrder } from "@/lib/share";

type Props = Omit<ComponentProps<typeof Link>, "href"> & {
  href?: string;
  cartCount?: number;
};

/** Keeps the edited order on the cart link only while that order is in the current URL. */
export default function CartHrefLink({ href = "/cart", cartCount = 0, children, ...props }: Props) {
  const t = useTranslations();
  const params = useSearchParams();
  const count = useVisibleCartCount(cartCount);
  const badge = count > 99 ? "99+" : count > 0 ? String(count) : null;
  const ariaLabel =
    count > 0 ? t("header.cartCountAria", { count }) : t("header.cartAria");
  return (
    <Link
      href={keepAppendOrder(href, params.get("appendOrderId"))}
      {...props}
      aria-label={ariaLabel}
    >
      {children}
      {badge ? (
        <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-laku-alert px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
