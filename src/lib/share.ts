import { APP_SCHEME, SITE_URL } from "@/lib/config";

export function productUrl(productId: string): string {
  return `/product/${encodeURIComponent(productId)}`;
}

/** Keep an in-progress "add to this order" id on the next search or product link. */
const APPEND_ORDER_STORAGE_KEY = "lakuAppendOrderId";

export function rememberAppendOrder(orderId?: string | null) {
  if (typeof window === "undefined") return;
  const id = orderId?.trim();
  if (!id) return;
  sessionStorage.setItem(APPEND_ORDER_STORAGE_KEY, id);
}

export function readAppendOrder(): string {
  if (typeof window === "undefined") return "";
  return sessionStorage.getItem(APPEND_ORDER_STORAGE_KEY)?.trim() || "";
}

export function clearAppendOrder() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(APPEND_ORDER_STORAGE_KEY);
}

export function keepAppendOrder(href: string, appendOrderId?: string | null): string {
  const id = appendOrderId?.trim();
  if (!id) return href;
  const hashIndex = href.indexOf("#");
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : "";
  const withoutHash = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
  const queryIndex = withoutHash.indexOf("?");
  const path = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
  const params = new URLSearchParams(queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : "");
  params.set("appendOrderId", id);
  return `${path}?${params.toString()}${hash}`;
}

export function absoluteProductUrl(productId: string): string {
  return `${SITE_URL}${productUrl(productId)}`;
}

/** Mirrors the app link produced by Linking.createURL('/product', { productId }). */
export function productAppUrl(productId: string): string {
  return `${APP_SCHEME}://product?productId=${encodeURIComponent(productId)}`;
}

export function distributorAppUrl(userId: number): string {
  return `${APP_SCHEME}://buyernetworks/distributor?userId=${userId}`;
}

export function homeAppUrl(): string {
  return `${APP_SCHEME}://home`;
}
