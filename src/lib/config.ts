/** Strip trailing slash so callers can safely append `/api/...`. */
function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

/**
 * Pick the Dashboard API origin for this process.
 *
 * Priority:
 * 1. `LAKU_API_BASE_URL` — explicit override (Docker Compose sets this)
 * 2. `LAKU_API_BASE_URL_PROD` when `NODE_ENV === "production"`
 * 3. `LAKU_API_BASE_URL_DEV` otherwise
 * 4. Built-in defaults (Render prod / localhost:3000)
 */
function resolveLakuApiBaseUrl(): string {
  const explicit = process.env.LAKU_API_BASE_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);

  const isProd = process.env.NODE_ENV === "production";
  const fromEnv = (
    isProd
      ? process.env.LAKU_API_BASE_URL_PROD
      : process.env.LAKU_API_BASE_URL_DEV
  )?.trim();

  if (fromEnv) return stripTrailingSlash(fromEnv);

  return isProd
    ? "https://lakupak-dashboard.onrender.com"
    : "http://localhost:3000";
}

function resolveDashboardUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_DASHBOARD_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);

  const isProd = process.env.NODE_ENV === "production";
  const fromEnv = (
    isProd
      ? process.env.NEXT_PUBLIC_DASHBOARD_URL_PROD
      : process.env.NEXT_PUBLIC_DASHBOARD_URL_DEV
  )?.trim();

  if (fromEnv) return stripTrailingSlash(fromEnv);

  // Same host as the API by default.
  return resolveLakuApiBaseUrl();
}

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);

  const isProd = process.env.NODE_ENV === "production";
  const fromEnv = (
    isProd
      ? process.env.NEXT_PUBLIC_SITE_URL_PROD
      : process.env.NEXT_PUBLIC_SITE_URL_DEV
  )?.trim();

  if (fromEnv) return stripTrailingSlash(fromEnv);

  return isProd
    ? "https://lakupak-marketplace-web.onrender.com"
    : "http://localhost:3002";
}

/** Laku Dashboard hosts the marketplace API. Server-side only: the browser never calls it directly. */
export const LAKU_API_BASE_URL = resolveLakuApiBaseUrl();

export const SITE_URL = resolveSiteUrl();

export const APP_SCHEME = process.env.NEXT_PUBLIC_APP_SCHEME ?? "lakupak";

export const ANDROID_STORE_URL =
  process.env.NEXT_PUBLIC_ANDROID_STORE_URL ??
  "https://play.google.com/store/apps/details?id=com.laku.marketplace";

export const IOS_STORE_URL =
  process.env.NEXT_PUBLIC_IOS_STORE_URL ?? "https://apps.apple.com/app/laku";

export const DASHBOARD_URL = resolveDashboardUrl();

/** Distributor marketing site on the Dashboard (`/[locale]/landing`). */
export function dashboardLandingUrl(locale: string = "id"): string {
  const lang = locale === "en" ? "en" : "id";
  return `${DASHBOARD_URL}/${lang}/landing`;
}

/** Session cookie holding the marketplace JWT issued by /api/mobile/auth/*. */
export const SESSION_COOKIE = "laku_mp_token";
export const SESSION_USER_COOKIE = "laku_mp_user";
