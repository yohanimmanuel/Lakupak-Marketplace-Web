import { APP_SCHEME, SITE_URL } from "@/lib/config";

export function productUrl(productId: string): string {
  return `/product/${encodeURIComponent(productId)}`;
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
