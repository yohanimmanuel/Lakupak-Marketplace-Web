"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { clearBrowserBack, endEditCart, markBrowserBack, readEditCart } from "@/lib/editCart";

function editSessionStillOpen(orderId: string | null) {
  const session = readEditCart();
  const cookieOpen = document.cookie.split("; ").some((part) => {
    const [key, value] = part.split("=");
    return key === "laku_edit_order" && Boolean(value);
  });
  if (!session || !cookieOpen) return false;
  return !orderId || session.orderId === orderId;
}

/** Browser Back after a confirmed edit should not reopen that edit. */
export default function UnwindFinishedEdit() {
  const router = useRouter();

  useEffect(() => {
    const unwind = () => {
      const url = new URL(window.location.href);
      const orderId = url.searchParams.get("appendOrderId") || url.searchParams.get("editOrderId");
      const editCart = url.searchParams.has("editCart");
      if (!orderId && !editCart) return;
      if (editSessionStillOpen(orderId)) return;

      endEditCart();
      if (url.pathname.startsWith("/checkout")) {
        router.replace("/orders");
        return;
      }

      url.searchParams.delete("appendOrderId");
      url.searchParams.delete("editOrderId");
      url.searchParams.delete("editCart");
      const next = url.searchParams.size
        ? `${url.pathname}?${url.searchParams.toString()}`
        : url.pathname;
      router.replace(next);
    };

    const onPop = () => {
      markBrowserBack();
      unwind();
      window.setTimeout(clearBrowserBack, 1500);
    };

    const onShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      onPop();
    };

    window.addEventListener("popstate", onPop);
    window.addEventListener("pageshow", onShow);
    window.addEventListener("pointerdown", clearBrowserBack, true);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("pageshow", onShow);
      window.removeEventListener("pointerdown", clearBrowserBack, true);
    };
  }, [router]);

  return null;
}
