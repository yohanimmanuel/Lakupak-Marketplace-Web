"use client";

import { useEffect } from "react";

import { beginEditCart, endEditCart, landedByBrowserBack, readEditCart } from "@/lib/editCart";
import { clearAppendOrder, rememberAppendOrder } from "@/lib/share";

export function RememberAppendOrder({ orderId }: { orderId?: string | null }) {
  useEffect(() => {
    if (orderId?.trim()) {
      if (landedByBrowserBack() && !readEditCart()) return;
      rememberAppendOrder(orderId);
      beginEditCart(orderId);
    } else {
      clearAppendOrder();
      endEditCart();
    }
  }, [orderId]);
  return null;
}

export function ClearAppendOrder() {
  useEffect(() => {
    clearAppendOrder();
    endEditCart();
  }, []);
  return null;
}
