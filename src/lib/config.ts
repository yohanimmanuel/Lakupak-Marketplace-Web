/** Laku Dashboard hosts the marketplace API. Server-side only: the browser never calls it directly. */
export const LAKU_API_BASE_URL = (
  process.env.LAKU_API_BASE_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3002"
).replace(/\/$/, "");

export const APP_SCHEME = process.env.NEXT_PUBLIC_APP_SCHEME ?? "lakupak";

export const ANDROID_STORE_URL =
  process.env.NEXT_PUBLIC_ANDROID_STORE_URL ??
  "https://play.google.com/store/apps/details?id=com.laku.marketplace";

export const IOS_STORE_URL =
  process.env.NEXT_PUBLIC_IOS_STORE_URL ?? "https://apps.apple.com/app/laku";

export const DASHBOARD_URL = (
  process.env.NEXT_PUBLIC_DASHBOARD_URL ?? "http://localhost:3000"
).replace(/\/$/, "");

/** Distributor marketing site on the Dashboard (`/[locale]/landing`). */
export function dashboardLandingUrl(locale: string = "id"): string {
  const lang = locale === "en" ? "en" : "id";
  return `${DASHBOARD_URL}/${lang}/landing`;
}

/** Session cookie holding the marketplace JWT issued by /api/mobile/auth/*. */
export const SESSION_COOKIE = "laku_mp_token";
export const SESSION_USER_COOKIE = "laku_mp_user";
