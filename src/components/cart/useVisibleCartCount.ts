"use client";

import { useEffect, useState } from "react";

import { readEditCart, subscribeEditCart } from "@/lib/editCart";

/** While an order edit is open, the badge counts that temporary cart. */
export function useVisibleCartCount(serverCount: number) {
  const [count, setCount] = useState(serverCount);

  useEffect(() => {
    const sync = () => {
      const editing = document.cookie
        .split("; ")
        .some((part) => part.startsWith("laku_edit_order=") && part.length > "laku_edit_order=".length);
      setCount(editing ? (readEditCart()?.items.length ?? 0) : serverCount);
    };
    sync();
    return subscribeEditCart(sync);
  }, [serverCount]);

  return count;
}
